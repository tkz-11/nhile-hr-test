"""Verify JWT do Supabase Auth (GoTrue) phát hành.

Decode cục bộ bằng HS256 + SUPABASE_JWT_SECRET — KHÔNG gọi Supabase qua mạng
trên mỗi request. Nhanh hơn ~100x, không phụ thuộc Supabase uptime,
không bị rate-limit, hoạt động offline khi cần debug.
"""
from typing import TypedDict, Optional
from fastapi import HTTPException, status
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from app.config import settings


class JWTPayload(TypedDict):
    user_id: str
    email: Optional[str]
    role_from_metadata: Optional[str]


def verify_supabase_jwt(token: str) -> JWTPayload:
    """Verify Supabase access_token và trích payload tối thiểu cần thiết.

    Bắt buộc khớp: signature (HS256), exp, iss = <SUPABASE_URL>/auth/v1,
    aud = "authenticated". Bất cứ claim nào sai/thiếu → HTTP 401.
    """
    expected_issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1"

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=expected_issuer,
            options={"require": ["exp", "sub", "iss", "aud"]},
        )
    except ExpiredSignatureError:
        # Phân biệt với "không hợp lệ" để client biết refresh thay vì logout cứng
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã hết hạn",
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ",
        )

    user_metadata = payload.get("user_metadata") or {}
    app_metadata = payload.get("app_metadata") or {}
    role_from_metadata = (
        user_metadata.get("primary_role")
        or app_metadata.get("primary_role")
    )

    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "role_from_metadata": role_from_metadata,
    }
