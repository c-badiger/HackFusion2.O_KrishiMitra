from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
import uvicorn
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api.api_router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("krishi_mitra.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database schema & seed verified schemes
    logger.info("Initializing Krishi Mitra backend...")
    init_db()
    logger.info("Krishi Mitra database schema verified and schemes seeded.")
    yield
    # Shutdown
    logger.info("Shutting down Krishi Mitra backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "**Krishi Mitra (ಕೃಷಿ ಮಿತ್ರ)** is a voice-first AI agricultural assistant for Karnataka farmers. "
        "It provides Kannada voice interaction, farmer profile management, and deterministic, "
        "explainable rule-based government scheme matching for verified Karnataka and Central schemes."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# ==========================================
# CORS Configuration for Vite Frontend
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Standardized Error Handlers
# ==========================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.detail,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "details": exc.detail
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field_loc = " -> ".join([str(loc) for loc in err["loc"]])
        errors.append(f"{field_loc}: {err['msg']}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "message": "Input validation error",
            "error": {
                "code": "VALIDATION_ERROR",
                "details": "; ".join(errors)
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during request {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": "Internal server error occurred",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "details": str(exc)
            }
        }
    )

# ==========================================
# Mount API Routers
# ==========================================
# 1. Mount at /api (matching user API requirements)
app.include_router(api_router, prefix="/api")

# 2. Also mount at /api/v1 (matching API_CONTRACT.md)
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", summary="Root Welcome & Sitemap")
def root():
    return {
        "project": "Krishi Mitra (ಕೃಷಿ ಮಿತ್ರ)",
        "purpose": "Voice-First AI Government Scheme Assistant for Karnataka Farmers",
        "swagger_docs": "/docs",
        "redoc_docs": "/redoc",
        "endpoints": {
            "health": "/api/health",
            "farmer_register": "POST /api/farmers/register",
            "farmer_profile": "GET /api/farmers/{farmer_id}",
            "schemes_list": "GET /api/schemes",
            "scheme_recommend": "POST /api/schemes/recommend",
            "scheme_check_eligibility": "POST /api/schemes/check-eligibility",
            "chat_message": "POST /api/chat/message"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
