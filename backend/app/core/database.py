from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger("krishi_mitra.database")

Base = declarative_base()

try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.warning(f"Could not initialize MySQL engine with URL {settings.DATABASE_URL}: {e}")
    engine = None
    SessionLocal = None

def get_db():
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection() -> bool:
    if engine is None:
        return False
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
            return True
    except Exception:
        return False
