from fastapi import APIRouter, HTTPException
from app.schemas.schemas import ApiResponse, VoiceProcessRequest
from app.services.voice_service import voice_service

router = APIRouter()

@router.post("/process", response_model=ApiResponse)
def process_voice_utterance(payload: VoiceProcessRequest):
    try:
        result = voice_service.process_utterance(
            session_id=payload.session_id,
            transcript=payload.transcript_kannada or "",
            farmer_id=payload.farmer_id
        )
        return ApiResponse(
            success=True,
            data=result,
            message="Voice turn processed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
