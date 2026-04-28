from fastapi import Depends, HTTPException, status

from src.routes.auth import get_current_user


def require_roles(*allowed_roles: str):
    def _checker(user=Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return _checker
