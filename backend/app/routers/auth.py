import time
from collections import defaultdict

from fastapi import APIRouter, Depends, Request, Header
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
    AccessTokenResponse,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.middleware.auth_middleware import get_current_user
from app.utils.exceptions import (
    InvalidCredentials,
    DuplicateEmail,
    RateLimited,
    TokenInvalid,
    TokenExpired,
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# --- Rate limiting (in-memory) ---
# Tracks failed login attempts per IP+email combo
_failed_attempts: dict[str, list[float]] = defaultdict(list)
MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300  # 5 minutes


def _check_rate_limit(request: Request, email: str) -> None:
    """Block login if too many failed attempts from this IP+email."""
    key = f"{request.client.host}:{email}"
    now = time.time()

    # Prune old attempts outside the window
    _failed_attempts[key] = [
        t for t in _failed_attempts[key] if now - t < WINDOW_SECONDS
    ]

    if len(_failed_attempts[key]) >= MAX_ATTEMPTS:
        raise RateLimited(retry_after=WINDOW_SECONDS)


def _record_failed_attempt(request: Request, email: str) -> None:
    key = f"{request.client.host}:{email}"
    _failed_attempts[key].append(time.time())


def _clear_failed_attempts(request: Request, email: str) -> None:
    key = f"{request.client.host}:{email}"
    _failed_attempts.pop(key, None)


# --- Endpoints ---

@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    # Check duplicate email
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise DuplicateEmail()

    user = User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate and receive access + refresh tokens."""
    _check_rate_limit(request, body.email)

    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        _record_failed_attempt(request, body.email)
        raise InvalidCredentials()

    if not user.is_active:
        _record_failed_attempt(request, body.email)
        raise InvalidCredentials()

    _clear_failed_attempts(request, body.email)

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(
    authorization: str = Header(..., description="Bearer <refresh_token>"),
    db: Session = Depends(get_db),
):
    """Exchange a refresh token for a new access token."""
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise TokenInvalid()

    try:
        payload = decode_token(parts[1])
    except JWTError:
        raise TokenExpired()

    if payload.get("type") != "refresh":
        raise TokenInvalid()

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise TokenInvalid()

    access_token = create_access_token(user.id, user.role)

    return AccessTokenResponse(
        access_token=access_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user
