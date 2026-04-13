from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_token
from app.utils.exceptions import TokenInvalid, TokenExpired, AccountDeactivated, Forbidden


def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT from Authorization header. Returns User object."""
    # Parse "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise TokenInvalid()

    token = parts[1]

    try:
        payload = decode_token(token)
    except JWTError:
        raise TokenExpired()

    if payload.get("type") != "access":
        raise TokenInvalid()

    user_id = payload.get("sub")
    if not user_id:
        raise TokenInvalid()

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise TokenInvalid()

    if not user.is_active:
        raise AccountDeactivated()

    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the current user is an admin."""
    if user.role != "admin":
        raise Forbidden("Admin access required.")
    return user
