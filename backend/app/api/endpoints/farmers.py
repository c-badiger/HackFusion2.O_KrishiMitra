from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pathlib import Path
import json

from app.core.database import get_db
from app.models.models import Farmer, Crop
from app.schemas.schemas import ApiResponse, FarmerRegisterRequest, FarmerResponse, CropResponse

router = APIRouter()
DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

def _get_district_kn(district_en: str) -> str:
    path = DATA_DIR / "kannada_vocab.json"
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                vocab = json.load(f)
                for d in vocab.get("districts_karnataka", []):
                    if d["en"].lower() == district_en.strip().lower():
                        return d["kn"]
        except Exception:
            pass
    return district_en

@router.post("/register", response_model=ApiResponse, status_code=status.HTTP_201_CREATED, summary="Register Farmer & Agricultural Holding")
def register_farmer(payload: FarmerRegisterRequest, db: Optional[Session] = Depends(get_db)):
    """
    Registers a new farmer profile along with their landholding and crop information.
    Automatically resolves Kannada geographic names and computes land holding class (Marginal, Small, Medium, Large).
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Please check backend connection."
        )

    # 1. Check for duplicate phone number
    existing_phone = db.query(Farmer).filter(Farmer.phone_number == payload.phone_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Farmer with phone number {payload.phone_number} is already registered (Farmer ID: {existing_phone.id})."
        )

    # 2. Check for duplicate FRUITS ID if supplied
    if payload.fruits_id:
        existing_fruits = db.query(Farmer).filter(Farmer.fruits_id == payload.fruits_id).first()
        if existing_fruits:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Farmer with FRUITS ID {payload.fruits_id} is already registered."
            )

    # 3. Derive district_kn if missing
    district_kn = payload.district_kn or _get_district_kn(payload.district)

    # 4. Compute farmer category from land size if not specified
    farmer_cat = payload.farmer_category
    if not farmer_cat:
        acres = float(payload.total_land_acres or 0.0)
        if acres < 2.47:
            farmer_cat = "Marginal"
        elif acres <= 4.94:
            farmer_cat = "Small"
        elif acres <= 24.7:
            farmer_cat = "Medium"
        else:
            farmer_cat = "Large"

    try:
        new_farmer = Farmer(
            full_name=payload.full_name,
            phone_number=payload.phone_number,
            aadhaar_last_four=payload.aadhaar_last_four,
            fruits_id=payload.fruits_id,
            district=payload.district,
            district_kn=district_kn,
            taluk=payload.taluk,
            village=payload.village,
            caste_category=payload.caste_category,
            annual_income=payload.annual_income,
            total_land_acres=payload.total_land_acres,
            farmer_category=farmer_cat,
            soil_type=payload.soil_type,
            irrigation_type=payload.irrigation_type,
            has_borewell=payload.has_borewell
        )
        db.add(new_farmer)
        db.flush()

        # Add crops if provided
        if payload.crops:
            for crop_item in payload.crops:
                crop = Crop(
                    farmer_id=new_farmer.id,
                    crop_name=crop_item.crop_name,
                    crop_name_kn=crop_item.crop_name_kn or crop_item.crop_name,
                    crop_category=crop_item.crop_category,
                    acres=crop_item.acres,
                    season=crop_item.season
                )
                db.add(crop)

        db.commit()
        db.refresh(new_farmer)

        response_data = FarmerResponse.model_validate(new_farmer)
        return ApiResponse(
            success=True,
            data=response_data.model_dump(),
            message=f"Farmer {new_farmer.full_name} registered successfully with ID {new_farmer.id}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register farmer in database: {str(e)}"
        )

@router.get("/{farmer_id}", response_model=ApiResponse, summary="Get Farmer Profile by ID")
def get_farmer_profile(farmer_id: int, db: Optional[Session] = Depends(get_db)):
    """
    Retrieves full farmer profile, demographic holding, and current seasonal crop records.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable."
        )

    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {farmer_id} not found."
        )

    response_data = FarmerResponse.model_validate(farmer)
    return ApiResponse(
        success=True,
        data=response_data.model_dump(),
        message="Farmer profile fetched successfully"
    )

@router.get("", response_model=ApiResponse, summary="List Registered Farmers")
def list_farmers(db: Optional[Session] = Depends(get_db)):
    """
    Lists registered farmers for administrative or testing purposes.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    farmers = db.query(Farmer).all()
    data = [FarmerResponse.model_validate(f).model_dump() for f in farmers]
    return ApiResponse(
        success=True,
        data=data,
        message=f"Retrieved {len(data)} farmer records"
    )
