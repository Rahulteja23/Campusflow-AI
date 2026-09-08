from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserOut
from app.services.auth import verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user=UserOut(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            student_id=user.student_id,
            department=user.department,
            created_at=user.created_at,
        )
    )


@router.get("/me", response_model=UserOut)
def get_me(db: Session = Depends(get_db), current_user: User = Depends(
    __import__("app.services.deps", fromlist=["get_current_user"]).get_current_user
)):
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        student_id=current_user.student_id,
        department=current_user.department,
        created_at=current_user.created_at,
    )
