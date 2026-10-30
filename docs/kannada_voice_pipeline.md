# Kannada Voice Interaction Pipeline

## 1. Voice Ingestion
* In the browser, the farmer taps the microphone button.
* Audio is captured either through the browser's Web Speech API (`webkitSpeechRecognition` with language `'kn-IN'`) or streamed as base64 audio to `/api/v1/voice/process`.

## 2. Agricultural Entity Extraction
The backend analyzes the Kannada utterance to extract:
* **Landholdings:** Matches numeric quantities associated with "ಎಕರೆ" (acres), "ಗುಂಟೆ" (gunts), or "ಹೆಕ್ಟೇರ್" (hectares).
* **Crops:** Matches Kannada crop names like "ರಾಗಿ" (Ragi), "ಭತ್ತ" (Paddy), "ಕಬ್ಬು" (Sugarcane), "ಹತ್ತಿ" (Cotton), "ಜೋಳ" (Jowar).
* **Irrigation:** Identifies "ಮಳೆಯಾಶ್ರಿತ" (Rainfed), "ಬೋರ್‌ವೆಲ್" (Borewell), "ಕಾಲುವೆ" (Canal).
* **Location:** Resolves Karnataka district names (e.g., Mandya, Dharwad, Belagavi, Mysuru).

## 3. Deterministic Eligibility Check
* Extracted attributes are passed to the **RuleEvaluator**.
* Each scheme's statutory criteria are evaluated deterministically (e.g., `holding_size <= 5.0 acres`, `crop == 'Siridhanya'`).
* **Zero hallucination:** The LLM does not decide qualification.

## 4. Spoken Feedback Synthesis
* The assistant synthesizes a conversational response in Kannada explaining eligible schemes, amounts, and asking for missing parameters if any.
