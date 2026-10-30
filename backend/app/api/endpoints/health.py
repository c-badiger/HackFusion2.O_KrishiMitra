from fastapi import APIRouter
from app.core.database import check_db_connection
from app.schemas.schemas import ApiResponse

router = APIRouter()

@router.get("/health", response_model=ApiResponse)
def get_health_status():
    db_connected = check_db_connection()
    return ApiResponse(
        success=True,
        data={
            "status": "healthy",
            "service": "krishi-mitra-backend",
            "database_connected": db_connected,
            "version": "1.0.0"
        },
        message="Backend server is running on port 8000"
    )
