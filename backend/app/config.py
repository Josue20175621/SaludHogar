import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    REDIS_URL: str = "redis://localhost:6379/0"
    SESSION_TTL: int = 60 * 60 * 24 * 30  # 30 days
    SID_BYTES: int = 32
    COOKIE_NAME: str = "sid"

    COOKIE_SECURE: bool = True
    COOKIE_HTTPONLY: bool = True
    COOKIE_SAMESITE: str = "none"
    COOKIE_PATH: str = "/"
    
    class Config:
        env_file = ".env"

settings = Settings()