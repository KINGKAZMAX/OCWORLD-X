"""自习室预约系统 API"""

import asyncio
import json
import ssl
import base64
from datetime import datetime
import time
import binascii
import sqlite3
from pathlib import Path
from typing import Optional, List

import aiohttp
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.bindaccount import BindAccount
from ..routers.auth import get_current_active_user
from ..routers.bindaccount import decrypt_password

try:
    import ddddocr
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("警告: ddddocr 未安装，请运行: pip install ddddocr")

router = APIRouter(prefix="/api/study-room", tags=["自习室预约"])

# 公共请求头
COMMON_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,de;q=0.7",
    "Cache-Control": "no-cache",
    "Origin": "http://rgyy.wfust.edu.cn",
    "Pragma": "no-cache",
    "Referer": "http://rgyy.wfust.edu.cn/h5/",
    "User-Agent": "Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
    "X-Requested-With": "XMLHttpRequest",
}

# Token 缓存（内存缓存，重启后需重新登录）
_token_cache: dict = {}


def get_ssl_context():
    """创建不验证证书的SSL上下文"""
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    return ssl_context


async def http_request(url, method="GET", headers=None, data=None):
    """通用异步HTTP请求函数"""
    req_headers = COMMON_HEADERS.copy()
    if headers:
        req_headers.update(headers)
    
    connector = aiohttp.TCPConnector(ssl=get_ssl_context())
    timeout = aiohttp.ClientTimeout(total=30)
    
    try:
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            async with session.request(method, url, headers=req_headers, data=data) as response:
                return {
                    "status": response.status,
                    "data": await response.read(),
                    "headers": dict(response.headers),
                }
    except Exception as e:
        print(f"请求失败: {e}")
        return None


def _b64url_decode(data: str) -> bytes:
    data = data.encode("utf-8")
    data += b"=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data)


def normalize_token(token: str) -> str:
    t = token.strip()
    if t.lower().startswith("bearer"):
        t = t[6:]
    return t.strip()


def parse_jwt_exp(token: str) -> dict:
    """解析 JWT payload"""
    try:
        token = normalize_token(token)
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("token 不是标准 JWT")
        payload_raw = _b64url_decode(parts[1]).decode("utf-8")
        payload = json.loads(payload_raw)
        now = int(time.time())
        exp = payload.get("exp")
        return {
            "payload": payload,
            "now": now,
            "exp": exp,
            "expires_in": (int(exp) - now) if isinstance(exp, int) else None,
            "expired": (now >= int(exp)) if isinstance(exp, int) else None,
        }
    except Exception as e:
        return {"error": str(e)}


def token_is_valid(token: str, min_ttl_seconds: int = 60) -> bool:
    info = parse_jwt_exp(token)
    if info.get("error"):
        return False
    expires_in = info.get("expires_in")
    if not isinstance(expires_in, int):
        return False
    return expires_in > min_ttl_seconds


def aes_encrypt(data: dict) -> str:
    """AES CBC 加密"""
    date_str = datetime.now().strftime("%Y%m%d")
    key = date_str + date_str[::-1]
    iv = "ZZWBKJ_ZHIHUAWEI"
    
    key_bytes = key.encode("utf-8")
    iv_bytes = iv.encode("utf-8")
    plaintext = json.dumps(data, separators=(",", ":")).encode("utf-8")
    
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv_bytes)
    ciphertext = cipher.encrypt(pad(plaintext, AES.block_size))
    return base64.b64encode(ciphertext).decode("utf-8")


async def login_verify():
    """获取验证码"""
    url = "http://rgyy.wfust.edu.cn/v4/login/verify"
    result = await http_request(url, method="POST", data=b"")
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


def recognize_captcha(image_data):
    """识别验证码"""
    if not OCR_AVAILABLE:
        return None
    
    ocr = ddddocr.DdddOcr(show_ad=False)
    
    if isinstance(image_data, str):
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        image_data = image_data.replace("\r", "").replace("\n", "").strip()
        image_bytes = base64.b64decode(image_data)
    else:
        image_bytes = image_data
    
    return ocr.classification(image_bytes)


async def get_and_recognize_captcha():
    """获取并识别验证码"""
    response = await login_verify()
    
    if response is None:
        return None, None
    
    if isinstance(response, dict):
        image_data = None
        if "data" in response and isinstance(response["data"], dict):
            if "base64" in response["data"]:
                image_data = response["data"]["base64"]
        
        if not image_data:
            for key in ["img", "image", "captcha", "verifyCode", "base64", "code"]:
                if key in response and isinstance(response[key], str):
                    image_data = response[key]
                    break
        
        if image_data and OCR_AVAILABLE:
            captcha_text = recognize_captcha(image_data)
            return response, captcha_text
        
        return response, None
    
    return response, None


async def do_login(username: str, password: str, key: str, code: str) -> dict:
    """登录接口"""
    url = "http://rgyy.wfust.edu.cn/v4/login/login"
    
    login_data = {
        "key": key,
        "open_id": None,
        "username": username,
        "password": password,
        "code": code,
    }
    
    encrypted = aes_encrypt(login_data)
    payload = {"aesjson": encrypted}
    
    headers = {"Content-Type": "application/json"}
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


async def login_with_captcha(username: str, password: str, max_attempts: int = 5) -> str | None:
    """自动识别验证码登录"""
    for attempt in range(1, max_attempts + 1):
        response, captcha = await get_and_recognize_captcha()

        if not response or not captcha:
            await asyncio.sleep(0.2)
            continue

        captcha = "".join(ch for ch in str(captcha).strip() if ch.isalnum())
        if not captcha:
            await asyncio.sleep(0.2)
            continue

        key = response.get("data", {}).get("key", "")

        result = await do_login(username, password, key, captcha)

        if isinstance(result, dict) and result.get("code") == 0:
            token = result.get("data", {}).get("token")
            if isinstance(token, str) and token:
                return normalize_token(token)

        await asyncio.sleep(0.2)

    return None


async def ensure_token(username: str, password: str) -> str:
    """确保获取有效 token"""
    cache_key = username
    
    # 检查缓存
    if cache_key in _token_cache:
        cached = _token_cache[cache_key]
        if token_is_valid(cached):
            return cached
    
    # 重新登录
    token = await login_with_captcha(username, password)
    if not token:
        raise HTTPException(status_code=401, detail="自习室系统登录失败，请检查账号密码")
    
    _token_cache[cache_key] = token
    return token


async def get_space_list(
    token: str, 
    date: str = None, 
    premises_ids: list = None,
    storey_ids: list = None,
    category_ids: list = None,
    boutique_ids: list = None
) -> dict:
    """获取自习室列表"""
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    if premises_ids is None:
        premises_ids = ["1"]
    if storey_ids is None:
        storey_ids = []
    if category_ids is None:
        category_ids = []
    if boutique_ids is None:
        boutique_ids = []
    
    url = "http://rgyy.wfust.edu.cn/v4/space/pick"
    
    payload = {
        "premisesIds": premises_ids,
        "categoryIds": category_ids,
        "storeyIds": storey_ids,
        "boutiqueIds": boutique_ids,
        "date": date,
    }
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


async def get_space_map(token: str, area_id: str, day: str, start_time: str = "", end_time: str = "") -> dict:
    """获取座位地图"""
    url = "http://rgyy.wfust.edu.cn/v4/Space/map"
    
    payload = {
        "id": area_id,
        "day": day,
        "start_time": start_time,
        "end_time": end_time,
    }
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


async def get_seat_list(token: str, area_id: str, day: str, start_time: str = "", end_time: str = "") -> dict:
    """获取座位列表"""
    url = "http://rgyy.wfust.edu.cn/v4/Space/seat"
    
    payload = {
        "id": area_id,
        "day": day,
        "start_time": start_time,
        "end_time": end_time,
    }
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


async def confirm_seat(token: str, seat_id: str, segment: str, day: str, start_time: str = "", end_time: str = "") -> dict:
    """预约座位"""
    url = "http://rgyy.wfust.edu.cn/v4/space/confirm"
    
    confirm_data = {
        "seat_id": seat_id,
        "segment": segment,
        "day": day,
        "start_time": start_time,
        "end_time": end_time,
    }
    
    encrypted = aes_encrypt(confirm_data)
    payload = {"aesjson": encrypted}
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


# ============ 请求模型 ============

class LoginRequest(BaseModel):
    username: str
    password: str


class SpacePickRequest(BaseModel):
    date: Optional[str] = None
    premises_ids: Optional[List[str]] = None
    storey_ids: Optional[List[str]] = None
    category_ids: Optional[List[str]] = None
    boutique_ids: Optional[List[str]] = None


class MapRequest(BaseModel):
    id: str
    day: str
    start_time: str = ""
    end_time: str = ""


class SeatListRequest(BaseModel):
    id: str
    day: str
    start_time: str = ""
    end_time: str = ""


class SeatReserveRequest(BaseModel):
    id: str
    segment: str
    day: str
    start_time: str = ""
    end_time: str = ""


class CollectTimeRequest(BaseModel):
    type: str = "1"  # 类型，默认为1


class OftenRequest(BaseModel):
    type: str = "1"
    day: str  # 日期，如 "2026-01-23"
    begin_time: str = "06:00"
    end_time: str = "22:30"


# ============ 辅助函数 ============

async def get_study_room_credentials(current_user: User, db: Session) -> tuple:
    """获取用户绑定的自习室账号密码"""
    account = db.query(BindAccount).filter(
        BindAccount.user_id == current_user.id,
        BindAccount.account_type == "study_room"
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="未绑定自习室账号，请先绑定")
    
    return account.username, decrypt_password(account.password)


# ============ API 路由 ============

@router.post("/login", summary="自习室系统登录验证")
async def api_login(req: LoginRequest):
    """直接登录自习室系统（用于验证账号密码是否正确）"""
    token = await login_with_captcha(req.username, req.password)
    if not token:
        raise HTTPException(status_code=401, detail="登录失败，请检查账号密码")
    
    return {
        "code": 0,
        "message": "登录成功",
        "data": {
            "token": token,
            "token_info": parse_jwt_exp(token)
        }
    }


@router.get("/userinfo", summary="获取自习室用户信息")
async def api_userinfo(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取自习室系统用户信息（姓名、学号等）"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    # 从JWT中解析用户信息
    token_info = parse_jwt_exp(token)
    if token_info.get("error"):
        raise HTTPException(status_code=500, detail="解析用户信息失败")
    
    payload = token_info.get("payload", {})
    return {
        "code": 0,
        "message": "success",
        "data": {
            "name": payload.get("name", ""),
            "id": payload.get("id", ""),
            "card": payload.get("card", ""),
            "roleName": payload.get("roleName", ""),
            "deptName": payload.get("deptName", ""),
        }
    }


@router.post("/spaces", summary="获取自习室列表")
async def api_spaces(
    req: SpacePickRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取自习室列表（需要先绑定自习室账号）"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_space_list(
        token, req.date, req.premises_ids, 
        req.storey_ids, req.category_ids, req.boutique_ids
    )
    
    # 检查是否被顶掉登录
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_space_list(
            token, req.date, req.premises_ids,
            req.storey_ids, req.category_ids, req.boutique_ids
        )
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取自习室列表失败")
    return data


@router.post("/map", summary="获取座位地图")
async def api_map(
    req: MapRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取座位地图数据"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_space_map(token, req.id, req.day, req.start_time, req.end_time)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_space_map(token, req.id, req.day, req.start_time, req.end_time)
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取座位地图失败")
    return data


@router.post("/seatList", summary="获取座位列表")
async def api_seat_list(
    req: SeatListRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取座位列表"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_seat_list(token, req.id, req.day, req.start_time, req.end_time)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_seat_list(token, req.id, req.day, req.start_time, req.end_time)
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取座位列表失败")
    return data


@router.post("/seat", summary="预约座位")
async def api_seat(
    req: SeatReserveRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """预约座位"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await confirm_seat(token, req.id, req.segment, req.day, req.start_time, req.end_time)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await confirm_seat(token, req.id, req.segment, req.day, req.start_time, req.end_time)
    
    if data is None:
        raise HTTPException(status_code=502, detail="预约座位失败")
    return data


async def get_collect_time(token: str, collect_type: str = "1") -> dict:
    """获取收藏时段列表"""
    url = "http://rgyy.wfust.edu.cn/v4/member/collecttime"
    
    payload = {"type": collect_type}
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/collecttime", summary="获取收藏时段")
async def api_collect_time(
    req: CollectTimeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取收藏的时段列表"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_collect_time(token, req.type)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_collect_time(token, req.type)
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取收藏时段失败")
    return data


async def get_often(token: str, often_type: str, day: str, begin_time: str, end_time: str) -> dict:
    """获取常用座位列表"""
    url = "http://rgyy.wfust.edu.cn/v4/member/often"
    
    payload = {
        "type": often_type,
        "day": day,
        "begin_time": begin_time,
        "end_time": end_time
    }
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/often", summary="获取常用座位")
async def api_often(
    req: OftenRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取常用座位列表"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_often(token, req.type, req.day, req.begin_time, req.end_time)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_often(token, req.type, req.day, req.begin_time, req.end_time)
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取常用座位失败")
    return data


async def get_subscribe(token: str) -> dict:
    """获取当前预约列表"""
    url = "http://rgyy.wfust.edu.cn/v4/index/subscribe"
    
    payload = {}
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/subscribe", summary="获取当前预约")
async def api_subscribe(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取当前预约的座位列表"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_subscribe(token)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_subscribe(token)
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取当前预约失败")
    return data


class CancelRequest(BaseModel):
    id: str  # 预约ID


async def cancel_subscribe(token: str, subscribe_id: str) -> dict:
    """取消预约"""
    url = "http://rgyy.wfust.edu.cn/v4/space/cancel"
    
    payload = {"id": subscribe_id}
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
        "X-Requested-With": "XMLHttpRequest",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/cancel", summary="取消预约")
async def api_cancel(
    req: CancelRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """取消座位预约"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await cancel_subscribe(token, req.id)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await cancel_subscribe(token, req.id)
    
    if data is None:
        raise HTTPException(status_code=502, detail="取消预约失败")
    return data


class SeatHistoryRequest(BaseModel):
    type: str = "1"  # 1=预约记录, 2=违约记录
    page: int = 1
    limit: int = 10


async def get_seat_history(token: str, type_val: str, page: int, limit: int) -> dict:
    """获取座位预约记录"""
    url = "http://rgyy.wfust.edu.cn/v4/member/seat"
    
    payload = {"type": type_val, "page": page, "limit": limit}
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
        "X-Requested-With": "XMLHttpRequest",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/history", summary="座位预约记录")
async def api_seat_history(
    req: SeatHistoryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取座位预约记录或违约记录"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_seat_history(token, req.type, req.page, req.limit)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_seat_history(token, req.type, req.page, req.limit)
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取预约记录失败")
    return data


class ViolationRequest(BaseModel):
    type: str = "1"
    page: int = 1
    limit: int = 10


async def get_violation_history(token: str, type_val: str, page: int, limit: int) -> dict:
    """获取违约记录"""
    url = "http://rgyy.wfust.edu.cn/v4/member/seatRenege"
    
    payload = {"type": type_val, "page": page, "limit": limit}
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
        "X-Requested-With": "XMLHttpRequest",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/violation", summary="违约记录")
async def api_violation_history(
    req: ViolationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取违约记录"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_violation_history(token, req.type, req.page, req.limit)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_violation_history(token, req.type, req.page, req.limit)
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取违约记录失败")
    return data


async def get_member_info(token: str) -> dict:
    """获取个人信息"""
    url = "http://rgyy.wfust.edu.cn/v4/member/my"
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
        "X-Requested-With": "XMLHttpRequest",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps({}).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/member", summary="个人信息")
async def api_member_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取个人信息"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await get_member_info(token)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await get_member_info(token)
    
    if data is None:
        raise HTTPException(status_code=502, detail="获取个人信息失败")
    return data


class UpdateUserInfoRequest(BaseModel):
    mobile: str = ""
    email: str = ""


async def update_user_info(token: str, mobile: str, email: str) -> dict:
    """更新个人信息（手机号、邮箱）"""
    url = "http://rgyy.wfust.edu.cn/v4/member/updateUserInfo"
    
    update_data = {"mobile": mobile, "email": email}
    encrypted = aes_encrypt(update_data)
    payload = {"aesjson": encrypted}
    
    token = normalize_token(token)
    headers = {
        "Content-Type": "application/json",
        "authorization": f"bearer{token}",
        "X-Requested-With": "XMLHttpRequest",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/update-member", summary="更新个人信息")
async def api_update_member_info(
    req: UpdateUserInfoRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新手机号和邮箱"""
    username, password = await get_study_room_credentials(current_user, db)
    token = await ensure_token(username, password)
    
    data = await update_user_info(token, req.mobile, req.email)
    
    if isinstance(data, dict) and data.get("code") == 10001:
        _token_cache.pop(username, None)
        token = await ensure_token(username, password)
        data = await update_user_info(token, req.mobile, req.email)
    
    if data is None:
        raise HTTPException(status_code=502, detail="更新个人信息失败")
    return data


class ForgetPasswordRequest(BaseModel):
    card: str  # 学工号
    username: str  # 姓名
    mobile: str  # 手机号
    password: str  # 新密码
    repassword: str  # 确认密码


async def forget_password(card: str, username: str, mobile: str, password: str, repassword: str) -> dict:
    """忘记密码 - 重置密码"""
    url = "http://rgyy.wfust.edu.cn/v4/member/forget"
    
    data = {
        "card": card,
        "username": username,
        "mobile": mobile,
        "password": password,
        "repassword": repassword,
    }
    encrypted = aes_encrypt(data)
    payload = {"aesjson": encrypted}
    
    headers = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    }
    
    result = await http_request(url, method="POST", headers=headers, data=json.dumps(payload).encode())
    
    if result:
        try:
            return json.loads(result["data"].decode("utf-8"))
        except:
            return result["data"]
    return None


@router.post("/forget", summary="忘记密码")
async def api_forget_password(req: ForgetPasswordRequest):
    """忘记密码 - 重置密码（不需要登录）"""
    if req.password != req.repassword:
        raise HTTPException(status_code=400, detail="两次输入的密码不一致")
    
    data = await forget_password(req.card, req.username, req.mobile, req.password, req.repassword)
    
    if data is None:
        raise HTTPException(status_code=502, detail="重置密码失败")
    return data
