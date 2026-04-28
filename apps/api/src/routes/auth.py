from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.db import get_db
from src.models.user import User
from src.schemas.auth import AuthTokensResponse, CurrentUserResponse, LoginRequest, SignupRequest
from src.services.auth_service import login_user, signup_user

router = APIRouter(prefix="/auth", tags=["auth"])


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    subject = payload.get("sub")
    user = db.scalar(select(User).where(User.id == subject))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    full_name = user.profile.full_name if user.profile else None
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        status=user.status,
        full_name=full_name,
    )


@router.post("/signup", response_model=CurrentUserResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> CurrentUserResponse:
    return signup_user(db, payload)


@router.post("/login", response_model=AuthTokensResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokensResponse:
    return login_user(db, payload)


@router.get("/me", response_model=CurrentUserResponse)
def me(current_user: CurrentUserResponse = Depends(get_current_user)) -> CurrentUserResponse:
    return current_user
