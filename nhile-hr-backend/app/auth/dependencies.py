from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.users.models import UserProfile
from app.auth.jwt_verifier import verify_supabase_jwt

security = HTTPBearer(auto_error=False)

# UUID cố định cho user dev — khớp với seed data trong supabase_seed.sql
DEV_USER_ID  = UUID("11111111-1111-1111-1111-111111111111")  # Backward compat: HR
DEV_ORG_ID   = UUID("00000000-0000-0000-0000-000000000001")
DEV_TOKEN    = "dev-token"

# Map role → (user_id, full_name, email) khớp seed data
ROLE_PROFILES = {
    "hr_manager": (UUID("11111111-1111-1111-1111-111111111111"), "Nguyễn Thanh Trang", "hr@nhile.local"),
    "leader":     (UUID("22222222-2222-2222-2222-222222222222"), "Trần Văn Bình",      "leader1@nhile.local"),
    "member":     (UUID("44444444-4444-4444-4444-444444444444"), "Nguyễn Minh Anh",    "minhanh@nhile.local"),
}


class DevUser:
    """User giả lập cho môi trường development — đủ field để các router hiện có dùng."""
    def __init__(self, role: str = "hr_manager"):
        uid, name, email = ROLE_PROFILES.get(role, ROLE_PROFILES["hr_manager"])
        self.id = uid
        self.org_id = DEV_ORG_ID
        self.email = email
        self.full_name = name
        self.primary_role = role
        self.avatar_url = None
        # Giữ user_metadata để code cũ dùng meta.get(...) không vỡ
        self.user_metadata = {"primary_role": role, "full_name": name}


def _is_dev() -> bool:
    return settings.environment.lower().startswith("dev")


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Xác thực JWT từ Supabase. Trong dev mode, chấp nhận 'dev-token' hoặc thiếu header."""
    token = credentials.credentials if credentials else None

    # ── Dev bypass: chỉ active khi ENVIRONMENT=development ──
    if _is_dev() and (token is None or token == DEV_TOKEN):
        role = request.headers.get("X-Dev-Role", "hr_manager")
        if role not in ("hr_manager", "leader", "member"):
            role = "hr_manager"
        return DevUser(role=role)

    # ── Real JWT path: verify HS256 cục bộ + load profile từ DB ──
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu token xác thực",
        )

    payload = verify_supabase_jwt(token)  # raise 401 nếu sai

    try:
        user_uuid = UUID(payload["user_id"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ",
        )

    user = await db.get(UserProfile, user_uuid)
    if not user:
        # JWT hợp lệ nhưng chưa seed profile → coi như chưa onboard
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Profile chưa khởi tạo — liên hệ HR Manager",
        )
    return user


def require_role(allowed_roles: list[str]):
    """Factory tạo dependency kiểm tra role.

    Hoạt động với cả DevUser (có user_metadata + primary_role) và UserProfile ORM
    (có thuộc tính primary_role trực tiếp).
    """
    async def _check_role(current_user=Depends(get_current_user)):
        user_role = getattr(current_user, "primary_role", None)
        if not user_role:
            meta = getattr(current_user, "user_metadata", {}) or {}
            user_role = meta.get("primary_role", "member")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cần quyền: {', '.join(allowed_roles)}",
            )
        return current_user
    return _check_role
