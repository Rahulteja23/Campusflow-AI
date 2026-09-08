from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./campusflow.db"
    SECRET_KEY: str = "campusflow-super-secret-key"
    GEMINI_API_KEY: Optional[str] = None
    NEWGEN_API_URL: Optional[str] = None
    NEWGEN_API_KEY: Optional[str] = None
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    DEMO_MODE: bool = True
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
