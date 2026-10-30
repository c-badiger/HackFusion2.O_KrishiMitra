from typing import Optional, List, Any, Dict, Union
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

# ==========================================
# Standard Response Envelope
# ==========================================
class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    message: str = "Operation completed successfully"
    error: Optional[Dict[str, Any]] = None

# ==========================================
# Crop Schemas
# ==========================================
class CropInput(BaseModel):
    crop_name: str = Field(..., example="Ragi")
    crop_name_kn: Optional[str] = Field(None, example="ರಾಗಿ")
    crop_category: str = Field("Siridhanya_Millet", example="Siridhanya_Millet")
    acres: float = Field(1.0, ge=0.0, example=2.0)
    season: str = Field("Kharif", example="Kharif")

class CropResponse(CropInput):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ==========================================
# Farmer Schemas
# ==========================================
class FarmerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, example="ಬಸವರಾಜ್ ಗೌಡ (Basavaraj Gowda)")
    phone_number: str = Field(..., min_length=10, max_length=15, example="9876543210")
    district: str = Field(..., example="Mandya")
    district_kn: Optional[str] = Field(None, example="ಮಂಡ್ಯ")
    taluk: Optional[str] = Field(None, example="Maddur")
    village: Optional[str] = Field(None, example="Besagarahalli")
    caste_category: str = Field("General", example="OBC")
    annual_income: float = Field(0.0, ge=0.0, example=95000.0)
    total_land_acres: float = Field(..., ge=0.0, example=2.5)
    farmer_category: Optional[str] = Field(None, example="Small")
    soil_type: Optional[str] = Field("Red Loamy", example="Red Loamy")
    irrigation_type: str = Field("Rainfed", example="Rainfed")
    has_borewell: bool = Field(False, example=False)
    fruits_id: Optional[str] = Field(None, example="KA-2024-FR-98214")
    aadhaar_last_four: Optional[str] = Field(None, min_length=4, max_length=4, example="4812")
    crops: Optional[List[CropInput]] = []

    @field_validator("farmer_category", mode="before")
    def compute_category_if_empty(cls, v, info):
        if v:
            return v
        data = info.data
        acres = data.get("total_land_acres", 0.0) or 0.0
        if acres < 2.47:
            return "Marginal"
        elif acres <= 4.94:
            return "Small"
        elif acres <= 24.7:
            return "Medium"
        return "Large"

class FarmerResponse(BaseModel):
    id: int
    fruits_id: Optional[str] = None
    full_name: str
    phone_number: str
    aadhaar_last_four: Optional[str] = None
    district: str
    district_kn: str
    taluk: Optional[str] = None
    village: Optional[str] = None
    caste_category: str
    annual_income: float
    total_land_acres: float
    farmer_category: str
    soil_type: Optional[str] = None
    irrigation_type: str
    has_borewell: bool
    crops: List[CropResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# Scheme Catalog Schemas
# ==========================================
class SchemeRuleItem(BaseModel):
    id: Optional[int] = None
    rule_code: str
    parameter_name: str
    operator: str
    target_value: str
    is_mandatory: bool
    explanation_kn: str
    explanation_en: str
    class Config:
        from_attributes = True

class SchemeDocumentItem(BaseModel):
    id: Optional[int] = None
    document_name_en: str
    document_name_kn: str
    is_mandatory: bool
    issuing_authority_kn: Optional[str] = None
    class Config:
        from_attributes = True

class SchemeResponse(BaseModel):
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
    rules: List[SchemeRuleItem] = []
    documents: List[SchemeDocumentItem] = []
    class Config:
        from_attributes = True

# ==========================================
# Recommendation & Eligibility Schemas
# ==========================================
class FarmerProfileInput(BaseModel):
    total_land_acres: float = Field(..., ge=0.0, example=2.5)
    caste_category: str = Field("General", example="OBC")
    annual_income: float = Field(0.0, ge=0.0, example=95000.0)
    irrigation_type: str = Field("Rainfed", example="Rainfed")
    has_borewell: bool = Field(False, example=False)
    district: Optional[str] = Field("Mandya", example="Mandya")
    crops: Optional[List[CropInput]] = []

class SchemeRecommendRequest(BaseModel):
    farmer_id: Optional[int] = Field(None, example=1)
    profile: Optional[FarmerProfileInput] = None

class RecommendedScheme(BaseModel):
    scheme_id: int
    scheme_code: str
    name_en: str
    name_kn: str
    department_kn: str
    match_score: int
    indicative_status: str  # "LIKELY_ELIGIBLE", "PARTIALLY_ELIGIBLE", "POTENTIAL"
    benefit_amount_kn: str
    qualification_reasons_kn: List[str]
    missing_criteria_kn: List[str] = []
    required_documents_kn: List[str]
    how_to_apply_kn: str
    application_portal: Optional[str] = None

class SchemeRecommendResponse(BaseModel):
    farmer_id: Optional[int] = None
    recommendations_count: int
    schemes: List[RecommendedScheme]
    statutory_disclaimer_kn: str
    statutory_disclaimer_en: str

class SchemeCheckEligibilityRequest(BaseModel):
    farmer_id: int = Field(..., example=1)
    scheme_id: Optional[int] = Field(None, example=1)

class EligibilityEvaluationItem(BaseModel):
    scheme_id: int
    scheme_code: str
    name_en: str
    name_kn: str
    status: str  # "ELIGIBLE", "PARTIALLY_ELIGIBLE", "INELIGIBLE"
    match_score: int
    benefit_amount_kn: str
    satisfied_conditions_kn: List[str]
    unsatisfied_conditions_kn: List[str]
    required_documents_kn: List[str]
    how_to_apply_kn: str
    application_portal: Optional[str] = None

class SchemeCheckEligibilityResponse(BaseModel):
    farmer_id: int
    evaluated_at: datetime
    evaluations: List[EligibilityEvaluationItem]
    statutory_disclaimer_kn: str
    statutory_disclaimer_en: str

# ==========================================
# Chat & Dialogue Schemas
# ==========================================
class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = Field(None, example="sess_demo_101")
    message: str = Field(..., min_length=1, example="ನನ್ನ ಬಳಿ ಮಂಡ್ಯದಲ್ಲಿ 3 ಎಕರೆ ಜಮೀನು ಇದೆ, ರಾಗಿ ಬೆಳೆಯುತ್ತೇನೆ")
    farmer_id: Optional[int] = Field(None, example=1)

class ChatMessageResponse(BaseModel):
    session_id: str
    detected_intent: str
    extracted_parameters: Dict[str, Any]
    missing_parameters: List[str]
    reply_kannada: str
    reply_english: str
    quick_replies_kannada: List[str]
    eligible_schemes_count: int
    recommended_schemes: List[Dict[str, Any]]
    disclaimer_kn: str
    disclaimer_en: str

# ==========================================
# Voice Processing Schemas (Backward Compatibility)
# ==========================================
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
