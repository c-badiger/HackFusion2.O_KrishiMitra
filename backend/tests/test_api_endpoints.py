import sys
import os
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_1_health_endpoint():
    print("\n--- 1. Testing GET /api/health ---")
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "healthy"
    print("✓ /api/health passed:", body["data"]["database"])

def test_2_farmer_registration():
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
    print("✓ POST /api/farmers/register response:", response.status_code, body["message"])

def test_3_get_farmer_profile():
    print("\n--- 3. Testing GET /api/farmers/1 ---")
    response = client.get("/api/farmers/1")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    body = response.json()
    assert body["success"] is True
    farmer = body["data"]
    assert farmer["full_name"] == "ಬಸವರಾಜ್ ಗೌಡ (Basavaraj Gowda)"
    assert len(farmer["crops"]) >= 1
    print(f"✓ GET /api/farmers/1 passed: {farmer['full_name']}, {farmer['total_land_acres']} acres ({farmer['farmer_category']})")

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
    # Test with farmer_id=1
    payload = {"farmer_id": 1}
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
    payload = {"farmer_id": 1}
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
