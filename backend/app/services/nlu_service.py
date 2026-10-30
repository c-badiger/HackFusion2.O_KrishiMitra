import base64
import json
import logging
import re
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("krishi_mitra.nlu")


class KannadaNluService:
    """Optional Kannada NLU adapter; never evaluates eligibility or creates scheme facts."""

    def extract_farmer_slots(
        self,
        transcript: str,
        current_slots: Dict[str, Any],
        recent_history: list[Dict[str, str]],
    ) -> Optional[Dict[str, Any]]:
        if not settings.GEMINI_API_KEY:
            return None

        prompt = {
            "task": "Extract only farmer facts explicitly stated in the latest message.",
            "language": "The message may be Kannada or English. Understand Kannada naturally.",
            "latest_message": transcript,
            "current_profile_context": current_slots,
            "recent_conversation": recent_history,
            "output_rules": [
                "Return one JSON object only.",
                "Fields: district, total_land_acres, caste_category, annual_income, irrigation_type, has_borewell, crops.",
                "Use null for facts not stated in the latest message; do not repeat context as new facts.",
                "Use English canonical values for district, caste_category (SC/ST/OBC/General), and irrigation_type.",
                "Express land in acres; express crops as an array of names.",
                "Do not infer eligibility, recommend schemes, or invent farmer details.",
            ],
        }
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_MODEL}:generateContent"
        )
        try:
            response = httpx.post(
                url,
                headers={"x-goog-api-key": settings.GEMINI_API_KEY},
                json={
                    "contents": [{"parts": [{"text": json.dumps(prompt, ensure_ascii=False)}]}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
                },
                timeout=8.0,
            )
            response.raise_for_status()
            text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
            result = json.loads(text)
            return result if isinstance(result, dict) else None
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            status = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
            logger.warning(
                "Kannada NLU unavailable; using local extraction (%s, HTTP %s)",
                type(exc).__name__,
                status or "n/a",
            )
            return None

    def transcribe_audio(self, audio_base64: str, audio_format: str) -> Optional[str]:
        if not settings.GEMINI_API_KEY:
            return None

        mime_types = {
            "webm": "audio/webm",
            "wav": "audio/wav",
            "mp3": "audio/mp3",
            "mpeg": "audio/mpeg",
            "m4a": "audio/m4a",
            "aac": "audio/aac",
            "ogg": "audio/ogg",
            "flac": "audio/flac",
            "audio/webm": "audio/webm",
            "audio/wav": "audio/wav",
            "audio/mp3": "audio/mp3",
            "audio/mpeg": "audio/mpeg",
            "audio/m4a": "audio/m4a",
            "audio/aac": "audio/aac",
            "audio/ogg": "audio/ogg",
            "audio/flac": "audio/flac",
        }
        normalized_format = (audio_format or "webm").strip().lower().split(";", 1)[0].strip()
        normalized_format = normalized_format.lstrip(".")
        if normalized_format.startswith("audio/"):
            normalized_format = normalized_format.replace("audio/", "", 1)
        mime_type = mime_types.get(normalized_format) or mime_types.get(f"audio/{normalized_format}")
        if not mime_type:
            return None

        try:
            audio_bytes = base64.b64decode(audio_base64, validate=True)
            if not audio_bytes or len(audio_bytes) > 10 * 1024 * 1024:
                return None
            response = httpx.post(
                "https://generativelanguage.googleapis.com/v1beta/interactions",
                headers={"x-goog-api-key": settings.GEMINI_API_KEY},
                json={
                    "model": settings.GEMINI_TRANSCRIBE_MODEL,
                    "input": [{
                        "type": "audio",
                        "data": audio_base64,
                        "mime_type": mime_type,
                    }],
                    "generation_config": {
                        "transcription_config": {
                            "language_codes": ["kn-IN"],
                            "mode": "smart",
                        }
                    },
                },
                timeout=20.0,
            )
            response.raise_for_status()
            body = response.json()
            transcript = body.get("output_text")
            if not transcript:
                transcript = " ".join(
                    block["text"]
                    for step in body.get("steps", [])
                    if step.get("type") == "model_output"
                    for block in step.get("content", [])
                    if block.get("type") == "text" and isinstance(block.get("text"), str)
                )
            return transcript.strip() if isinstance(transcript, str) and transcript.strip() else None
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            status = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
            logger.warning(
                "Kannada audio transcription unavailable (%s, HTTP %s)",
                type(exc).__name__,
                status or "n/a",
            )
            return None

    def synthesize_kannada_speech(self, text: str) -> Optional[bytes]:
        if not settings.GEMINI_API_KEY or not text.strip():
            return None

        try:
            response = httpx.post(
                "https://generativelanguage.googleapis.com/v1beta/interactions",
                headers={"x-goog-api-key": settings.GEMINI_API_KEY},
                json={
                    "model": settings.GEMINI_TTS_MODEL,
                    "input": [{
                        "type": "user_input",
                        "content": [{"type": "text", "text": text}],
                    }],
                    "response_format": {"type": "audio"},
                    "generation_config": {
                        "speech_config": [{"voice": settings.GEMINI_TTS_VOICE}],
                    },
                },
                timeout=30.0,
            )
            response.raise_for_status()
            payload = response.json()
            encoded_audio = next(
                (
                    block["data"]
                    for step in payload.get("steps", [])
                    for block in step.get("content", [])
                    if block.get("type") == "audio" and block.get("data")
                ),
                None,
            )
            if not encoded_audio:
                return None
            audio = base64.b64decode(encoded_audio, validate=True)
            if not audio.startswith(b"RIFF"):
                logger.warning("Gemini TTS response was not a WAV file")
                return None
            return audio
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            status = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
            logger.warning("Kannada TTS unavailable (%s, HTTP %s)", type(exc).__name__, status or "n/a")
            return None


kannada_nlu_service = KannadaNluService()