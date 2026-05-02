from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import (
    get_current_user, DEV_TOKEN, DEV_USER_ID, DEV_ORG_ID, _is_dev,
)
from app.auth.schemas import TokenResponse

router = APIRouter()


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(role: str = "hr_manager"):
    """
    Chỉ dùng trong môi trường development.
    Trả về một token giả 'dev-token' cho phép frontend bỏ qua Supabase Auth khi test.
    Bạn truyền role qua query string: /auth/dev-login?role=leader
    """
    if not _is_dev():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="dev-login chỉ khả dụng khi ENVIRONMENT=development",
        )
    if role not in ("hr_manager", "leader", "member"):
        raise HTTPException(status_code=400, detail="role phải là hr_manager | leader | member")
    return TokenResponse(access_token=DEV_TOKEN, token_type="bearer")


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    """Trả về thông tin user hiện tại (theo token)."""
    meta = getattr(current_user, "user_metadata", {}) or {}
    return {
        "id": str(getattr(current_user, "id", DEV_USER_ID)),
        "org_id": str(getattr(current_user, "org_id", DEV_ORG_ID)),
        "email": getattr(current_user, "email", None),
        "full_name": meta.get("full_name", "Dev HR"),
        "primary_role": meta.get("primary_role", "hr_manager"),
    }
