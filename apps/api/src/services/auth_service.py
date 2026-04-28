from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.security import create_access_token, hash_password, verify_password
from src.models.user import User, UserProfile
from src.schemas.auth import AuthTokensResponse, CurrentUserResponse, LoginRequest, SignupRequest


def signup_user(db: Session, payload: SignupRequest) -> CurrentUserResponse:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        status="active",
    )
    profile = UserProfile(
        user=user,
        full_name=payload.full_name,
        preferred_language="english",
        grade_level="11",
        target_stream="pcmb",
        timezone="Asia/Calcutta",
        preferences_json={},
    )
    db.add(user)
    db.add(profile)
    db.commit()
    db.refresh(user)

    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        status=user.status,
        full_name=profile.full_name,
    )


def login_user(db: Session, payload: LoginRequest) -> AuthTokensResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return AuthTokensResponse(access_token=create_access_token(user.id))
