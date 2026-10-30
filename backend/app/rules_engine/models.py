"""
Krishi Mitra - Eligibility Engine Models & Types
Defines structured schemas for government schemes, statutory rules,
farmer profiles, and evaluation outcomes.
"""

from enum import Enum
from typing import Optional, List, Any, Dict, Union
from pydantic import BaseModel, Field


class EligibilityStatus(str, Enum):
    """
    Three-state determination for statutory scheme eligibility.
    Ensures clear distinction between qualified, disqualified, and incomplete applications.
    """
    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"
    INSUFFICIENT_INFORMATION = "INSUFFICIENT_INFORMATION"


class RuleOperator(str, Enum):
    """
    Deterministic comparison operators for transparent rule checks.
    """
    EQ = "="
    NEQ = "!="
    LT = "<"
    LTE = "<="
    GT = ">"
    GTE = ">="
    IN = "IN"
    NOT_IN = "NOT_IN"
    CONTAINS = "CONTAINS"
    BETWEEN = "BETWEEN"
    EXISTS = "EXISTS"


class RuleEvaluationStatus(str, Enum):
    """
    Result status of evaluating a single rule condition against farmer data.
    """
    PASSED = "PASSED"
    FAILED = "FAILED"
    MISSING_DATA = "MISSING_DATA"
    NOT_APPLICABLE = "NOT_APPLICABLE"


# Statutory Disclaimers - Explicitly stating this is indicative assessment and NOT official sanction
STATUTORY_DISCLAIMER_EN = (
    "Indicative preliminary assessment only. Krishi Mitra does not grant official government approval. "
    "Scheme sanction, document verification, and subsidy disbursement are subject to final scrutiny by "
    "competent Karnataka State or Government of India authorities."
)

STATUTORY_DISCLAIMER_KN = (
    "ಗಮನಿಸಿ: ಇದು ಕೃಷಿ ಮಿತ್ರ ವ್ಯವಸ್ಥೆಯ ಸಂಭಾವ್ಯ ಪ್ರಾಥಮಿಕ ಅರ್ಹತಾ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ. ಇದು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಅನುಮೋದನೆಯಲ್ಲ. "
    "ಯೋಜನೆಯ ಮಂಜೂರಾತಿ, ದಾಖಲೆ ಪರಿಶೀಲನೆ ಹಾಗೂ ಸಬ್ಸಿಡಿ ಬಿಡುಗಡೆಯು ಸಂಬಂಧಪಟ್ಟ ಕರ್ನಾಟಕ ಸರ್ಕಾರ ಅಥವಾ ಭಾರತ ಸರ್ಕಾರದ "
    "ಅಧಿಕೃತ ಇಲಾಖೆಗಳ ತಪಾಸಣೆ ಮತ್ತು ಚಾಲ್ತಿಯಲ್ಲಿರುವ ನಿಯಮಾವಳಿಗಳಿಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ."
)


# =====================================================================
# Scheme Definition Schemas
# =====================================================================

class DocumentRequirement(BaseModel):
    """
    Official document checklist required by the nodal department.
    """
    document_name_en: str
    document_name_kn: str
    is_mandatory: bool = True
    issuing_authority_en: Optional[str] = None
    issuing_authority_kn: Optional[str] = None


class RuleCondition(BaseModel):
    """
    A single deterministic statutory condition that a farmer must satisfy.
    """
    rule_code: str
    parameter_name: str
    operator: RuleOperator
    target_value: Any
    is_mandatory: bool = True
    explanation_en: str
    explanation_kn: str
    missing_prompt_en: Optional[str] = None
    missing_prompt_kn: Optional[str] = None


class GovernmentScheme(BaseModel):
    """
    Structured representation of an authentic government welfare scheme.
    Maintains verified official sources, verification timestamps, and statutory guidelines.
    """
    id: int
    scheme_code: str
    name_en: str
    name_kn: str
    department_en: str
    department_kn: str
    category: str
    level: str  # "Karnataka_State" or "Central_Government"
    benefit_type: str
    benefit_amount_desc_en: str
    benefit_amount_desc_kn: str
    summary_en: str
    summary_kn: str
    application_portal: Optional[str] = None
    source_url: str  # Verified official government web portal / gazette
    last_verified_date: str  # ISO date string e.g., '2024-12-01'
    official_reference: str  # Formal Government Order, Gazette circular or Scheme Guideline
    is_active: bool = True
    rules: List[RuleCondition] = []
    documents: List[DocumentRequirement] = []


# =====================================================================
# Farmer Profile Schemas
# =====================================================================

class CropRecord(BaseModel):
    """
    Details of a crop cultivated by the farmer.
    """
    crop_name: str
    crop_name_kn: Optional[str] = None
    crop_category: str = "Cereal"  # Siridhanya_Millet, Cereal, Pulse, Oilseed, Cash_Crop, Horticulture
    acres: float = 1.0
    season: str = "Kharif"  # Kharif, Rabi, Summer, Annual


class FarmerProfile(BaseModel):
    """
    Comprehensive farmer parameters used for statutory eligibility comparison.
    Fields may be None when information has not yet been collected from the farmer.
    """
    id: Optional[int] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    district: Optional[str] = None
    district_kn: Optional[str] = None
    taluk: Optional[str] = None
    village: Optional[str] = None
    state: str = "Karnataka"

    caste_category: Optional[str] = None  # SC, ST, OBC, General
    annual_income: Optional[float] = None
    total_land_acres: Optional[float] = None
    farmer_category: Optional[str] = None  # Marginal, Small, Medium, Large
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None  # Rainfed, Canal, Borewell, Dryland, Drip, Sprinkler
    has_borewell: Optional[bool] = None
    crops: List[CropRecord] = []

    # Additional statutory indicators
    fruits_id: Optional[str] = None
    aadhaar_linked_bank_account: Optional[bool] = None
    is_income_tax_payee: Optional[bool] = None
    has_student_children: Optional[bool] = None
    has_kisan_credit_card: Optional[bool] = None


# =====================================================================
# Evaluation Outcome Schemas
# =====================================================================

class RuleEvaluationResult(BaseModel):
    """
    Evaluation record for an individual rule condition.
    """
    rule_code: str
    parameter_name: str
    operator: str
    target_value: Any
    actual_value: Any
    status: RuleEvaluationStatus
    is_mandatory: bool
    explanation_en: str
    explanation_kn: str
    detail_message_en: str
    detail_message_kn: str
    missing_field: Optional[str] = None
    missing_prompt_en: Optional[str] = None
    missing_prompt_kn: Optional[str] = None


class MissingInfoItem(BaseModel):
    """
    A specific agricultural parameter that is missing from the farmer's profile,
    along with bilingual prompts and which schemes are blocked pending this data.
    """
    field_name: str
    label_en: str
    label_kn: str
    question_en: str
    question_kn: str
    affects_schemes: List[str]
    priority: int = 1


class SchemeEvaluationResult(BaseModel):
    """
    Audit-traceable evaluation result for a single scheme against farmer profile.
    """
    scheme_id: int
    scheme_code: str
    name_en: str
    name_kn: str
    department_en: str
    department_kn: str
    category: str
    level: str
    status: EligibilityStatus
    match_score: int  # 0 to 100 percentage
    source_url: str
    last_verified_date: str
    official_reference: str
    benefit_amount_desc_en: str
    benefit_amount_desc_kn: str
    summary_en: str
    summary_kn: str

    satisfied_conditions_en: List[str] = []
    satisfied_conditions_kn: List[str] = []
    unsatisfied_conditions_en: List[str] = []
    unsatisfied_conditions_kn: List[str] = []
    missing_information_en: List[str] = []
    missing_information_kn: List[str] = []

    required_documents_en: List[str] = []
    required_documents_kn: List[str] = []
    how_to_apply_en: str = "Apply through your village Raitha Samparka Kendra (RSK) or the official nodal portal."
    how_to_apply_kn: str = "ನಿಮ್ಮ ಗ್ರಾಮದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) ಅಥವಾ ಅಧಿಕೃತ ನೋಡಲ್ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
    application_portal: Optional[str] = None

    rule_evaluations: List[RuleEvaluationResult] = []


class EvaluationSummary(BaseModel):
    """
    Aggregated response returned to the FastAPI backend.
    """
    evaluated_at: str
    farmer_id: Optional[int] = None
    total_schemes_evaluated: int
    eligible_count: int
    insufficient_info_count: int
    ineligible_count: int

    eligible_schemes: List[SchemeEvaluationResult] = []
    insufficient_info_schemes: List[SchemeEvaluationResult] = []
    ineligible_schemes: List[SchemeEvaluationResult] = []

    all_missing_information: List[MissingInfoItem] = []

    statutory_disclaimer_en: str = STATUTORY_DISCLAIMER_EN
    statutory_disclaimer_kn: str = STATUTORY_DISCLAIMER_KN
