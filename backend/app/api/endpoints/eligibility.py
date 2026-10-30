"""
Krishi Mitra - Eligibility API Endpoints
Integrates the deterministic statutory rules engine into FastAPI.
Provides auditable scheme evaluation, explainable matching reasons,
missing information discovery, and statutory disclaimers.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pathlib import Path
import json
import logging

from app.core.database import get_db
from app.models.models import Farmer
from app.schemas.schemas import (
    ApiResponse,
    EligibilityEvaluateRequest,
    EligibilityEvaluateResponse,
    ExplainSchemeEligibilityRequest,
    ExplainSchemeEligibilityResponse,
    MissingInformationResponseItem,
    DetailedSchemeEvaluationItem,
    SchemeRuleEvaluationResponse
)
from app.rules_engine.engine import EligibilityEngine
from app.rules_engine.schemes_catalog import SchemesCatalog
from app.rules_engine.models import (
    EligibilityStatus,
    STATUTORY_DISCLAIMER_EN,
    STATUTORY_DISCLAIMER_KN
)

logger = logging.getLogger("krishi_mitra.api.eligibility")
def find_data_dir() -> Path:
    curr = Path(__file__).resolve().parent
    for _ in range(6):
        candidate = curr / "data"
        if candidate.exists() and candidate.is_dir():
            return candidate
        curr = curr.parent
    return Path(__file__).resolve().parent.parent.parent.parent.parent / "data"


DATA_DIR = find_data_dir()
router = APIRouter()


def resolve_farmer_profile(
    farmer_id: Optional[int],
    profile_input: Optional[Any],
    db: Optional[Session]
) -> Dict[str, Any]:
    """
    Helper to resolve a farmer profile from database, input object, or fictional sample data.
    Preserves None values so missing information can be accurately flagged.
    """
    if profile_input:
        data = profile_input.model_dump() if hasattr(profile_input, "model_dump") else dict(profile_input)
        if farmer_id:
            data["id"] = farmer_id
        return data

    if farmer_id:
        # 1. Try resolving from DB
        if db is not None:
            try:
                farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
                if farmer:
                    return {
                        "id": farmer.id,
                        "full_name": farmer.full_name,
                        "phone_number": farmer.phone_number,
                        "district": farmer.district,
                        "district_kn": farmer.district_kn,
                        "taluk": farmer.taluk,
                        "village": farmer.village,
                        "caste_category": farmer.caste_category,
                        "annual_income": float(farmer.annual_income) if farmer.annual_income is not None else None,
                        "total_land_acres": float(farmer.total_land_acres) if farmer.total_land_acres is not None else None,
                        "farmer_category": farmer.farmer_category,
                        "soil_type": farmer.soil_type,
                        "irrigation_type": farmer.irrigation_type,
                        "has_borewell": farmer.has_borewell,
                        "fruits_id": farmer.fruits_id,
                        "crops": [
                            {
                                "crop_name": c.crop_name,
                                "crop_name_kn": c.crop_name_kn,
                                "crop_category": c.crop_category,
                                "acres": float(c.acres) if c.acres is not None else 1.0,
                                "season": c.season
                            }
                            for c in farmer.crops
                        ]
                    }
            except Exception as e:
                logger.warning(f"Could not load farmer from database: {e}")

        # 2. Try resolving from sample / fictional test profiles
        fictional_file = DATA_DIR / "fictional_test_profiles.json"
        if fictional_file.exists():
            try:
                with open(fictional_file, "r", encoding="utf-8") as f:
                    bundle = json.load(f)
                    for item in bundle.get("profiles", []):
                        p = item.get("farmer_profile", {})
                        if p.get("id") == farmer_id:
                            return p
            except Exception as e:
                logger.error(f"Error reading fictional test profiles: {e}")

        # 3. Fallback to sample_profiles.json
        sample_file = DATA_DIR / "sample_profiles.json"
        if sample_file.exists():
            try:
                with open(sample_file, "r", encoding="utf-8") as f:
                    profiles = json.load(f)
                    found = next((p for p in profiles if p.get("id") == farmer_id), None)
                    if found:
                        return found
            except Exception:
                pass

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Farmer profile not found. Please provide either a valid 'farmer_id' or a 'profile' object."
    )


@router.post("/evaluate", response_model=ApiResponse, summary="Evaluate Farmer Scheme Eligibility")
def evaluate_farmer_eligibility(
    payload: EligibilityEvaluateRequest,
    db: Optional[Session] = Depends(get_db)
):
    """
    Evaluates farmer parameters against the deterministic statutory rules engine.
    Distinguishes:
    - ELIGIBLE: All mandatory conditions satisfied.
    - INELIGIBLE: One or more mandatory conditions failed.
    - INSUFFICIENT_INFORMATION: Mandatory rules cannot be evaluated because parameters are missing.
    Never asserts official government sanction.
    """
    farmer_ctx = resolve_farmer_profile(payload.farmer_id, payload.profile, db)

    # Filter by specific scheme if requested
    schemes = None
    if payload.scheme_id:
        scheme_obj = SchemesCatalog.get_scheme_by_id(payload.scheme_id)
        if not scheme_obj:
            raise HTTPException(status_code=404, detail=f"Scheme with ID {payload.scheme_id} not found in catalog.")
        schemes = [scheme_obj]

    summary = EligibilityEngine.evaluate_farmer(farmer_ctx, schemes=schemes)

    # Format response payload
    response_data = summary.model_dump()

    return ApiResponse(
        success=True,
        data=response_data,
        message=(
            f"Evaluated {summary.total_schemes_evaluated} schemes: "
            f"{summary.eligible_count} eligible, "
            f"{summary.insufficient_info_count} need more information, "
            f"{summary.ineligible_count} ineligible."
        )
    )


@router.post("/explain", response_model=ApiResponse, summary="Explain Scheme Eligibility Determination")
def explain_scheme_eligibility(
    payload: ExplainSchemeEligibilityRequest,
    db: Optional[Session] = Depends(get_db)
):
    """
    Provides an audit-traceable statutory explanation of why a farmer matches or does not match
    a specific government welfare scheme.
    """
    farmer_ctx = resolve_farmer_profile(payload.farmer_id, payload.profile, db)
    scheme = SchemesCatalog.get_scheme_by_id(payload.scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme with ID {payload.scheme_id} not found.")

    eval_result = EligibilityEngine.evaluate_scheme(farmer_ctx, scheme)

    lang = payload.language.lower() if payload.language else "kn"
    is_kn = lang == "kn"

    if eval_result.status == EligibilityStatus.ELIGIBLE:
        summary_text = (
            f"ನೀವು {scheme.name_kn} ಯೋಜನೆಗೆ ಪ್ರಾಥಮಿಕವಾಗಿ ಅರ್ಹರಾಗಿದ್ದೀರಿ ({eval_result.match_score}% ಹೊಂದಾಣಿಕೆ). ಎಲ್ಲಾ ನಿಯಮಗಳು ಪೂರೈಸಲ್ಪಟ್ಟಿವೆ."
            if is_kn else
            f"You preliminarily qualify for {scheme.name_en} ({eval_result.match_score}% match). All mandatory conditions were met."
        )
    elif eval_result.status == EligibilityStatus.INSUFFICIENT_INFORMATION:
        summary_text = (
            f"{scheme.name_kn} ಯೋಜನೆಗೆ ಅರ್ಹತೆ ನಿರ್ಧರಿಸಲು ಕೆಲವು ಪ್ರಮುಖ ಮಾಹಿತಿಗಳು ಅಪೂರ್ಣವಾಗಿವೆ."
            if is_kn else
            f"Insufficient information to determine eligibility for {scheme.name_en}. Missing key farmer parameters."
        )
    else:
        summary_text = (
            f"ನೀವು {scheme.name_kn} ಯೋಜನೆಯ ಕೆಲವು ಶಾಸನಬದ್ಧ ಷರತ್ತುಗಳನ್ನು ಪೂರೈಸಿಲ್ಲ."
            if is_kn else
            f"You do not meet statutory eligibility conditions for {scheme.name_en}."
        )

    response_body = ExplainSchemeEligibilityResponse(
        scheme_id=scheme.id,
        scheme_code=scheme.scheme_code,
        name_en=scheme.name_en,
        name_kn=scheme.name_kn,
        scheme_name_en=scheme.name_en,
        scheme_name_kn=scheme.name_kn,
        status=eval_result.status.value,
        match_score=eval_result.match_score,
        source_url=scheme.source_url,
        last_verified_date=scheme.last_verified_date,
        official_reference=scheme.official_reference,
        summary_explanation=summary_text,
        satisfied_reasons=eval_result.satisfied_conditions_kn if is_kn else eval_result.satisfied_conditions_en,
        unsatisfied_reasons=eval_result.unsatisfied_conditions_kn if is_kn else eval_result.unsatisfied_conditions_en,
        missing_requirements=eval_result.missing_information_kn if is_kn else eval_result.missing_information_en,
        statutory_disclaimer=STATUTORY_DISCLAIMER_KN if is_kn else STATUTORY_DISCLAIMER_EN
    )

    return ApiResponse(
        success=True,
        data=response_body.model_dump(),
        message="Statutory eligibility explanation generated"
    )


@router.post("/missing-info", response_model=ApiResponse, summary="Identify Missing Information for Farmer")
def identify_missing_information(
    payload: EligibilityEvaluateRequest,
    db: Optional[Session] = Depends(get_db)
):
    """
    Identifies all missing attributes in the farmer's profile that prevent determining scheme eligibility.
    Returns prioritized bilingual questions to solicit missing data.
    """
    farmer_ctx = resolve_farmer_profile(payload.farmer_id, payload.profile, db)
    summary = EligibilityEngine.evaluate_farmer(farmer_ctx)

    return ApiResponse(
        success=True,
        data={
            "farmer_id": payload.farmer_id,
            "missing_fields_count": len(summary.all_missing_information),
            "missing_information": [m.model_dump() for m in summary.all_missing_information],
            "schemes_pending_data_count": summary.insufficient_info_count
        },
        message=f"Found {len(summary.all_missing_information)} missing parameters affecting {summary.insufficient_info_count} schemes."
    )


@router.get("/fictional-test-profiles", response_model=ApiResponse, summary="Retrieve Fictional Test Profiles")
def get_fictional_test_profiles():
    """
    Returns verified fictional test profiles for automated testing and demonstrations.
    All data is explicitly marked as fictional test data.
    """
    fictional_file = DATA_DIR / "fictional_test_profiles.json"
    if not fictional_file.exists():
        raise HTTPException(status_code=404, detail="Fictional test profiles dataset not found.")

    with open(fictional_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    return ApiResponse(
        success=True,
        data=data,
        message="Fictional test profiles retrieved for engine verification"
    )
