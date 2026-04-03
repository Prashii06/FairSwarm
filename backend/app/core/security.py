from __future__ import annotations

import hashlib
import logging
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from ..config import settings
from .database import extract_single, get_supabase_client

logger = logging.getLogger("fairswarm.security")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class TokenData(BaseModel):
    email: str
    user_id: str
    jti: str
    token_type: str = "access"
    exp: int


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = data.copy()
    payload.update(
        {
            "exp": expire,
            "iat": datetime.now(UTC),
            "jti": str(uuid4()),
            "token_type": "access",
        }
    )
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    expire = datetime.now(UTC) + timedelta(days=7)
    payload = data.copy()
    payload.update(
        {
            "exp": expire,
            "iat": datetime.now(UTC),
            "jti": str(uuid4()),
            "token_type": "refresh",
        }
    )
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    email = payload.get("sub")
    user_id = payload.get("user_id")
    jti = payload.get("jti")
    exp = payload.get("exp")
    token_type = payload.get("token_type", "access")
    if not email or not user_id or not jti or exp is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenData(
        email=str(email),
        user_id=str(user_id),
        jti=str(jti),
        token_type=str(token_type),
        exp=int(exp),
    )


def verify_token(token: str, credentials_exception: HTTPException | None = None) -> TokenData:
    try:
        return decode_token(token)
    except HTTPException:
        if credentials_exception is not None:
            raise credentials_exception
        raise


def is_token_blocklisted(token: str) -> bool:
    token_hash = hash_token(token)
    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("token_blocklist")
            .select("id")
            .eq("token_hash", token_hash)
            .limit(1)
            .execute()
        )
        return bool(getattr(response, "data", None))
    except Exception as exc:
        logger.warning("Token blocklist check failed: %s", exc)
        return False


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    if is_token_blocklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = decode_token(token)
    if token_data.token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        supabase = get_supabase_client()
        result = (
            supabase.table("users")
            .select("id,email,full_name,organization,is_active,created_at")
            .eq("id", token_data.user_id)
            .limit(1)
            .execute()
        )
        user = extract_single(result)
    except Exception as exc:
        logger.exception("Failed to fetch current user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load user profile.",
        ) from exc

    if user is None or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not active.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": str(user["id"]),
        "email": user["email"],
        "full_name": user.get("full_name"),
        "organization": user.get("organization"),
        "created_at": user.get("created_at"),
    }
