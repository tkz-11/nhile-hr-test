from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str
    secret_key: str
    environment: str = "development"
    gemini_api_key: str = ""
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:8000",
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Tự động chuyển đổi chuỗi phân cách bằng dấu phẩy thành List."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    class Config:
        env_file = ".env"

settings = Settings()
