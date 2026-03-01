from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from cryptography.fernet import Fernet
import base64
import hashlib

from ..database import get_db
from ..models.bindaccount import BindAccount
from ..models.user import User
from ..schemas.bindaccount import BindAccountCreate, BindAccountUpdate, BindAccountResponse, BindAccountWithPassword
from ..routers.auth import get_current_active_user
from ..config import get_settings

router = APIRouter(prefix="/api/bindaccount", tags=["绑定账号"])
settings = get_settings()


def get_cipher():
    """获取加密器"""
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    key_b64 = base64.urlsafe_b64encode(key)
    return Fernet(key_b64)


def encrypt_password(password: str) -> str:
    """加密密码"""
    cipher = get_cipher()
    return cipher.encrypt(password.encode()).decode()


def decrypt_password(encrypted: str) -> str:
    """解密密码"""
    cipher = get_cipher()
    return cipher.decrypt(encrypted.encode()).decode()


@router.post("", response_model=BindAccountResponse, summary="绑定账号")
async def bind_account(
    data: BindAccountCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 检查是否已绑定该类型账号
    existing = db.query(BindAccount).filter(
        BindAccount.user_id == current_user.id,
        BindAccount.account_type == data.account_type
    ).first()
    
    if existing:
        # 更新现有绑定
        existing.username = data.username
        existing.password = encrypt_password(data.password)
        db.commit()
        db.refresh(existing)
        return existing
    
    # 创建新绑定
    bind = BindAccount(
        user_id=current_user.id,
        account_type=data.account_type,
        username=data.username,
        password=encrypt_password(data.password)
    )
    db.add(bind)
    db.commit()
    db.refresh(bind)
    return bind


@router.get("", response_model=List[BindAccountResponse], summary="获取绑定账号列表")
async def get_bind_accounts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    accounts = db.query(BindAccount).filter(
        BindAccount.user_id == current_user.id
    ).all()
    return accounts


@router.get("/{account_type}", response_model=Optional[BindAccountResponse], summary="获取指定类型绑定账号")
async def get_bind_account_by_type(
    account_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = db.query(BindAccount).filter(
        BindAccount.user_id == current_user.id,
        BindAccount.account_type == account_type
    ).first()
    return account


@router.get("/{account_type}/with-password", response_model=Optional[BindAccountWithPassword], summary="获取绑定账号(含密码)")
async def get_bind_account_with_password(
    account_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取绑定账号信息（包含解密后的密码），用于前端调用第三方API"""
    account = db.query(BindAccount).filter(
        BindAccount.user_id == current_user.id,
        BindAccount.account_type == account_type
    ).first()
    
    if not account:
        return None
    
    return BindAccountWithPassword(
        id=account.id,
        account_type=account.account_type,
        username=account.username,
        password=decrypt_password(account.password)
    )


@router.delete("/{account_type}", summary="解绑账号")
async def unbind_account(
    account_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    account = db.query(BindAccount).filter(
        BindAccount.user_id == current_user.id,
        BindAccount.account_type == account_type
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到绑定账号"
        )
    
    db.delete(account)
    db.commit()
    return {"message": "解绑成功"}
