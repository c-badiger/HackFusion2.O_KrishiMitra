# 🌾 Krishi Mitra (ಕೃಷಿ ಮಿತ್ರ)
### Voice-First AI Agricultural Government Scheme Assistant for Karnataka Farmers

> Built for the 24-Hour National-Level Hackathon.

---

## 📖 Project Overview

**Krishi Mitra** is a voice-first agricultural assistant engineered specifically for farmers in Karnataka. It bridges the digital and literacy divide by enabling farmers to converse naturally in **Kannada (ಕನ್ನಡ)**, capture their agricultural profile (landholding, soil, irrigation source, caste category, cultivated crops), and instantly discover government welfare schemes for which they are eligible.

### 🌟 Core Features
1. **Kannada Voice Interaction:** Natural voice conversation and speech recognition tailored to Karnataka agricultural vernacular.
2. **Farmer Registration & Profile Management:** Manages demographic, geographic (District/Taluk/Village), and agricultural holding records.
3. **Agricultural Information Collection:** Slot filling for landholding size (acres/gunts), soil type, irrigation setup, and seasonal crops.
4. **Government Scheme Recommendations:** Instant matching with verified Karnataka State and Central agricultural schemes.
5. **Transparent Rule-Based Eligibility Engine:** Strict separation between language processing and eligibility decisions. No LLM hallucination—100% deterministic, audit-traceable qualification logic.
6. **Benefits & Criteria Explanation:** Transparent explanation of exact qualification criteria and subsidy amounts in Kannada.
7. **Document Checklists & Application Instructions:** Official statutory document requirements (RTC/Pahani, FRUITS ID, Caste/Income certificates) and direct links to official portals (FRUITS, Seva Sindhu, Samrakshane).
8. **Conversational Context & Follow-Up:** Multi-turn dialogue management asking clarification questions for incomplete profile slots.

---

## 🏛️ System Architecture & Port Allocation

| Component | Technology | Default Port | Role |
|---|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | `http://localhost:5173` | Kannada voice UI, pulse recording animations, scheme cards |
| **Backend** | Python 3.13, FastAPI, SQLAlchemy, Pydantic | `http://localhost:8000` | REST API, Kannada dialogue manager, deterministic rule engine |
| **Database** | MySQL Server 8.0 | `localhost:3306` | Persistent storage with `utf8mb4` character set |

---

## 📁 Repository Structure

```
Krishi-Mitra/
├── .gitignore               # Comprehensive Git ignore rules (Node, Python, .env)
├── README.md                # Project quickstart and setup instructions
├── PROJECT_RULES.md         # 12 core development rules and architectural constraints
├── API_CONTRACT.md          # Complete REST API specifications & schemas
├── DATABASE_DESIGN.md       # MySQL ER diagram, table schemas, and data dictionary
│
├── frontend/                # React + Vite + Tailwind CSS (Port 5173)
│   ├── public/              # Favicon and static assets
│   ├── src/
│   │   ├── services/api.js  # REST API client connected to backend :8000
│   │   ├── App.jsx          # Voice assistant interface and scheme explorer
│   │   ├── main.jsx         # React application entrypoint
│   │   └── index.css        # Tailwind directives and custom animations
│   ├── .env.example         # Template for frontend environment variables
│   ├── index.html           # HTML template with Noto Sans Kannada font
│   ├── package.json         # Node dependencies
│   ├── postcss.config.js    # PostCSS configuration
│   ├── tailwind.config.js   # Tailwind theme with agricultural color tokens
│   └── vite.config.js       # Vite configuration locked to port 5173
│
├── backend/                 # FastAPI Application (Port 8000)
│   ├── app/
│   │   ├── api/             # REST endpoints (health, voice, schemes, farmers, eligibility)
│   │   ├── core/            # Configuration (config.py) and DB session (database.py)
│   │   ├── models/          # SQLAlchemy ORM models (models.py)
│   │   ├── schemas/         # Pydantic request/response schemas (schemas.py)
│   │   ├── rules_engine/    # Deterministic rule evaluator (engine.py)
│   │   ├── services/        # Kannada dialogue & entity extraction (voice_service.py)
│   │   └── __init__.py
│   ├── .env.example         # Template for backend secrets and DB credentials
│   ├── main.py              # FastAPI entrypoint with CORS on port 5173
│   └── requirements.txt     # Python backend dependencies
│
├── database/                # Relational Schema & Seed Assets
│   ├── schema.sql           # MySQL 8.0 DDL with utf8mb4 encoding
│   ├── seed_schemes.sql     # Seed data for authentic Karnataka schemes
│   └── README.md            # MySQL import instructions
│
├── data/                    # Domain Assets & Dictionaries
│   ├── karnataka_schemes.json # Verified schemes catalog with parameter rules
│   ├── kannada_vocab.json   # Spoken Kannada agricultural vocabulary mapping
│   └── sample_profiles.json # Realistic test profiles for instant demonstration
│
└── docs/                    # Architecture & Workflows
    ├── architecture.md      # System diagram & dataflow
    └── kannada_voice_pipeline.md # Voice ingestion and slot extraction flow
```

---

## 🚀 Installation & Running Guide

### 1. Prerequisites Check
Ensure the following tools are installed on your Windows laptop:
* **Node.js** (v18+) - `node -v`
* **Python** (v3.10+) - `python --version`
* **MySQL Server 8.0** - Running on port `3306`
* **Git** - `git --version`

---

### 2. Backend Setup (FastAPI on Port 8000)

1. Open PowerShell and navigate to the backend folder:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Verify your environment variables:
   * Copy `.env.example` to `.env` (already created with sensible defaults):
   ```powershell
   cp .env.example .env
   ```
   * Ensure `PORT=8000` and update `DB_PASSWORD` to your local MySQL password.

5. Start the FastAPI backend server:
   ```powershell
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   * Access API Documentation: `http://localhost:8000/docs`
   * Health Check: `http://localhost:8000/api/v1/health`

---

### 3. Frontend Setup (React + Vite on Port 5173)

1. Open a new PowerShell terminal and navigate to the frontend folder:
   ```powershell
   cd frontend
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```

3. Verify frontend environment variables:
   * Ensure `.env` exists with:
   ```env
   VITE_API_BASE_URL="http://localhost:8000/api/v1"
   ```

4. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   * Open `http://localhost:5173` in your browser.

---

### 4. Database Setup (MySQL 8.0 on Port 3306)

1. Open MySQL CLI or PowerShell:
   ```powershell
   mysql -u root -p < database/schema.sql
   ```

2. Seed verified Karnataka agricultural schemes:
   ```powershell
   mysql -u root -p krishi_mitra_db < database/seed_schemes.sql
   ```

*(Note: If MySQL is not yet configured, the backend automatically operates using the statutory catalog in `data/karnataka_schemes.json` so you can continue building and testing without blocking).*

---

## 🔒 Crucial Development Rules
1. **Never expose secrets:** Database passwords and keys belong only in `backend/.env`.
2. **Transparent Rule Engine:** Keep eligibility logic deterministic (`backend/app/rules_engine/engine.py`). Do not allow the LLM to hallucinate approvals.
3. **Verified Schemes Only:** Never generate synthetic or fake schemes. All schemes must represent real Karnataka Department of Agriculture or Central GoI initiatives.
