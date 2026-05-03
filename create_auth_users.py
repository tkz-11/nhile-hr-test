"""Tạo 8 Supabase Auth users với UUID khớp user_profiles seed.

Chạy: python create_auth_users.py
Yêu cầu: nhile-hr-backend/.env phải có SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
Idempotent: chạy nhiều lần OK, user đã tồn tại sẽ skip.
"""
import json
import urllib.request
import urllib.error
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parent / "nhile-hr-backend" / ".env"

env = {}
for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        # Strip inline comments (# ...) sau giá trị nếu có
        if "#" in v and not (v.lstrip().startswith('"') or v.lstrip().startswith("[")):
            v = v.split("#", 1)[0]
        env[k.strip()] = v.strip().strip('"').strip("'")

URL = env["SUPABASE_URL"].rstrip("/")
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
PASSWORD = "Nhile@2026"

USERS = [
    ("11111111-1111-1111-1111-111111111111", "hr@nhile.local",       "hr_manager", "Nguyễn Thanh Trang"),
    ("22222222-2222-2222-2222-222222222222", "leader1@nhile.local",  "leader",     "Trần Văn Bình"),
    ("33333333-3333-3333-3333-333333333333", "leader2@nhile.local",  "leader",     "Phạm Ngọc Lan"),
    ("44444444-4444-4444-4444-444444444444", "minhanh@nhile.local",  "member",     "Nguyễn Minh Anh"),
    ("55555555-5555-5555-5555-555555555555", "thuha@nhile.local",    "member",     "Lê Thị Thu Hà"),
    ("66666666-6666-6666-6666-666666666666", "quocviet@nhile.local", "member",     "Đinh Quốc Việt"),
    ("77777777-7777-7777-7777-777777777777", "baochau@nhile.local",  "member",     "Vũ Thị Bảo Châu"),
    ("88888888-8888-8888-8888-888888888888", "ducdung@nhile.local",  "member",     "Phạm Đức Dũng"),
]

print(f"Target: {URL}")
print(f"Tạo {len(USERS)} user, password chung = {PASSWORD}\n")

ok = skip = fail = 0
for uid, email, role, full_name in USERS:
    body = json.dumps({
        "id": uid,
        "email": email,
        "password": PASSWORD,
        "email_confirm": True,
        "user_metadata": {"primary_role": role, "full_name": full_name},
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{URL}/auth/v1/admin/users",
        data=body,
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            json.loads(r.read().decode("utf-8"))
            print(f"  OK   {email:25}  role={role}")
            ok += 1
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        lower = msg.lower()
        if e.code in (400, 409, 422) and any(s in lower for s in ("already", "exists", "duplicate", "registered")):
            print(f"  SKIP {email:25}  (đã tồn tại)")
            skip += 1
        else:
            print(f"  FAIL {email:25}  HTTP {e.code}  {msg[:120]}")
            fail += 1
    except Exception as e:
        print(f"  FAIL {email:25}  {type(e).__name__}: {e}")
        fail += 1

print(f"\nTổng: {ok} tạo mới, {skip} bỏ qua, {fail} lỗi")
