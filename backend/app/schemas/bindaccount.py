from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BindAccountCreate(BaseModel):
    account_type: str = "jwxt"
    username: str
    password: str


class BindAccountUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None


class BindAccountResponse(BaseModel):
    id: int
    account_type: str
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class BindAccountWithPassword(BaseModel):
    """内部使用，包含密码"""
    id: int
    account_type: str
    username: str
    password: str
