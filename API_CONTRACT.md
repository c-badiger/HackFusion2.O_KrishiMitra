# Krishi Mitra - REST API Contract

## 1. Overview
This document specifies the standard REST API contract between the **React Frontend (`http://localhost:5173`)** and the **FastAPI Backend (`http://localhost:8000`)**.

* **Base URL:** `http://localhost:8000/api/v1`
* **Content-Type:** `application/json` (or `multipart/form-data` for raw voice audio)
* **Character Encoding:** `UTF-8` (Strictly required for Kannada Unicode characters)

---

## 2. Standard Response Format

All responses follow a uniform JSON envelope:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Human readable confirmation message",
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "message": "Brief description of error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "details": "Farmer with ID 102 was not found in the database"
  }
}
```

---

## 3. Endpoints Specification

### 3.1 System Health
#### `GET /health`
* **Purpose:** Quick probe to verify backend and MySQL connectivity.
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "krishi-mitra-backend",
    "database": "connected",
    "version": "1.0.0"
  },
  "message": "Backend service is operational",
  "error": null
}
```

---

### 3.2 Voice & Conversational Assistant

#### `POST /voice/process`
* **Purpose:** Primary conversational interaction endpoint. Accepts a Kannada transcript from browser speech recognition or optional base64 audio, updates session state, and queries the deterministic rule engine.
* **Headers:** `Content-Type: application/json`
* **Audio transcription:** Optional Gemini 3.5 Transcribe backend integration supports Kannada (`kn-IN`) and WebM. Configure `GEMINI_API_KEY` in `backend/.env`; without it, send a transcript from browser recognition or use text input.
* **Speech output:** With the same key configured, Gemini 3.8 Flash-Lite TTS generates Kannada WAV audio; `tts_audio_url` contains the URL. Without a key or if synthesis fails, it is `null` and the Kannada text remains available.
* **Request Body:**
```json
{
  "session_id": "sess_89412_abc",
  "farmer_id": 1,
  "transcript_kannada": "ನನ್ನ ಬಳಿ ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 3 ಎಕರೆ ಜಮೀನು ಇದೆ, ನಾನು ರಾಗಿ ಮತ್ತು ಕಬ್ಬು ಬೆಳೆಯುತ್ತೇನೆ.",
  "audio_base64": null,
  "audio_format": "webm"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session_id": "sess_89412_abc",
    "detected_intent": "PROVIDE_FARM_DETAILS",
    "transcript_kannada": "ನನ್ನ ಬಳಿ ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 3 ಎಕರೆ ಜಮೀನು ಇದೆ, ನಾನು ರಾಗಿ ಮತ್ತು ಕಬ್ಬು ಬೆಳೆಯುತ್ತೇನೆ.",
    "extracted_parameters": {
      "district": "Mandya",
      "district_kn": "ಮಂಡ್ಯ",
      "total_land_acres": 3.0,
      "crops": [
        { "crop_name": "Ragi", "crop_name_kn": "ರಾಗಿ", "crop_category": "Siridhanya_Millet", "acres": 3.0 },
        { "crop_name": "Sugarcane", "crop_name_kn": "ಕಬ್ಬು", "crop_category": "Cash_Crop", "acres": 3.0 }
      ]
    },
    "missing_parameters": ["irrigation_type", "caste_category"],
    "assistant_reply_kannada": "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಜಮೀನಿಗೆ ನೀರಾವರಿ ಸೌಲಭ್ಯ ಹೇಗಿದೆ? ಮಳೆಯಾಶ್ರಿತವೇ ಅಥವಾ ಬೋರ್‌ವೆಲ್/ಕಾಲುವೆ ಇದೆಯೇ?",
    "assistant_reply_english": "Thank you. What is your irrigation setup? Rainfed, borewell, or canal?",
    "tts_audio_url": null,
    "quick_replies_kannada": ["ಮಳೆಯಾಶ್ರಿತ ಒಣಭೂಮಿ", "ಬೋರ್‌ವೆಲ್ ಇದೆ", "ಕಾಲುವೆ ನೀರಾವರಿ"],
    "eligible_schemes_count": 0,
    "matched_schemes": []
  },
  "message": "Voice interaction processed successfully",
  "error": null
}
```

#### `GET /voice/tts`
* **Purpose:** Stream a generated Kannada WAV reply for browser playback.
* **Query Parameters:** `id=audio_reply_<opaque-id>` (returned through `tts_audio_url`).
* **Response:** Binary WAV audio (`audio/wav`). Audio is held in a bounded in-memory cache and expires on backend restart or eviction.

* **Text fallback:** If TTS synthesis/playback fails, the Kannada text remains visible. If browser speech recognition reports a network error, React falls back to microphone recording and optional backend transcription; farmers can always type Kannada text.

---

### 3.3 Farmer Profile Management

#### `POST /farmers`
* **Purpose:** Register a new farmer.
* **Request Body:**
```json
{
  "full_name": "ಬಸವರಾಜ್ ಗೌಡ (Basavaraj Gowda)",
  "phone_number": "9876543210",
  "aadhaar_last_four": "4812",
  "fruits_id": "KA-2024-FR-98214",
  "district": "Mandya",
  "taluk": "Maddur",
  "village": "Besagarahalli",
  "caste_category": "OBC",
  "annual_income": 85000,
  "total_land_acres": 3.2,
  "soil_type": "Red Loamy",
  "irrigation_type": "Canal",
  "has_borewell": false
}
```
* **Response (201 Created):** Returns created farmer object with auto-generated `id`.

#### `GET /farmers/{farmer_id}`
* **Purpose:** Retrieve farmer profile, including associated landholdings and crop history.
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "farmer_id": 1,
    "full_name": "ಬಸವರಾಜ್ ಗೌಡ (Basavaraj Gowda)",
    "phone_number": "9876543210",
    "fruits_id": "KA-2024-FR-98214",
    "district": "Mandya",
    "taluk": "Maddur",
    "village": "Besagarahalli",
    "caste_category": "OBC",
    "annual_income": 85000,
    "total_land_acres": 3.2,
    "farmer_category": "Small Farmer",
    "irrigation_type": "Canal",
    "crops": [
      { "id": 101, "crop_name": "Ragi", "crop_name_kn": "ರಾಗಿ", "acres": 2.0, "season": "Kharif" },
      { "id": 102, "crop_name": "Sugarcane", "crop_name_kn": "ಕಬ್ಬು", "acres": 1.2, "season": "Annual" }
    ],
    "created_at": "2026-10-30T10:00:00Z"
  },
  "message": "Farmer profile fetched",
  "error": null
}
```

---

### 3.4 Government Scheme Catalog

#### `GET /schemes`
* **Purpose:** Fetch list of active Karnataka & Central agricultural schemes with optional filters.
* **Query Parameters:**
  * `category` (e.g. `Subsidy`, `Irrigation`, `Credit`, `Insurance`)
  * `department` (e.g. `Agriculture`, `Horticulture`, `Social Welfare`)
  * `language` (`kn` or `en`, default: `kn`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "KA-AGRI-001",
      "name_en": "Raitha Siri Scheme",
      "name_kn": "ರೈತ ಸಿರಿ ಯೋಜನೆ",
      "department": "Department of Agriculture, Karnataka",
      "category": "Direct Benefit Transfer",
      "subsidy_details": "₹10,000 per hectare for millet growers",
      "summary_kn": "ಸಿರಿಧಾನ್ಯ (ರಾಗಿ, ಜೋಳ, ಸಜ್ಜೆ, ನವಣೆ) ಬೆಳೆಯುವ ರೈತರಿಗೆ ಪ್ರತಿ ಹೆಕ್ಟೇರ್‌ಗೆ ₹10,000 ಪ್ರೋತ್ಸಾಹಧನ.",
      "application_portal": "https://fruits.karnataka.gov.in"
    }
  ],
  "message": "Schemes retrieved successfully",
  "error": null
}
```

#### `GET /schemes/{scheme_id}`
* **Purpose:** Detailed view of a single scheme with exact statutory criteria, required documents, and step-by-step application process.

---

### 3.5 Rule-Based Eligibility Evaluation Engine

#### `POST /eligibility/evaluate`
* **Purpose:** Evaluates a farmer profile against the deterministic rule matrix.
* **Request Body:**
```json
{
  "farmer_id": 1
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "farmer_id": 1,
    "evaluated_at": "2026-10-30T12:00:00Z",
    "eligible_schemes": [
      {
        "scheme_id": 1,
        "name_en": "Raitha Siri Scheme",
        "name_kn": "ರೈತ ಸಿರಿ ಯೋಜನೆ",
        "match_percentage": 100,
        "subsidy_amount_estimate": "₹10,000/hectare",
        "qualification_reasons_kn": [
          "ನೀವು ರಾಗಿ ಬೆಳೆಯುತ್ತಿದ್ದೀರಿ (ಸಿರಿಧಾನ್ಯ ಅರ್ಹತೆ)",
          "ನಿಮ್ಮ ಜಮೀನು 5 ಎಕರೆಗಿಂತ ಕಡಿಮೆಯಿದೆ (ಸಣ್ಣ ರೈತರು)"
        ],
        "required_documents": [
          "ಪಹಣಿ / RTC (Pahani)",
          "ಆಧಾರ್ ಕಾರ್ಡ್ (Aadhaar Card)",
          "ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ (Bank Passbook)",
          "FRUITS ನೋಂದಣಿ ಸಂಖ್ಯೆ (FRUITS ID)"
        ],
        "how_to_apply_kn": "ನಿಮ್ಮ ಗ್ರಾಮದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) ಅಥವಾ FRUITS ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
      },
      {
        "scheme_id": 2,
        "name_en": "Krishi Bhagya Scheme",
        "name_kn": "ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆ",
        "match_percentage": 90,
        "subsidy_amount_estimate": "80% ಸಬ್ಸಿಡಿ ಕೃಷಿ ಹೊಂಡ ನಿರ್ಮಾಣಕ್ಕೆ",
        "qualification_reasons_kn": [
          "ಮಳೆ ಆಶ್ರಿತ ಅಥವಾ ಒಣಭೂಮಿ ಕೃಷಿ ಪ್ರದೇಶ",
          "ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರ ವ್ಯಾಪ್ತಿಗೆ ಬರುತ್ತೀರಿ"
        ],
        "required_documents": ["RTC", "Aadhaar", "Land Map (ನಕ್ಷೆ)"],
        "how_to_apply_kn": "ಸಮೀಪದ ಸಹಾಯಕ ಕೃಷಿ ನಿರ್ದೇಶಕರ ಕಚೇರಿಯಲ್ಲಿ ಸಂಪರ್ಕಿಸಿ."
      }
    ],
    "partially_eligible_schemes": [
      {
        "scheme_id": 3,
        "name_en": "Ganga Kalyana Scheme",
        "name_kn": "ಗಂಗಾ ಕಲ್ಯಾಣ ಯೋಜನೆ",
        "missing_criteria_kn": "ಈ ಯೋಜನೆ ಮುಖ್ಯವಾಗಿ SC/ST ಅಥವಾ ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಸಣ್ಣ ಹಿಡುವಳಿದಾರರಿಗೆ ಉಚಿತ ಬೋರ್‌ವೆಲ್ ಸೌಲಭ್ಯ ಒದಗಿಸುತ್ತದೆ. ನಿಮ್ಮ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಪರಿಶೀಲಿಸಬೇಕಾಗಿದೆ."
      }
    ]
  },
  "message": "Eligibility evaluation completed transparently",
  "error": null
}
```
