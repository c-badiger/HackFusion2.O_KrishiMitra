from sqlalchemy import Column, Integer, String, Boolean, Numeric, Text, ForeignKey, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fruits_id = Column(String(64), unique=True, nullable=True, index=True)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(15), nullable=False, index=True)
    aadhaar_last_four = Column(String(4), nullable=True)
    district = Column(String(100), nullable=False)
    district_kn = Column(String(100), nullable=False)
    taluk = Column(String(100), nullable=True)
    village = Column(String(100), nullable=True)
    caste_category = Column(SQLEnum('SC', 'ST', 'OBC', 'General', name='caste_enum'), nullable=False, default='General')
    annual_income = Column(Numeric(12, 2), nullable=False, default=0.00)
    total_land_acres = Column(Numeric(6, 2), nullable=False, default=0.00)
    farmer_category = Column(SQLEnum('Marginal', 'Small', 'Medium', 'Large', name='category_enum'), nullable=False, default='Small')
    soil_type = Column(String(60), nullable=True, default='Red Loamy')
    irrigation_type = Column(String(60), nullable=False, default='Rainfed')
    has_borewell = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    crops = relationship("Crop", back_populates="farmer", cascade="all, delete-orphan")
    evaluations = relationship("EligibilityEvaluation", back_populates="farmer", cascade="all, delete-orphan")
    conversations = relationship("VoiceConversation", back_populates="farmer")

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(100), nullable=False)
    crop_name_kn = Column(String(100), nullable=False)
    crop_category = Column(SQLEnum('Siridhanya_Millet', 'Cereal', 'Pulse', 'Oilseed', 'Cash_Crop', 'Horticulture', name='crop_category_enum'), nullable=False)
    acres = Column(Numeric(6, 2), nullable=False, default=1.00)
    season = Column(SQLEnum('Kharif', 'Rabi', 'Summer', 'Annual', name='season_enum'), nullable=False, default='Kharif')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farmer = relationship("Farmer", back_populates="crops")

class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_code = Column(String(50), unique=True, nullable=False, index=True)
    name_en = Column(String(200), nullable=False)
    name_kn = Column(String(200), nullable=False)
    department_en = Column(String(200), nullable=False)
    department_kn = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    level = Column(SQLEnum('Karnataka_State', 'Central_Government', name='scheme_level_enum'), nullable=False, default='Karnataka_State')
    benefit_type = Column(SQLEnum('Direct_Benefit_Transfer', 'Subsidy_Capital', 'Credit_Interest_Subvention', 'Insurance', 'Input_Subsidy', name='benefit_type_enum'), nullable=False)
    benefit_amount_desc_en = Column(Text, nullable=False)
    benefit_amount_desc_kn = Column(Text, nullable=False)
    summary_en = Column(Text, nullable=False)
    summary_kn = Column(Text, nullable=False)
    application_portal = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rules = relationship("SchemeEligibilityRule", back_populates="scheme", cascade="all, delete-orphan")
    documents = relationship("SchemeDocument", back_populates="scheme", cascade="all, delete-orphan")
    evaluations = relationship("EligibilityEvaluation", back_populates="scheme")

class SchemeEligibilityRule(Base):
    __tablename__ = "scheme_eligibility_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_id = Column(Integer, ForeignKey("government_schemes.id", ondelete="CASCADE"), nullable=False)
    rule_code = Column(String(60), nullable=False)
    parameter_name = Column(String(60), nullable=False)
    operator = Column(SQLEnum('=', '!=', '<', '<=', '>', '>=', 'IN', 'CONTAINS', name='operator_enum'), nullable=False)
    target_value = Column(String(255), nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    explanation_kn = Column(Text, nullable=False)
    explanation_en = Column(Text, nullable=False)

    scheme = relationship("GovernmentScheme", back_populates="rules")

class SchemeDocument(Base):
    __tablename__ = "scheme_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_id = Column(Integer, ForeignKey("government_schemes.id", ondelete="CASCADE"), nullable=False)
    document_name_en = Column(String(150), nullable=False)
    document_name_kn = Column(String(150), nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    issuing_authority_kn = Column(String(150), nullable=True)

    scheme = relationship("GovernmentScheme", back_populates="documents")

class VoiceConversation(Base):
    __tablename__ = "voice_conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    farmer = relationship("Farmer", back_populates="conversations")
    messages = relationship("VoiceMessage", back_populates="conversation", cascade="all, delete-orphan")

class VoiceMessage(Base):
    __tablename__ = "voice_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("voice_conversations.id", ondelete="CASCADE"), nullable=False)
    sender = Column(SQLEnum('user', 'assistant', name='sender_enum'), nullable=False)
    transcript_kn = Column(Text, nullable=False)
    transcript_en = Column(Text, nullable=True)
    intent_detected = Column(String(80), nullable=True)
    parameters_extracted_json = Column(JSON, nullable=True)
    audio_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("VoiceConversation", back_populates="messages")

class EligibilityEvaluation(Base):
    __tablename__ = "eligibility_evaluations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("government_schemes.id", ondelete="CASCADE"), nullable=False)
    status = Column(SQLEnum('ELIGIBLE', 'PARTIALLY_ELIGIBLE', 'INELIGIBLE', name='status_enum'), nullable=False)
    match_score = Column(Integer, nullable=False, default=0)
    reasons_json = Column(JSON, nullable=False)
    missing_criteria_json = Column(JSON, nullable=True)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())

    farmer = relationship("Farmer", back_populates="evaluations")
    scheme = relationship("GovernmentScheme", back_populates="evaluations")
