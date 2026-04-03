from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    NVIDIA_API_KEY: str
    GOOGLE_AI_KEY: str
    GROQ_API_KEY: str
    HF_TOKEN: str
    MAX_FILE_SIZE_MB: int = 50
    MAX_REQUEST_SIZE_MB: int = 55
    ALLOWED_EXTENSIONS: List[str] = ["csv", "xlsx", "json"]
    SUPABASE_STORAGE_BUCKET: str = "datasets"
    RATE_LIMIT_PER_MINUTE: int = 100
    AI_RATE_LIMIT: int = 10
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    CSRF_COOKIE_SECURE: bool = False
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
