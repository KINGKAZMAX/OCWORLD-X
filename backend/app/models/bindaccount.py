from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..database import Base


class BindAccount(Base):
    __tablename__ = "bind_accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_type = Column(String(50), nullable=False, default="jwxt")  # 账号类型：jwxt=教务系统
    username = Column(String(100), nullable=False)  # 教务系统账号
    password = Column(String(255), nullable=False)  # 教务系统密码（加密存储）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
