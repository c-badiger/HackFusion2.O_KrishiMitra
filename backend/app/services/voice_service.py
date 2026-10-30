import re
import json
import uuid
from typing import Dict, Any, List
from pathlib import Path
from app.rules_engine.engine import RuleEvaluator

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

class VoiceAssistantService:
    """
    Handles Kannada voice dialogue processing, agricultural entity extraction,
    and conversational state management.
    """

    def __init__(self):
        self.vocab = self._load_vocab()
        # In-memory session context cache for fast multi-turn conversational responses
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def _load_vocab(self) -> Dict[str, Any]:
        path = DATA_DIR / "kannada_vocab.json"
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def process_utterance(self, session_id: str, transcript: str, farmer_id: int = None) -> Dict[str, Any]:
        if not session_id or session_id not in self.sessions:
            session_id = session_id or f"sess_{uuid.uuid4().hex[:10]}"
            self.sessions[session_id] = {
                "farmer_id": farmer_id,
                "slots": {
                    "district": None,
                    "district_kn": None,
                    "total_land_acres": None,
                    "caste_category": None,
                    "annual_income": None,
                    "irrigation_type": None,
                    "has_borewell": None,
                    "crops": []
                },
                "history": []
            }

        ctx = self.sessions[session_id]
        transcript_clean = transcript.strip() if transcript else ""

        # 1. Slot extraction from Kannada transcript
        extracted = self._extract_entities(transcript_clean)
        
        # Merge extracted slots into session context
        for k, v in extracted.items():
            if v is not None:
                if k == "crops":
                    existing = [c["crop_name"] for c in ctx["slots"]["crops"]]
                    for item in v:
                        if item["crop_name"] not in existing:
                            ctx["slots"]["crops"].append(item)
                else:
                    ctx["slots"][k] = v

        # 2. Check missing information
        missing = []
        if ctx["slots"]["total_land_acres"] is None:
            missing.append("total_land_acres")
        if not ctx["slots"]["crops"]:
            missing.append("crops")
        if ctx["slots"]["irrigation_type"] is None:
            missing.append("irrigation_type")
        if ctx["slots"]["caste_category"] is None:
            missing.append("caste_category")

        # 3. Evaluate matching schemes based on currently known profile
        eval_result = RuleEvaluator.evaluate_farmer(ctx["slots"])
        eligible_schemes = eval_result["eligible_schemes"]
        eligible_count = len(eligible_schemes)

        # 4. Generate Kannada conversational response
        reply_kn, reply_en, quick_replies = self._synthesize_dialogue(ctx["slots"], missing, eligible_schemes)

        # Record history
        ctx["history"].append({"user": transcript_clean, "assistant": reply_kn})

        return {
            "session_id": session_id,
            "detected_intent": "PROVIDE_AGRICULTURAL_DETAILS" if extracted else "GENERAL_QUERY",
            "extracted_parameters": ctx["slots"],
            "missing_parameters": missing,
            "assistant_reply_kannada": reply_kn,
            "assistant_reply_english": reply_en,
            "tts_audio_url": None,
            "quick_replies_kannada": quick_replies,
            "eligible_schemes_count": eligible_count,
            "matched_schemes": eligible_schemes
        }

    def _extract_entities(self, text: str) -> Dict[str, Any]:
        slots = {}

        # Landholding extraction (e.g. 2 ಎಕರೆ, 3.5 ಎಕರೆ, 30 ಗುಂಟೆ)
        acre_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:ಎಕರೆ|acre|acres)', text, re.IGNORECASE)
        gunte_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:ಗುಂಟೆ|gunte)', text, re.IGNORECASE)
        if acre_match:
            slots["total_land_acres"] = float(acre_match.group(1))
        elif gunte_match:
            slots["total_land_acres"] = round(float(gunte_match.group(1)) * 0.025, 2)

        # Crop extraction
        found_crops = []
        crops_dict = self.vocab.get("crops", {})
        for kn_name, meta in crops_dict.items():
            if kn_name in text or meta["name_en"].lower() in text.lower():
                found_crops.append({
                    "crop_name": meta["name_en"],
                    "crop_name_kn": kn_name,
                    "crop_category": meta["category"],
                    "acres": slots.get("total_land_acres", 1.0)
                })
        if found_crops:
            slots["crops"] = found_crops

        # Irrigation extraction
        irr_dict = self.vocab.get("irrigation", {})
        for kn_term, en_val in irr_dict.items():
            if kn_term in text:
                slots["irrigation_type"] = en_val
                if "ಬೋರ್‌ವೆಲ್" in kn_term or "ಕೊಳವೆ" in kn_term:
                    slots["has_borewell"] = True
                break

        # District extraction
        districts = self.vocab.get("districts_karnataka", [])
        for d in districts:
            if d["kn"] in text or d["en"].lower() in text.lower():
                slots["district"] = d["en"]
                slots["district_kn"] = d["kn"]
                break

        # Caste category extraction
        caste_dict = self.vocab.get("caste_categories", {})
        for kn_caste, code in caste_dict.items():
            if kn_caste in text or code.lower() in text.lower():
                slots["caste_category"] = code
                break

        return slots

    def _synthesize_dialogue(self, slots: Dict[str, Any], missing: List[str], eligible: List[Dict[str, Any]]) -> tuple:
        land = slots.get("total_land_acres")
        crops = slots.get("crops", [])
        irrigation = slots.get("irrigation_type")

        quick_replies = []

        if missing:
            next_needed = missing[0]
            if next_needed == "total_land_acres":
                kn = "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಬಳಿ ಎಷ್ಟು ಎಕರೆ ಅಥವಾ ಗುಂಟೆ ಜಮೀನು ಇದೆ ಎಂದು ತಿಳಿಸಿ."
                en = "Namaskara! Please tell me how many acres or gunts of land you hold."
                quick_replies = ["ನನ್ನ ಬಳಿ 2 ಎಕರೆ ಜಮೀನು ಇದೆ", "3 ಎಕರೆ ಜಮೀನು ಇದೆ", "1 ಎಕರೆ 20 ಗುಂಟೆ ಇದೆ"]
            elif next_needed == "crops":
                kn = f"ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ {land} ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ ಯಾವ ಬೆಳೆ ಬೆಳೆಯುತ್ತಿದ್ದೀರಿ? (ಉದಾಹರಣೆಗೆ: ರಾಗಿ, ಭತ್ತ, ಕಬ್ಬು)"
                en = f"Thank you. What crops are you cultivating on your {land} acres? (e.g. Ragi, Paddy, Sugarcane)"
                quick_replies = ["ರಾಗಿ ಬೆಳೆಯುತ್ತೇನೆ", "ಭತ್ತ ಮತ್ತು ಕಬ್ಬು", "ಸಿರಿಧಾನ್ಯ ಮತ್ತು ಜೋಳ"]
            elif next_needed == "irrigation_type":
                crop_names_kn = ", ".join([c["crop_name_kn"] for c in crops])
                kn = f"ಉತ್ತಮ, ನೀವು {crop_names_kn} ಬೆಳೆಯುತ್ತಿದ್ದೀರಿ. ನಿಮ್ಮ ಜಮೀನಿಗೆ ನೀರಾವರಿ ಸೌಲಭ್ಯ ಹೇಗಿದೆ? ಮಳೆಯಾಶ್ರಿತವೇ ಅಥವಾ ಬೋರ್‌ವೆಲ್/ಕಾಲುವೆ ಇದೆಯೇ?"
                en = f"Good, you are growing {crop_names_kn}. What is your irrigation setup? Rainfed, borewell, or canal?"
                quick_replies = ["ಮಳೆಯಾಶ್ರಿತ ಒಣಭೂಮಿ", "ಬೋರ್‌ವೆಲ್ ಇದೆ", "ಕಾಲುವೆ ನೀರಾವರಿ"]
            elif next_needed == "caste_category":
                kn = "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿಶೇಷ ಸಬ್ಸಿಡಿಗೆ ನಿಮ್ಮ ಜಾತಿ ವರ್ಗ ತಿಳಿಸಿ (ಪರಿಶಿಷ್ಟ ಜಾತಿ, ಪರಿಶಿಷ್ಟ ಪಂಗಡ, ಹಿಂದುಳಿದ ವರ್ಗ ಅಥವಾ ಸಾಮಾನ್ಯ)."
                en = "For special government subsidies, please specify your category (SC, ST, OBC, or General)."
                quick_replies = ["ಪರಿಶಿಷ್ಟ ಜಾತಿ / ಪಂಗಡ", "ಹಿಂದುಳಿದ ವರ್ಗ (OBC)", "ಸಾಮಾನ್ಯ ವರ್ಗ"]
            else:
                kn = "ನಿಮ್ಮ ಕೃಷಿ ಮಾಹಿತಿ ದಾಖಲಾಗಿದೆ. ಇನ್ನಷ್ಟು ವಿವರ ಒದಗಿಸಬೇಕೆ?"
                en = "Your details are saved. Would you like to provide more?"
        else:
            names = ", ".join([s["name_kn"] for s in eligible[:3]])
            count = len(eligible)
            kn = f"ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಕೃಷಿ ವಿವರಗಳ ಪ್ರಕಾರ ನೀವು {count} ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ: {names}. ಹೆಚ್ಚಿನ ವಿವರ ಹಾಗೂ ಬೇಕಾದ ದಾಖಲೆಗಳನ್ನು ಕೆಳಗೆ ಪರಿಶೀಲಿಸಿ."
            en = f"Congratulations! Based on your details, you qualify for {count} government schemes: {names}."
            quick_replies = ["ದಾಖಲೆಗಳ ಪಟ್ಟಿ ತೋರಿಸಿ", "ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು?", "ಇತರ ಯೋಜನೆಗಳು"]

        return kn, en, quick_replies

voice_service = VoiceAssistantService()
