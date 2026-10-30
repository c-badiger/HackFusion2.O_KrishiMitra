from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db, check_db_connection
from app.models.models import Farmer, GovernmentScheme
from app.schemas.schemas import ApiResponse

router = APIRouter()

@router.get("/health", response_model=ApiResponse, summary="System Health & Database Probe")
def get_health_status(db: Optional[Session] = Depends(get_db)):
    """
    Returns system status, active database engine (MySQL 8.0 or resilient local dev store),
    and counts of registered entities.
    """
    db_info = check_db_connection()
    farmers_count = 0
    schemes_count = 0

    if db is not None and db_info.get("connected"):
        try:
            farmers_count = db.query(Farmer).count()
            schemes_count = db.query(GovernmentScheme).filter(GovernmentScheme.is_active == True).count()
        except Exception:
            pass

    return ApiResponse(
        success=True,
        data={
            "status": "healthy",
            "service": "krishi-mitra-backend",
            "version": "1.0.0",
            "database": {
                "connected": db_info.get("connected", False),
                "engine": db_info.get("engine", "unknown"),
                "status_detail": db_info.get("detail", ""),
                "registered_farmers_count": farmers_count,
                "active_schemes_count": schemes_count
            },
            "kannada_nlu": "active",
            "deterministic_rule_engine": "active"
        },
        message="Krishi Mitra backend service is running and healthy"
    )
