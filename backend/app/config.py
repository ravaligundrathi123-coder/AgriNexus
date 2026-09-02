import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KisanQueue"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "kisan-queue-sih2026-super-secret-jwt-key-99120"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite Database URL by default
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./kisanqueue.db")

settings = Settings()
