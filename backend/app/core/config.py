from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator
from urllib.parse import quote
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Krishi Mitra API"
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Optional Kannada NLU. Keep credentials in backend/.env only.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    GEMINI_TRANSCRIBE_MODEL: str = "gemini-3.5-transcribe"
    GEMINI_TTS_MODEL: str = "gemini-3.8-flash-lite-tts"
    GEMINI_TTS_VOICE: str = "Kore"

    # Database
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
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
        password = data.get("DB_PASSWORD", "")
        host = data.get("DB_HOST", "localhost")
        port = data.get("DB_PORT", 3306)
        db = data.get("DB_NAME", "krishi_mitra_db")
        return (
            f"mysql+pymysql://{quote(user, safe='')}:{quote(password, safe='')}"
            f"@{host}:{port}/{db}?charset=utf8mb4"
        )

    class Config:
        env_file = str(BASE_DIR / ".env")
        case_sensitive = True
        extra = "allow"

settings = Settings()
