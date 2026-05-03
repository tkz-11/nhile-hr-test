from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import (
    get_current_user, DEV_TOKEN, _is_dev,
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
    """Trả về profile của user đang login.

    Trả về explicit dict (không serialize ORM thẳng) để chống leak field
    nội bộ khi UserProfile model được mở rộng sau này.
    """
    # DevUser có user_metadata; UserProfile có thuộc tính trực tiếp.
    # Đã chuẩn hóa cả hai có primary_role/full_name/avatar_url ở mức instance.
    org_id = getattr(current_user, "org_id", None)
    return {
        "id": str(current_user.id),
        "org_id": str(org_id) if org_id else None,
        "email": getattr(current_user, "email", None),
        "full_name": getattr(current_user, "full_name", "") or "",
        "primary_role": getattr(current_user, "primary_role", "member") or "member",
        "avatar_url": getattr(current_user, "avatar_url", None),
    }
