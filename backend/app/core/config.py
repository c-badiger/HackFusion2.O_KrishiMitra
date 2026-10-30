from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Krishi Mitra API"
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Database
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "krishi_mitra_db"
    DATABASE_URL: str = ""

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ]

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v, info):
        if isinstance(v, str) and v:
            return v
        data = info.data
        user = data.get("DB_USER", "root")
        password = data.get("DB_PASSWORD", "root")
        host = data.get("DB_HOST", "localhost")
        port = data.get("DB_PORT", 3306)
        db = data.get("DB_NAME", "krishi_mitra_db")
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{db}?charset=utf8mb4"

    class Config:
        env_file = str(BASE_DIR / ".env")
        case_sensitive = True
        extra = "allow"

settings = Settings()
