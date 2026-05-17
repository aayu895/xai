from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "XAI-Gov"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://xaigov:xaigov_secret@localhost:5432/xaigov_db"
    DATABASE_URL_SYNC: str = "postgresql://xaigov:xaigov_secret@localhost:5432/xaigov_db"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://frontend:3000",
    ]

    # ML
    MODELS_DIR: str = "app/ml/models"
    DATA_DIR: str = "data"

    # Security
    BCRYPT_ROUNDS: int = 12

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
