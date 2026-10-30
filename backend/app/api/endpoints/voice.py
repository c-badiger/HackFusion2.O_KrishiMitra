from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Farmer
from app.schemas.schemas import ApiResponse, VoiceProcessRequest
from app.services.voice_service import voice_service

router = APIRouter()

@router.post("/process", response_model=ApiResponse)
def process_voice_utterance(payload: VoiceProcessRequest, db: Optional[Session] = Depends(get_db)):
    try:
        transcript = (payload.transcript_kannada or "").strip()
        if not transcript and payload.audio_base64:
            if len(payload.audio_base64) > 14 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Audio upload exceeds the 10 MB limit")
            transcript = voice_service.transcribe_audio(payload.audio_base64, payload.audio_format or "webm") or ""
            if not transcript:
                raise HTTPException(
                    status_code=503,
                    detail="Kannada speech recognition is temporarily unavailable. Please retry or type your message.",
                )
        if not transcript:
            raise HTTPException(
                status_code=422,
                detail="Kannada transcript is required; use browser speech recognition or configure backend transcription.",
            )

        initial_slots = None
        if payload.farmer_id and db is not None:
            farmer = db.query(Farmer).filter(Farmer.id == payload.farmer_id).first()
            if farmer:
                initial_slots = {
                    "district": farmer.district,
                    "district_kn": farmer.district_kn,
                    "total_land_acres": float(farmer.total_land_acres or 0.0),
                    "caste_category": farmer.caste_category,
                    "annual_income": float(farmer.annual_income or 0.0),
                    "irrigation_type": farmer.irrigation_type,
                    "has_borewell": farmer.has_borewell,
                    "crops": [
                        {
                            "crop_name": crop.crop_name,
                            "crop_name_kn": crop.crop_name_kn,
                            "crop_category": crop.crop_category,
                            "acres": float(crop.acres),
                        }
                        for crop in farmer.crops
                    ],
                }

        result = voice_service.process_utterance(
            session_id=payload.session_id,
            transcript=transcript,
            farmer_id=payload.farmer_id,
            initial_slots=initial_slots,
        )
        result["transcript_kannada"] = transcript
        audio_id = voice_service.create_tts_audio(result["assistant_reply_kannada"])
        result["tts_audio_url"] = f"/api/v1/voice/tts?id={audio_id}" if audio_id else None
        return ApiResponse(
            success=True,
            data=result,
            message="Voice turn processed successfully"
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Voice turn could not be processed")


@router.get("/tts", responses={200: {"content": {"audio/wav": {}}}})
def get_voice_audio(audio_id: str = Query(..., alias="id")):
    audio = voice_service.get_tts_audio(audio_id)
    if not audio:
        raise HTTPException(status_code=404, detail="Generated Kannada audio was not found or has expired")
    return Response(content=audio, media_type="audio/wav", headers={"Cache-Control": "no-store"})
