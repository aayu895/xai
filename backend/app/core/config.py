import json
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://frontend:3000",
    "https://xai-omega.vercel.app",
]


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
    ALLOWED_ORIGINS_RAW: str = Field(default="", validation_alias="ALLOWED_ORIGINS")

    # ML
    MODELS_DIR: str = "app/ml/models"
    DATA_DIR: str = "data"

    # Security
    BCRYPT_ROUNDS: int = 12

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        if not self.ALLOWED_ORIGINS_RAW:
            return DEFAULT_ALLOWED_ORIGINS

        value = self.ALLOWED_ORIGINS_RAW.strip()
        if value.startswith("["):
            return json.loads(value)
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str):
            value = value.strip().lower()
            if value in {"1", "true", "yes", "on", "debug", "development"}:
                return True
            if value in {"0", "false", "no", "off", "release", "production"}:
                return False
        return value

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def ensure_async_database_url(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("postgresql://"):
                return value.replace("postgresql://", "postgresql+asyncpg://", 1)
            if not value.startswith("postgresql+asyncpg://"):
                raise ValueError(
                    "DATABASE_URL must be a full PostgreSQL connection string, "
                    "for example postgresql+asyncpg://user:password@host:5432/database"
                )
        return value

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
