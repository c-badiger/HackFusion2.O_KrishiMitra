from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

# Standard Envelope
class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    message: str = "Success"
    error: Optional[Dict[str, Any]] = None

# Farmer schemas
class CropBase(BaseModel):
    crop_name: str
    crop_name_kn: str
    crop_category: str
    acres: float = 1.0
    season: str = "Kharif"

class CropResponse(CropBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class FarmerBase(BaseModel):
    full_name: str
    phone_number: str
    aadhaar_last_four: Optional[str] = None
    fruits_id: Optional[str] = None
    district: str
    district_kn: str
    taluk: Optional[str] = None
    village: Optional[str] = None
    caste_category: str = "General"
    annual_income: float = 0.0
    total_land_acres: float = 0.0
    farmer_category: str = "Small"
    soil_type: Optional[str] = "Red Loamy"
    irrigation_type: str = "Rainfed"
    has_borewell: bool = False

class FarmerCreate(FarmerBase):
    pass

class FarmerResponse(FarmerBase):
    id: int
    crops: List[CropResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Scheme schemas
class SchemeDocumentResponse(BaseModel):
    id: int
    document_name_en: str
    document_name_kn: str
    is_mandatory: bool
    issuing_authority_kn: Optional[str] = None
    class Config:
        from_attributes = True

class SchemeRuleResponse(BaseModel):
    id: int
    rule_code: str
    parameter_name: str
    operator: str
    target_value: str
    is_mandatory: bool
    explanation_kn: str
    explanation_en: str
    class Config:
        from_attributes = True

class GovernmentSchemeResponse(BaseModel):
    id: int
    scheme_code: str
    name_en: str
    name_kn: str
    department_en: str
    department_kn: str
    category: str
    level: str
    benefit_type: str
    benefit_amount_desc_en: str
    benefit_amount_desc_kn: str
    summary_en: str
    summary_kn: str
    application_portal: Optional[str] = None
    is_active: bool
    rules: List[SchemeRuleResponse] = []
    documents: List[SchemeDocumentResponse] = []
    class Config:
        from_attributes = True

# Voice interaction schemas
class VoiceProcessRequest(BaseModel):
    session_id: Optional[str] = None
    farmer_id: Optional[int] = None
    transcript_kannada: Optional[str] = None
    audio_base64: Optional[str] = None
    audio_format: Optional[str] = "webm"

class VoiceProcessResponse(BaseModel):
    session_id: str
    detected_intent: str
    extracted_parameters: Dict[str, Any]
    missing_parameters: List[str]
    assistant_reply_kannada: str
    assistant_reply_english: str
    tts_audio_url: Optional[str] = None
    quick_replies_kannada: List[str] = []
    eligible_schemes_count: int = 0
    matched_schemes: List[Dict[str, Any]] = []

# Eligibility evaluation schemas
class EligibilityEvaluateRequest(BaseModel):
    farmer_id: int

class EvaluatedSchemeItem(BaseModel):
    scheme_id: int
    scheme_code: str
    name_en: str
    name_kn: str
    department_kn: str
    match_score: int
    benefit_amount_kn: str
    qualification_reasons_kn: List[str]
    required_documents_kn: List[str]
    how_to_apply_kn: str
    application_portal: Optional[str] = None

class EligibilityEvaluateResponse(BaseModel):
    farmer_id: int
    evaluated_at: datetime
    eligible_schemes: List[EvaluatedSchemeItem] = []
    partially_eligible_schemes: List[Dict[str, Any]] = []
    ineligible_schemes: List[Dict[str, Any]] = []
