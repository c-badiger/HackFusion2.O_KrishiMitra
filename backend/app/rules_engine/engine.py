import json
import logging
from typing import Dict, Any, List, Tuple
from pathlib import Path

logger = logging.getLogger("krishi_mitra.rules_engine")

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

class RuleEvaluator:
    """
    Deterministic rule-based eligibility evaluator.
    Completely isolated from LLM generation to ensure zero hallucination
    and complete statutory transparency for government welfare schemes.
    """

    @staticmethod
    def load_fallback_schemes() -> List[Dict[str, Any]]:
        file_path = DATA_DIR / "karnataka_schemes.json"
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    @classmethod
    def evaluate_farmer(cls, farmer_profile: Dict[str, Any], schemes: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not schemes:
            schemes = cls.load_fallback_schemes()

        eligible = []
        partially_eligible = []
        ineligible = []

        # Extract farmer attributes with null-safe fallbacks
        land_raw = farmer_profile.get("total_land_acres")
        land = float(land_raw) if land_raw is not None else 0.0

        caste = farmer_profile.get("caste_category") or "General"

        income_raw = farmer_profile.get("annual_income")
        income = float(income_raw) if income_raw is not None else 0.0

        irrigation = farmer_profile.get("irrigation_type") or "Rainfed"
        has_borewell = bool(farmer_profile.get("has_borewell") or False)
        
        # Crops
        crops = farmer_profile.get("crops", [])
        crop_categories = [c.get("crop_category", "") for c in crops]
        crop_names = [c.get("crop_name", "") for c in crops]
        crop_names_kn = [c.get("crop_name_kn", "") for c in crops]

        for s in schemes:
            rules = s.get("rules", [])
            total_rules = len(rules)
            passed_rules = []
            failed_rules = []

            for r in rules:
                field = r["field"] if "field" in r else r.get("parameter_name")
                op = r.get("operator")
                target = r["value"] if "value" in r else r.get("target_value")
                reason_kn = r["reason_kn"] if "reason_kn" in r else r.get("explanation_kn", "")
                
                is_satisfied = cls._check_condition(
                    field=field,
                    operator=op,
                    target_val=target,
                    farmer_ctx={
                        "total_land_acres": land,
                        "caste_category": caste,
                        "annual_income": income,
                        "irrigation_type": irrigation,
                        "has_borewell": has_borewell,
                        "crop_category": crop_categories,
                        "crops": crop_names
                    }
                )

                if is_satisfied:
                    passed_rules.append(reason_kn)
                else:
                    failed_rules.append(reason_kn)

            score = int((len(passed_rules) / total_rules) * 100) if total_rules > 0 else 100

            scheme_item = {
                "scheme_id": s.get("id"),
                "scheme_code": s.get("scheme_code"),
                "name_en": s.get("name_en"),
                "name_kn": s.get("name_kn"),
                "department_kn": s.get("department_kn") or s.get("department"),
                "match_score": score,
                "benefit_amount_kn": s.get("benefit_amount_desc_kn") or s.get("benefit_amount", ""),
                "qualification_reasons_kn": passed_rules,
                "required_documents_kn": s.get("documents_kn", []),
                "how_to_apply_kn": "ನಿಮ್ಮ ಗ್ರಾಮದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) ಅಥವಾ ಆನ್‌ಲೈನ್ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
                "application_portal": s.get("portal") or s.get("application_portal")
            }

            if score == 100:
                eligible.append(scheme_item)
            elif score >= 50:
                scheme_item["missing_criteria_kn"] = failed_rules
                partially_eligible.append(scheme_item)
            else:
                scheme_item["unmet_reasons_kn"] = failed_rules
                ineligible.append(scheme_item)

        return {
            "eligible_schemes": eligible,
            "partially_eligible_schemes": partially_eligible,
            "ineligible_schemes": ineligible
        }

    @staticmethod
    def _check_condition(field: str, operator: str, target_val: Any, farmer_ctx: Dict[str, Any]) -> bool:
        val = farmer_ctx.get(field)
        
        # Parse JSON target_val if stringified
        if isinstance(target_val, str) and (target_val.startswith("[") or target_val.startswith("{")):
            try:
                target_val = json.loads(target_val)
            except Exception:
                pass

        if target_val is None:
            return False

        if operator in ("=", "=="):
            if isinstance(target_val, bool) or (isinstance(target_val, str) and target_val.lower() in ("true", "false")):
                target_bool = target_val if isinstance(target_val, bool) else (target_val.lower() == "true")
                return bool(val) == target_bool
            return str(val).strip().lower() == str(target_val).strip().lower()

        elif operator == "!=":
            return str(val).strip().lower() != str(target_val).strip().lower()

        elif operator in ("<", "<=", ">", ">="):
            try:
                num_val = float(val or 0)
                num_target = float(target_val)
                if operator == "<":
                    return num_val < num_target
                elif operator == "<=":
                    return num_val <= num_target
                elif operator == ">":
                    return num_val > num_target
                elif operator == ">=":
                    return num_val >= num_target
            except (ValueError, TypeError):
                return False

        elif operator in ("IN", "in"):
            targets = [str(x).strip().lower() for x in (target_val if isinstance(target_val, list) else [target_val])]
            return str(val).strip().lower() in targets

        elif operator in ("CONTAINS", "contains"):
            if isinstance(val, list):
                val_normalized = [str(x).strip().lower() for x in val]
                target_normalized = str(target_val).strip().lower()
                return target_normalized in val_normalized
            return str(target_val).strip().lower() in str(val).strip().lower()

        return False
