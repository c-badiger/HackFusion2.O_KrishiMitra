from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.models import VoiceConversation, VoiceMessage, Farmer
from app.schemas.schemas import ApiResponse, ChatMessageRequest, ChatMessageResponse
from app.services.voice_service import voice_service

router = APIRouter()

STATUTORY_DISCLAIMER_KN = (
    "ಗಮನಿಸಿ: ಇದು ಸಂಭಾವ್ಯ ಅರ್ಹತಾ ಮಾಹಿತಿ ಮಾತ್ರ. ಅಂತಿಮ ಅನುಮೋದನೆಯು ಸಂಬಂಧಪಟ್ಟ ಕೃಷಿ ಇಲಾಖೆಯ ಅಧಿಕೃತ ಪರಿಶೀಲನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ."
)
STATUTORY_DISCLAIMER_EN = (
    "Disclaimer: This is indicative preliminary guidance only. Official sanction is subject to departmental verification."
)

@router.post("/message", response_model=ApiResponse, summary="Conversational Dialogue Assistant (Kannada & English)")
def send_chat_message(payload: ChatMessageRequest, db: Optional[Session] = Depends(get_db)):
    """
    Core conversational interface. Accepts natural language messages in Kannada or English,
    extracts agricultural attributes (landholding, crops, irrigation, category),
    tracks conversation turns, and evaluates matched government schemes.
    """
    try:
        # If farmer_id is provided, pre-seed session slots with farmer's existing profile if available
        if payload.farmer_id and db is not None:
            farmer = db.query(Farmer).filter(Farmer.id == payload.farmer_id).first()
            if farmer and payload.session_id:
                if payload.session_id not in voice_service.sessions:
                    voice_service.sessions[payload.session_id] = {
                        "farmer_id": farmer.id,
                        "slots": {
                            "district": farmer.district,
                            "district_kn": farmer.district_kn,
                            "total_land_acres": float(farmer.total_land_acres or 0.0),
                            "caste_category": farmer.caste_category,
                            "annual_income": float(farmer.annual_income or 0.0),
                            "irrigation_type": farmer.irrigation_type,
                            "has_borewell": farmer.has_borewell,
                            "crops": [
                                {
                                    "crop_name": c.crop_name,
                                    "crop_name_kn": c.crop_name_kn,
                                    "crop_category": c.crop_category,
                                    "acres": float(c.acres)
                                }
                                for c in farmer.crops
                            ]
                        },
                        "history": []
                    }

        # Process utterance through dialogue service
        turn_result = voice_service.process_utterance(
            session_id=payload.session_id or "",
            transcript=payload.message,
            farmer_id=payload.farmer_id
        )

        session_id = turn_result["session_id"]

        # Persist conversation and messages to database if database is connected
        if db is not None:
            try:
                convo = db.query(VoiceConversation).filter(VoiceConversation.session_id == session_id).first()
                if not convo:
                    convo = VoiceConversation(
                        session_id=session_id,
                        farmer_id=payload.farmer_id
                    )
                    db.add(convo)
                    db.flush()

                # User message record
                user_msg = VoiceMessage(
                    conversation_id=convo.id,
                    sender="user",
                    transcript_kn=payload.message,
                    transcript_en=None,
                    intent_detected=turn_result["detected_intent"],
                    parameters_extracted_json=turn_result["extracted_parameters"]
                )
                db.add(user_msg)

                # Assistant reply record
                asst_msg = VoiceMessage(
                    conversation_id=convo.id,
                    sender="assistant",
                    transcript_kn=turn_result["assistant_reply_kannada"],
                    transcript_en=turn_result["assistant_reply_english"],
                    intent_detected=None,
                    parameters_extracted_json=None
                )
                db.add(asst_msg)
                db.commit()
            except Exception:
                db.rollback()

        response_data = ChatMessageResponse(
            session_id=session_id,
            detected_intent=turn_result["detected_intent"],
            extracted_parameters=turn_result["extracted_parameters"],
            missing_parameters=turn_result["missing_parameters"],
            reply_kannada=turn_result["assistant_reply_kannada"],
            reply_english=turn_result["assistant_reply_english"],
            quick_replies_kannada=turn_result.get("quick_replies_kannada", []),
            eligible_schemes_count=turn_result["eligible_schemes_count"],
            recommended_schemes=turn_result["matched_schemes"],
            disclaimer_kn=STATUTORY_DISCLAIMER_KN,
            disclaimer_en=STATUTORY_DISCLAIMER_EN
        )

        return ApiResponse(
            success=True,
            data=response_data.model_dump(),
            message="Chat message processed successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat message: {str(e)}"
        )
