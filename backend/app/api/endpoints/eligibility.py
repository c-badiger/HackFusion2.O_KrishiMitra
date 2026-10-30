from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pathlib import Path
import json
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.models import Farmer
from app.schemas.schemas import ApiResponse, EligibilityEvaluateRequest
from app.rules_engine.engine import RuleEvaluator

router = APIRouter()
DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

@router.post("/evaluate", response_model=ApiResponse)
def evaluate_farmer_eligibility(payload: EligibilityEvaluateRequest, db: Optional[Session] = Depends(get_db)):
    farmer_dict = None

    if db is not None:
        try:
            farmer = db.query(Farmer).filter(Farmer.id == payload.farmer_id).first()
            if farmer:
                farmer_dict = {
                    "id": farmer.id,
                    "total_land_acres": float(farmer.total_land_acres),
                    "caste_category": farmer.caste_category,
                    "annual_income": float(farmer.annual_income),
                    "irrigation_type": farmer.irrigation_type,
                    "has_borewell": farmer.has_borewell,
                    "crops": [
                        {
                            "crop_name": c.crop_name,
                            "crop_name_kn": c.crop_name_kn,
                            "crop_category": c.crop_category,
                            "acres": float(c.acres)
                        }
                        for c in farmer.crops
                    ]
                }
        except Exception:
            pass

    if not farmer_dict:
        sample_file = DATA_DIR / "sample_profiles.json"
        if sample_file.exists():
            with open(sample_file, "r", encoding="utf-8") as f:
                profiles = json.load(f)
                farmer_dict = next((p for p in profiles if p["id"] == payload.farmer_id), None)

    if not farmer_dict:
        raise HTTPException(status_code=404, detail="Farmer profile not found for evaluation")

    results = RuleEvaluator.evaluate_farmer(farmer_dict)

    response_data = {
        "farmer_id": payload.farmer_id,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        **results
    }

    return ApiResponse(
        success=True,
        data=response_data,
        message="Eligibility evaluated through deterministic statutory rule matrix"
    )
