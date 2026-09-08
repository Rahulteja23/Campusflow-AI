from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    name: str
    email: str
    role: UserRole
    student_id: Optional[str] = None
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
