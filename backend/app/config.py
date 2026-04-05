import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    SUPABASE_URL: str = "https://example.supabase.co"
    SUPABASE_ANON_KEY: str = "dev-anon-key"
    SUPABASE_SERVICE_KEY: str = "dev-service-key"
    JWT_SECRET_KEY: str = "dev-jwt-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    NVIDIA_API_KEY: str = "dev-nvidia-key"
    GOOGLE_AI_KEY: str = "dev-google-key"
    GROQ_API_KEY: str = "dev-groq-key"
    HF_TOKEN: str = "dev-hf-token"
    MAX_FILE_SIZE_MB: int = 50
    MAX_REQUEST_SIZE_MB: int = 55
    MAX_JSON_BODY_KB: int = 10
    ALLOWED_EXTENSIONS: list[str] = ["csv", "xlsx", "json"]
    SUPABASE_STORAGE_BUCKET: str = "datasets"
    RATE_LIMIT_PER_MINUTE: int = 100
    AI_RATE_LIMIT: int = 10
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    CSRF_COOKIE_SECURE: bool = False
    ENVIRONMENT: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]

        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []

            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    pass

            return [item.strip() for item in raw.split(",") if item.strip()]

        raise TypeError("CORS_ORIGINS must be a list or string")

settings = Settings()
