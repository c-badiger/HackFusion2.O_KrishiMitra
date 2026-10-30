from fastapi import APIRouter
from app.api.endpoints import health, voice, schemes, farmers, eligibility

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(voice.router, prefix="/voice", tags=["Voice Assistant"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["Schemes"])
api_router.include_router(farmers.router, prefix="/farmers", tags=["Farmers"])
api_router.include_router(eligibility.router, prefix="/eligibility", tags=["Eligibility Engine"])
