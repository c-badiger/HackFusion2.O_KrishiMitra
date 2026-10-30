from fastapi import APIRouter
from app.api.endpoints import health, farmers, schemes, eligibility, chat, voice

api_router = APIRouter()

# Health probe
api_router.include_router(health.router, tags=["Health"])

# Farmer Profile & Registration APIs
api_router.include_router(farmers.router, prefix="/farmers", tags=["Farmers"])

# Government Schemes, Recommendation & Eligibility APIs
api_router.include_router(schemes.router, prefix="/schemes", tags=["Government Schemes"])

# Dedicated Deterministic Eligibility Engine APIs
api_router.include_router(eligibility.router, prefix="/eligibility", tags=["Eligibility Engine"])

# Chat & Dialogue APIs
api_router.include_router(chat.router, prefix="/chat", tags=["Conversational Chat"])

# Voice Dialogue APIs
api_router.include_router(voice.router, prefix="/voice", tags=["Voice Assistant"])

