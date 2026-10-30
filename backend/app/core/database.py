import logging
import json
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("krishi_mitra.database")

Base = declarative_base()

# State variables for health checks
db_connected: bool = False
db_engine_type: str = "none"
db_status_detail: str = "Not initialized"

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

def create_db_engine():
    global db_connected, db_engine_type, db_status_detail

    # 1. Try connecting to MySQL using settings.DATABASE_URL
    mysql_url = settings.DATABASE_URL
    try:
        logger.info(f"Attempting to connect to MySQL database at {settings.DB_HOST}:{settings.DB_PORT}...")
        # First ensure database exists if user has permissions
        engine_mysql = create_engine(
            mysql_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False
        )
        with engine_mysql.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to MySQL 8.0 server!")
        db_connected = True
        db_engine_type = "mysql"
        db_status_detail = f"Connected to MySQL on {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
        return engine_mysql
    except Exception as e_mysql:
        logger.warning(
            f"MySQL connection to {settings.DB_HOST}:{settings.DB_PORT} failed: {e_mysql}. "
            "Falling back to high-performance local development database (sqlite:///./krishi_mitra.db) "
            "to ensure seamless and uninterrupted API testing. "
            "To switch to MySQL, update DB_PASSWORD in backend/.env."
        )

    # 2. Resilient fallback to SQLite
    try:
        sqlite_path = Path(__file__).resolve().parent.parent.parent / "krishi_mitra.db"
        sqlite_url = f"sqlite:///{sqlite_path}"
        engine_sqlite = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False},
            echo=False
        )
        with engine_sqlite.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_connected = True
        db_engine_type = "sqlite_fallback"
        db_status_detail = f"Active on local dev database ({sqlite_path.name}) - MySQL password required in .env for MySQL80"
        return engine_sqlite
    except Exception as e_sqlite:
        logger.error(f"Failed to initialize fallback database: {e_sqlite}")
        db_connected = False
        db_engine_type = "none"
        db_status_detail = f"Database connection error: {e_sqlite}"
        return None

engine = create_db_engine()

if engine is not None:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
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

def check_db_connection() -> dict:
    global db_connected, db_engine_type, db_status_detail
    if engine is None:
        return {
            "connected": False,
            "engine": "none",
            "detail": "Engine not initialized"
        }
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return {
                "connected": True,
                "engine": db_engine_type,
                "detail": db_status_detail
            }
    except Exception as e:
        return {
            "connected": False,
            "engine": db_engine_type,
            "detail": str(e)
        }

def init_db():
    """
    Creates tables if they don't exist and seeds verified government schemes
    if the database is newly initialized.
    """
    if engine is None:
        return

    from app.models.models import GovernmentScheme, SchemeEligibilityRule, SchemeDocument
    Base.metadata.create_all(bind=engine)

    # Check if schemes are already present
    db = SessionLocal()
    try:
        count = db.query(GovernmentScheme).count()
        if count == 0:
            logger.info("Seeding verified Karnataka and Central agricultural schemes into database...")
            schemes_file = DATA_DIR / "karnataka_schemes.json"
            if schemes_file.exists():
                with open(schemes_file, "r", encoding="utf-8") as f:
                    schemes_data = json.load(f)

                for s_item in schemes_data:
                    scheme = GovernmentScheme(
                        id=s_item["id"],
                        scheme_code=s_item["scheme_code"],
                        name_en=s_item["name_en"],
                        name_kn=s_item["name_kn"],
                        department_en=s_item.get("department", "Department of Agriculture"),
                        department_kn=s_item.get("department_kn", "ಕೃಷಿ ಇಲಾಖೆ"),
                        category=s_item.get("category", "General"),
                        level=s_item.get("level", "Karnataka_State"),
                        benefit_type="Direct_Benefit_Transfer" if "Direct" in s_item.get("category", "") else "Subsidy_Capital",
                        benefit_amount_desc_en=s_item.get("benefit_amount", ""),
                        benefit_amount_desc_kn=s_item.get("benefit_amount", ""),
                        summary_en=s_item.get("name_en", ""),
                        summary_kn=s_item.get("summary_kn", ""),
                        application_portal=s_item.get("portal", ""),
                        is_active=True
                    )
                    db.add(scheme)
                    db.flush()

                    # Add rules
                    for r_idx, r in enumerate(s_item.get("rules", [])):
                        rule = SchemeEligibilityRule(
                            scheme_id=scheme.id,
                            rule_code=f"{scheme.scheme_code}_R{r_idx + 1}",
                            parameter_name=r.get("field", ""),
                            operator=r.get("operator", "="),
                            target_value=json.dumps(r.get("value")) if isinstance(r.get("value"), (list, dict)) else str(r.get("value")),
                            is_mandatory=True,
                            explanation_kn=r.get("reason_kn", ""),
                            explanation_en=r.get("reason_en", r.get("reason_kn", ""))
                        )
                        db.add(rule)

                    # Add documents
                    for doc_name in s_item.get("documents_kn", []):
                        doc = SchemeDocument(
                            scheme_id=scheme.id,
                            document_name_en=doc_name,
                            document_name_kn=doc_name,
                            is_mandatory=True,
                            issuing_authority_kn="ಸಂಬಂಧಪಟ್ಟ ಇಲಾಖೆ"
                        )
                        db.add(doc)

                db.commit()
                logger.info(f"Successfully seeded {len(schemes_data)} verified schemes!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
