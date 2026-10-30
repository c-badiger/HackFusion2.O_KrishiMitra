# Krishi Mitra - System Architecture

```mermaid
graph TD
    A[Farmer / Voice Input in Kannada] --> B[React Frontend :5173]
    B -->|REST API JSON / Audio| C[FastAPI Backend :8000]
    
    subgraph "Backend Core"
        C --> D[Voice Assistant Service]
        D -->|Agricultural Entities| E[Slot Filling / Session Context]
        E --> F[Deterministic Rule Engine]
        F -->|Transparent Criteria Match| G[MySQL 8.0 Database :3306]
        G -->|Verified Scheme Criteria| F
        F -->|Audit Trail & Status| H[Response Synthesizer]
        H -->|Spoken Kannada Feedback| C
    end

    C -->|Unified API Response| B
    B -->|Spoken Audio + Kannada UI| A
```

## System Components
1. **Frontend (Port 5173):** React + Vite + Tailwind CSS with responsive voice controls, real-time audio animation, and Kannada typography.
2. **Backend (Port 8000):** FastAPI server exposing asynchronous REST APIs, managing session dialogues, and hosting the deterministic rule engine.
3. **Database (Port 3306):** MySQL 8.0 with `utf8mb4` encoding storing farmer profiles, landholdings, crop records, scheme rules, and document requirements.
4. **Data Assets (`data/`):** Authentic statutory criteria for Karnataka and Central schemes, Kannada vocabulary mapping dictionary, and demo farmer profiles.
