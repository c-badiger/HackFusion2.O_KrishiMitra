# Kannada Voice Interaction Pipeline

## 1. Voice Ingestion
* React first uses browser Speech Recognition with the Kannada locale `kn-IN` when available.
* Otherwise, React records microphone audio with `MediaRecorder` and sends base64 audio to `/api/v1/voice/process`.
* Optional backend transcription uses Gemini 3.5 Transcribe, which explicitly lists Kannada (`kn-IN`) and WebM support. Keep `GEMINI_API_KEY` in `backend/.env` only.
* If browser recognition and configured backend transcription are unavailable, Kannada text entry remains usable.

## 2. Agricultural Entity Extraction
With `GEMINI_API_KEY` configured, the backend asks the Gemini text model to extract farmer facts explicitly stated in the current Kannada/English turn. Its output is validated against the local vocabulary and accepted value sets. Without the key or if the provider fails, the local vocabulary/regex extractor is used. Conversation slots and recent turns remain in backend session context.

The backend analyzes the utterance to extract:
* **Landholdings:** Matches numeric quantities associated with "ಎಕರೆ" (acres), "ಗುಂಟೆ" (gunts), or "ಹೆಕ್ಟೇರ್" (hectares).
* **Crops:** Matches Kannada crop names like "ರಾಗಿ" (Ragi), "ಭತ್ತ" (Paddy), "ಕಬ್ಬು" (Sugarcane), "ಹತ್ತಿ" (Cotton), "ಜೋಳ" (Jowar).
* **Irrigation:** Identifies "ಮಳೆಯಾಶ್ರಿತ" (Rainfed), "ಬೋರ್‌ವೆಲ್" (Borewell), "ಕಾಲುವೆ" (Canal).
* **Location:** Resolves Karnataka district names (e.g., Mandya, Dharwad, Belagavi, Mysuru).

## 3. Deterministic Eligibility Check
* Extracted attributes are passed to the **RuleEvaluator**.
* Each scheme's statutory criteria are evaluated deterministically (e.g., `holding_size <= 5.0 acres`, `crop == 'Siridhanya'`).
* **Zero hallucination:** The LLM does not decide qualification.

## 4. Spoken Feedback Synthesis
* The deterministic service forms Kannada follow-up prompts from missing slots and scheme catalog results; it does not ask an LLM to invent benefits or application steps.
* With `GEMINI_API_KEY`, the backend uses Gemini 3.8 Flash-Lite TTS, which explicitly lists Kannada as a supported language, and returns WAV audio through `GET /api/v1/voice/tts`.
* React fetches the returned audio URL and attempts automatic playback, with replay, stop, loading, autoplay-blocked, and playback-error states. The text response is always shown as the fallback.
* The TTS key is optional; without it or when generation fails, `tts_audio_url` is `null` and the UI remains text-only.
