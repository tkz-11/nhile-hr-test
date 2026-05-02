from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from app.config import settings

security = HTTPBearer(auto_error=False)

# UUID cố định cho user dev — khớp với seed data trong supabase_seed.sql
DEV_USER_ID  = UUID("11111111-1111-1111-1111-111111111111")  # Backward compat: HR
DEV_ORG_ID   = UUID("00000000-0000-0000-0000-000000000001")
DEV_TOKEN    = "dev-token"

# Map role → (user_id, full_name) khớp seed data
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
        self.user_metadata = {"primary_role": role, "full_name": name}


def _is_dev() -> bool:
    return settings.environment.lower().startswith("dev")


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """Xác thực JWT từ Supabase. Trong dev mode, chấp nhận 'dev-token' hoặc thiếu header."""
    token = credentials.credentials if credentials else None

    # ── Dev bypass: không cần token thật, chấp nhận header X-Dev-Role để switch role ──
    if _is_dev() and (token is None or token == DEV_TOKEN):
        role = request.headers.get("X-Dev-Role", "hr_manager")
        if role not in ("hr_manager", "leader", "member"):
            role = "hr_manager"
        return DevUser(role=role)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu token xác thực",
        )

    supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
        )


def require_role(allowed_roles: list[str]):
    """Factory tạo dependency kiểm tra role."""
    async def _check_role(current_user=Depends(get_current_user)):
        # DevUser dùng dict; SupabaseUser cũng dùng user_metadata dict
        meta = getattr(current_user, "user_metadata", {}) or {}
        user_role = meta.get("primary_role", "member")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cần quyền: {', '.join(allowed_roles)}",
            )
        return current_user
    return _check_role
