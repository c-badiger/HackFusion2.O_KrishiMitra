from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.models import GovernmentScheme
from app.schemas.schemas import ApiResponse
from app.rules_engine.engine import RuleEvaluator

router = APIRouter()

@router.get("", response_model=ApiResponse)
def list_schemes(
    category: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    db: Optional[Session] = Depends(get_db)
):
    # Try fetching from MySQL if connected
    if db is not None:
        try:
            query = db.query(GovernmentScheme).filter(GovernmentScheme.is_active == True)
            if category:
                query = query.filter(GovernmentScheme.category == category)
            if level:
                query = query.filter(GovernmentScheme.level == level)
            schemes = query.all()
            if schemes:
                data = [
                    {
                        "id": s.id,
                        "scheme_code": s.scheme_code,
                        "name_en": s.name_en,
                        "name_kn": s.name_kn,
                        "department_kn": s.department_kn,
                        "category": s.category,
                        "level": s.level,
                        "benefit_amount_kn": s.benefit_amount_desc_kn,
                        "summary_kn": s.summary_kn,
                        "portal": s.application_portal
                    }
                    for s in schemes
                ]
                return ApiResponse(success=True, data=data, message="Schemes retrieved from database")
        except Exception:
            pass

    # Fallback to authentic JSON catalog
    schemes = RuleEvaluator.load_fallback_schemes()
    if category:
        schemes = [s for s in schemes if s.get("category") == category]
    if level:
        schemes = [s for s in schemes if s.get("level") == level]

    return ApiResponse(
        success=True,
        data=schemes,
        message="Schemes retrieved from verified statutory catalog"
    )

@router.get("/{scheme_id}", response_model=ApiResponse)
def get_scheme_details(scheme_id: int, db: Optional[Session] = Depends(get_db)):
    schemes = RuleEvaluator.load_fallback_schemes()
    match = next((s for s in schemes if s.get("id") == scheme_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return ApiResponse(success=True, data=match, message="Scheme details retrieved")
