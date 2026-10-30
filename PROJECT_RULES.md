# Krishi Mitra - Project Architecture & Development Rules

## 1. Project Overview & Mission
**Krishi Mitra (ಕೃಷಿ ಮಿತ್ರ)** is an AI-powered, voice-first agricultural government scheme assistant tailored for farmers in Karnataka. 
Its primary purpose is to bridge the digital and literacy divide by enabling farmers to converse naturally in Kannada (ಕನ್ನಡ), accurately capture their agricultural profile (landholding, soil, irrigation, caste category, crops, annual income), and match them with genuine State and Central government welfare schemes through a deterministic, transparent rule engine.

---

## 2. Core Architectural Principles

### Rule 1: Strict Decoupling of Eligibility Logic from LLM Responses
* **NEVER** allow an LLM (Large Language Model) to hallucinate or decide scheme eligibility.
* All eligibility evaluations MUST be executed by a **deterministic, rule-based engine** (Python backend) comparing farmer attributes against statutory scheme parameters.
* The LLM's role is strictly confined to:
  1. Conversational intent extraction and agricultural parameter slot-filling from Kannada input.
  2. Natural language explanation of rule engine results into easy-to-understand spoken Kannada.
  3. Handling clarifications and follow-up guidance.

### Rule 2: Zero Tolerance for Fake Schemes (Statutory Data Integrity)
* Only verified Karnataka State Government schemes (e.g., Raitha Siri, Krishi Bhagya, Ganga Kalyana, Raita Vidya Nidhi) and Government of India schemes (e.g., PM-KISAN, PMFBY, KCC, Soil Health Card) are permitted in the catalog.
* Every scheme in the database must reference official department guidelines, actual subsidy amounts, valid document checklists, and genuine nodal portals (e.g., FRUITS, Seva Sindhu, Samrakshane).

### Rule 3: Single-Machine Development Environment (Windows Localhost)
* Development and execution are designed to run seamlessly on a single Windows laptop.
* **Port Allocations:**
  * Frontend: `http://localhost:5173` (Vite / React)
  * Backend: `http://localhost:8000` (FastAPI / Uvicorn)
  * Database: `localhost:3306` (MySQL Server 8.0)
* Both frontend and backend reside within a single unified Git repository root.

### Rule 4: Security & Secrets Isolation
* **Zero Secrets in Frontend:** The frontend client must never store database credentials, cloud keys, or secret tokens.
* Environment variables are managed strictly via `.env` files:
  * Backend: `backend/.env` (DB connection strings, API secrets)
  * Frontend: `frontend/.env` (VITE_API_BASE_URL)
* `.env` files are tracked in `.gitignore` and provided as `.env.example` templates.

### Rule 5: Standardized REST API & JSON Contracts
* Communication between React and FastAPI is strictly over standard HTTP REST endpoints with UTF-8 JSON payloads.
* All endpoints must return consistent response envelopes:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "message": "Operation completed successfully"
  }
  ```
* Detailed contracts are defined and maintained in `API_CONTRACT.md`.

### Rule 6: Kannada-First Inclusive UX
* Every UI element, voice prompt, and notification must support Kannada as the primary language, with bilingual fallback to English.
* Farmers should be able to complete their discovery cycle entirely through voice prompts without requiring complex text typing.
* Audio streams / base64 payloads or recognized transcripts must be handled resiliently with graceful offline/fallback modes.

---

## 3. Directory Topology

```
Krishi-Mitra/
├── .gitignore               # Unified Git exclusion rules
├── README.md                # Project setup & quickstart guide
├── PROJECT_RULES.md         # Architecture standards and dev guidelines
├── API_CONTRACT.md          # Complete REST API specifications
├── DATABASE_DESIGN.md       # MySQL schema and ER model documentation
├── frontend/                # React + Vite + Tailwind CSS (Port 5173)
│   ├── src/
│   │   ├── assets/          # Icons, audio indicators, logos
│   │   ├── components/      # VoiceRecorder, SchemeCard, EligibilityBadge, etc.
│   │   ├── hooks/           # useVoiceInput, useFarmerProfile, useSchemes
│   │   ├── services/        # api.js client wrapper
│   │   ├── pages/           # AssistantHome, ProfileView, SchemeExplorer
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── backend/                 # FastAPI + Python 3.13 (Port 8000)
│   ├── app/
│   │   ├── api/             # API route controllers (v1/voice, v1/schemes, etc.)
│   │   ├── core/            # Config, database session, security
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response validation schemas
│   │   ├── services/        # Voice STT/TTS service, NLU extraction service
│   │   ├── rules_engine/    # Deterministic rule evaluator & criteria checker
│   │   └── utils/           # Kannada helpers, formatters
│   ├── tests/               # Unit and integration tests
│   ├── main.py              # Application entrypoint
│   └── requirements.txt     # Python dependencies
├── database/                # Relational persistence & SQL assets
│   ├── schema.sql           # DDL for MySQL 8.0 schema creation
│   ├── seed_schemes.sql     # Seed data for authentic Karnataka schemes
│   └── README.md
├── data/                    # Scheme catalogs and linguistic assets
│   ├── karnataka_schemes.json # Comprehensive scheme metadata & rules
│   ├── kannada_vocab.json   # Agricultural terminology dictionary
│   └── sample_profiles.json # Realistic test profiles for demo
└── docs/                    # Architectural diagrams, pitch guides, workflows
```

---

## 4. Engineering Standards for 24-Hour Hackathon Success

1. **Fail-Safe Voice Pipeline:**
   Provide a dual-mode voice interface:
   * Real-time Speech-to-Text (STT) via Web Speech API or backend transcription.
   * One-click pre-recorded Kannada voice scenario buttons (e.g., "ನಾನು 2 ಎಕರೆ ಜಮೀನು ಹೊಂದಿರುವ ಸಣ್ಣ ರೈತ..." - "I am a small farmer with 2 acres...") ensuring uninterrupted live demonstrations if network latency spikes.
2. **Defensive Database Queries:**
   All database operations use connection pooling and parameterized queries via SQLAlchemy to prevent SQL injection and connection timeouts.
3. **Traceability:**
   Whenever a scheme evaluation occurs, log the specific criteria satisfied (e.g., `holding_size <= 5.0 acres`, `category == 'SC/ST'`, `crop == 'Ragi'`) so the farmer is told exactly *why* they qualify.
