from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.core.config import settings
from app.api.api_router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Krishi Mitra - Voice-First AI Agricultural Scheme Assistant for Karnataka Farmers",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware configured strictly for Vite frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "Krishi Mitra (ಕೃಷಿ ಮಿತ್ರ)",
        "purpose": "Voice-First AI Government Scheme Assistant for Karnataka Farmers",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "health_check": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
