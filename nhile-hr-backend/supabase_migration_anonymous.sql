-- =====================================================================
-- MIGRATION: thêm cột is_anonymous vào bảng stories
-- Chạy trong Supabase SQL Editor (idempotent — có thể chạy nhiều lần).
-- =====================================================================

ALTER TABLE stories
    ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Đánh dấu các story cũ là không ẩn danh (mặc định)
UPDATE stories SET is_anonymous = FALSE WHERE is_anonymous IS NULL;

-- Verify
-- SELECT id, content, is_anonymous, user_id FROM stories ORDER BY created_at DESC LIMIT 10;
