import base64
import sys
import os
from pathlib import Path
import pytest

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app
from app.core.config import settings

client = TestClient(app)
registered_farmer_id = None

def test_1_health_endpoint():
    print("\n--- 1. Testing GET /api/health ---")
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "healthy"
    print("✓ /api/health passed:", body["data"]["database"])

def test_2_farmer_registration():
    global registered_farmer_id
    print("\n--- 2. Testing POST /api/farmers/register ---")
    payload = {
        "full_name": "ಬಸವರಾಜ್ ಗೌಡ (Basavaraj Gowda)",
        "phone_number": "9876543210",
        "district": "Mandya",
        "district_kn": "ಮಂಡ್ಯ",
        "taluk": "Maddur",
        "village": "Besagarahalli",
        "caste_category": "OBC",
        "annual_income": 95000.0,
        "total_land_acres": 2.5,
        "soil_type": "Red Loamy",
        "irrigation_type": "Rainfed",
        "has_borewell": False,
        "fruits_id": "KA-2024-FR-98214",
        "aadhaar_last_four": "4812",
        "crops": [
            {
                "crop_name": "Ragi",
                "crop_name_kn": "ರಾಗಿ",
                "crop_category": "Siridhanya_Millet",
                "acres": 2.0,
                "season": "Kharif"
            },
            {
                "crop_name": "Sugarcane",
                "crop_name_kn": "ಕಬ್ಬು",
                "crop_category": "Cash_Crop",
                "acres": 0.5,
                "season": "Annual"
            }
        ]
    }
    response = client.post("/api/farmers/register", json=payload)
    # Could be 201 Created (or 409 if already registered from earlier test)
    assert response.status_code in (201, 409), f"Unexpected status: {response.status_code}"
    body = response.json()
    if response.status_code == 201:
        registered_farmer_id = body["data"]["id"]
    else:
        farmers_response = client.get("/api/farmers")
        farmers = farmers_response.json().get("data", [])
        match = next((farmer for farmer in farmers if farmer["phone_number"] == payload["phone_number"]), None)
        assert match is not None, "Previously registered test farmer was not found"
        registered_farmer_id = match["id"]
    print("✓ POST /api/farmers/register response:", response.status_code, body["message"])

def test_3_get_farmer_profile():
    print("\n--- 3. Testing GET /api/farmers/1 ---")
    assert registered_farmer_id is not None
    response = client.get(f"/api/farmers/{registered_farmer_id}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    body = response.json()
    assert body["success"] is True
    farmer = body["data"]
    assert farmer["full_name"] == "ಬಸವರಾಜ್ ಗೌಡ (Basavaraj Gowda)"
    assert len(farmer["crops"]) >= 1
    print(f"✓ GET /api/farmers/{registered_farmer_id} passed: {farmer['full_name']}, {farmer['total_land_acres']} acres ({farmer['farmer_category']})")

def test_4_get_schemes_catalog():
    print("\n--- 4. Testing GET /api/schemes ---")
    response = client.get("/api/schemes")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    schemes = body["data"]
    assert len(schemes) > 0, "No schemes found in catalog"
    print(f"✓ GET /api/schemes passed. Found {len(schemes)} verified schemes:")
    for s in schemes[:3]:
        print(f"   - [{s['scheme_code']}] {s['name_kn']} ({s['name_en']})")

def test_5_recommend_schemes():
    print("\n--- 5. Testing POST /api/schemes/recommend ---")
    assert registered_farmer_id is not None
    payload = {"farmer_id": registered_farmer_id}
    response = client.post("/api/schemes/recommend", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["recommendations_count"] > 0
    assert "statutory_disclaimer_kn" in data
    assert "statutory_disclaimer_en" in data
    print(f"✓ POST /api/schemes/recommend passed. {data['recommendations_count']} recommendations generated.")
    for r in data["schemes"]:
        print(f"   • {r['name_kn']} (Score: {r['match_score']}%, Status: {r['indicative_status']})")
        print(f"     Reasons: {', '.join(r['qualification_reasons_kn'])}")

def test_6_check_eligibility():
    print("\n--- 6. Testing POST /api/schemes/check-eligibility ---")
    assert registered_farmer_id is not None
    payload = {"farmer_id": registered_farmer_id}
    response = client.post("/api/schemes/check-eligibility", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert len(data["evaluations"]) > 0
    assert "statutory_disclaimer_kn" in data
    print(f"✓ POST /api/schemes/check-eligibility passed. Evaluated {len(data['evaluations'])} schemes with audit trail.")
    for ev in data["evaluations"]:
        print(f"   - {ev['name_kn']}: {ev['status']} (Match: {ev['match_score']}%)")

def test_7_chat_dialogue():
    print("\n--- 7. Testing POST /api/chat/message ---")
    # Step 1: Initial Kannada message
    payload_1 = {
        "session_id": "test_session_889",
        "message": "ನನ್ನ ಬಳಿ ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 2.5 ಎಕರೆ ಜಮೀನು ಇದೆ, ನಾನು ರಾಗಿ ಬೆಳೆಯುತ್ತೇನೆ."
    }
    response_1 = client.post("/api/chat/message", json=payload_1)
    assert response_1.status_code == 200
    body_1 = response_1.json()
    assert body_1["success"] is True
    data_1 = body_1["data"]
    print("✓ Chat Turn 1 Output:")
    print("   User Input:", payload_1["message"])
    print("   Extracted Land:", data_1["extracted_parameters"].get("total_land_acres"))
    print("   Assistant (KN):", data_1["reply_kannada"])
    print("   Eligible Schemes Count:", data_1["eligible_schemes_count"])
    assert data_1["extracted_parameters"]["total_land_acres"] == 2.5

    # Step 2: Follow-up message answering irrigation
    payload_2 = {
        "session_id": "test_session_889",
        "message": "ನನ್ನ ಜಮೀನು ಮಳೆಯಾಶ್ರಿತ ಒಣಭೂಮಿ ಆಗಿದೆ."
    }
    response_2 = client.post("/api/chat/message", json=payload_2)
    assert response_2.status_code == 200
    body_2 = response_2.json()
    data_2 = body_2["data"]
    print("\n✓ Chat Turn 2 Output:")
    print("   User Input:", payload_2["message"])
    print("   Extracted Irrigation:", data_2["extracted_parameters"].get("irrigation_type"))
    print("   Assistant (KN):", data_2["reply_kannada"])
    print("   Eligible Schemes Count:", data_2["eligible_schemes_count"])
    assert data_2["extracted_parameters"]["irrigation_type"] == "Rainfed"

def test_voice_process_multi_turn_kannada():
    session_id = "test_voice_kannada_flow"
    first = client.post("/api/voice/process", json={
        "session_id": session_id,
        "transcript_kannada": "ನನ್ನ ಬಳಿ ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 2 ಎಕರೆ ಜಮೀನು ಇದೆ, ನಾನು ರಾಗಿ ಬೆಳೆಯುತ್ತೇನೆ."
    })
    assert first.status_code == 200
    first_data = first.json()["data"]
    assert first_data["extracted_parameters"]["total_land_acres"] == 2.0
    assert first_data["missing_parameters"] == ["irrigation_type", "caste_category"]
    assert first_data["assistant_reply_kannada"]

    second = client.post("/api/voice/process", json={
        "session_id": session_id,
        "transcript_kannada": "ನನ್ನ ಜಮೀನು ಮಳೆಯಾಶ್ರಿತ ಒಣಭೂಮಿ."
    })
    assert second.status_code == 200
    second_data = second.json()["data"]
    assert second_data["extracted_parameters"]["irrigation_type"] == "Rainfed"
    assert second_data["missing_parameters"] == ["caste_category"]

    third = client.post("/api/voice/process", json={
        "session_id": session_id,
        "transcript_kannada": "ನಾನು ಹಿಂದುಳಿದ ವರ್ಗದವನು."
    })
    assert third.status_code == 200
    third_data = third.json()["data"]
    assert third_data["extracted_parameters"]["caste_category"] == "OBC"
    assert third_data["missing_parameters"] == []
    assert third_data["session_id"] == session_id

def test_voice_process_requires_transcript_or_audio():
    response = client.post("/api/voice/process", json={"session_id": "empty_voice_turn"})
    assert response.status_code == 422

def test_voice_audio_provider_failure_returns_clear_status(monkeypatch):
    from app.services.voice_service import voice_service

    monkeypatch.setattr(voice_service, "transcribe_audio", lambda audio, audio_format: "")
    response = client.post("/api/voice/process", json={
        "session_id": "voice_provider_unavailable",
        "audio_base64": "dGVzdA==",
        "audio_format": "webm",
    })

    assert response.status_code == 503
    assert "type your message" in response.json()["message"].lower()

def test_voice_process_transcribes_audio(monkeypatch):
    from app.services.voice_service import voice_service

    monkeypatch.setattr(
        voice_service,
        "transcribe_audio",
        lambda audio, audio_format: "ನನ್ನ ಬಳಿ 3 ಎಕರೆ ಜಮೀನು ಇದೆ, ರಾಗಿ ಬೆಳೆಯುತ್ತೇನೆ.",
    )
    response = client.post("/api/voice/process", json={
        "session_id": "test_voice_audio_transcription",
        "audio_base64": "dGVzdA==",
        "audio_format": "webm",
    })

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["transcript_kannada"] == "ನನ್ನ ಬಳಿ 3 ಎಕರೆ ಜಮೀನು ಇದೆ, ರಾಗಿ ಬೆಳೆಯುತ್ತೇನೆ."
    assert data["extracted_parameters"]["total_land_acres"] == 3.0

def test_voice_tts_audio_route(monkeypatch):
    from app.services.nlu_service import kannada_nlu_service

    wav_audio = b"RIFF" + b"\x00" * 40
    monkeypatch.setattr(kannada_nlu_service, "synthesize_kannada_speech", lambda text: wav_audio)
    response = client.post("/api/v1/voice/process", json={
        "session_id": "test_voice_tts_audio",
        "transcript_kannada": "ನಮಸ್ಕಾರ"
    })

    assert response.status_code == 200
    audio_url = response.json()["data"]["tts_audio_url"]
    assert audio_url.startswith("/api/v1/voice/tts?id=")
    audio_response = client.get(audio_url)
    assert audio_response.status_code == 200
    assert audio_response.headers["content-type"] == "audio/wav"
    assert audio_response.content == wav_audio

def test_voice_tts_unavailable_keeps_text(monkeypatch):
    from app.services.nlu_service import kannada_nlu_service

    monkeypatch.setattr(kannada_nlu_service, "synthesize_kannada_speech", lambda text: None)
    response = client.post("/api/v1/voice/process", json={
        "session_id": "test_voice_tts_text_fallback",
        "transcript_kannada": "ನಮಸ್ಕಾರ"
    })

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["tts_audio_url"] is None
    assert data["assistant_reply_kannada"]

def test_gemini_transcription_reads_rest_model_output(monkeypatch):
    from app.services.nlu_service import KannadaNluService

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "steps": [{
                    "type": "model_output",
                    "content": [{"type": "text", "text": "ನಮಸ್ಕಾರ, ಎರಡು ಎಕರೆ ಜಮೀನು ಇದೆ."}],
                }]
            }

    monkeypatch.setattr("app.services.nlu_service.settings.GEMINI_API_KEY", "configured-test-key")
    monkeypatch.setattr("app.services.nlu_service.httpx.post", lambda *args, **kwargs: FakeResponse())
    transcript = KannadaNluService().transcribe_audio("UklGRg==", "wav")

    assert transcript == "ನಮಸ್ಕಾರ, ಎರಡು ಎಕರೆ ಜಮೀನು ಇದೆ."

@pytest.mark.skipif(
    os.getenv("KRISHI_RUN_LIVE_AI_TESTS") != "1" or not settings.GEMINI_API_KEY,
    reason="Set KRISHI_RUN_LIVE_AI_TESTS=1 and configure GEMINI_API_KEY to run live provider tests",
)
def test_live_kannada_audio_roundtrip():
    source = client.post("/api/v1/voice/process", json={
        "session_id": "live_stt_tts_source",
        "transcript_kannada": "ನಮಸ್ಕಾರ",
    })
    assert source.status_code == 200
    source_data = source.json()["data"]
    assert source_data["tts_audio_url"]

    audio = client.get(source_data["tts_audio_url"])
    assert audio.status_code == 200
    assert audio.headers["content-type"] == "audio/wav"

    turn = client.post("/api/v1/voice/process", json={
        "session_id": "live_stt_tts_roundtrip",
        "audio_base64": base64.b64encode(audio.content).decode("ascii"),
        "audio_format": "wav",
    })
    assert turn.status_code == 200
    data = turn.json()["data"]
    assert data["transcript_kannada"]
    assert data["assistant_reply_kannada"]
    assert data["tts_audio_url"]

    final_audio = client.get(data["tts_audio_url"])
    assert final_audio.status_code == 200
    assert final_audio.headers["content-type"] == "audio/wav"

def test_8_cors_and_docs():
    print("\n--- 8. Testing CORS & Swagger Documentation ---")
    # Check OpenAPI schema
    res_openapi = client.get("/openapi.json")
    assert res_openapi.status_code == 200
    openapi = res_openapi.json()
    assert "paths" in openapi
    assert "/api/health" in openapi["paths"]
    assert "/api/farmers/register" in openapi["paths"]
    assert "/api/schemes/recommend" in openapi["paths"]
    assert "/api/chat/message" in openapi["paths"]
    print("✓ OpenAPI schema verified. Endpoints registered:", len(openapi["paths"]))

    # Check CORS headers
    res_cors = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert res_cors.status_code == 200
    assert res_cors.headers.get("access-control-allow-origin") == "http://localhost:5173"
    print("✓ CORS preflight verification passed for http://localhost:5173")

if __name__ == "__main__":
    print("=" * 60)
    print("  KRISHI MITRA (ಕೃಷಿ ಮಿತ್ರ) - ENDPOINT TEST SUITE")
    print("=" * 60)
    test_1_health_endpoint()
    test_2_farmer_registration()
    test_3_get_farmer_profile()
    test_4_get_schemes_catalog()
    test_5_recommend_schemes()
    test_6_check_eligibility()
    test_7_chat_dialogue()
    test_8_cors_and_docs()
    print("\n" + "=" * 60)
    print("  ALL ENDPOINTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)
