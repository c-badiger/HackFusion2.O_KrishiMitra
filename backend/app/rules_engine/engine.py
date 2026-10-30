"""
Krishi Mitra - Deterministic Eligibility Engine
Implements transparent, auditable statutory scheme eligibility evaluation.
Completely isolated from LLM generation to ensure zero hallucination.

Responsibilities:
1. Maintain structured government scheme information.
2. Implement transparent eligibility rules.
3. Accept farmer information.
4. Compare farmer information with scheme conditions.
5. Identify potentially matching schemes.
6. Explain why a scheme matches or does not match.
7. Identify missing information.
8. Return structured results to FastAPI.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Union, Tuple

from app.rules_engine.models import (
    EligibilityStatus,
    RuleEvaluationStatus,
    GovernmentScheme,
    RuleCondition,
    RuleEvaluationResult,
    SchemeEvaluationResult,
    MissingInfoItem,
    EvaluationSummary,
    FarmerProfile,
    STATUTORY_DISCLAIMER_EN,
    STATUTORY_DISCLAIMER_KN,
)
from app.rules_engine.operators import OperatorEvaluator
from app.rules_engine.schemes_catalog import SchemesCatalog

logger = logging.getLogger("krishi_mitra.eligibility_engine")
DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

# Standard question prompts for missing farmer attributes
FIELD_METADATA: Dict[str, Dict[str, str]] = {
    "total_land_acres": {
        "label_en": "Total Landholding (Acres)",
        "label_kn": "ಒಟ್ಟು ಜಮೀನು (ಎಕರೆ)",
        "question_en": "How many acres of agricultural land do you own or cultivate?",
        "question_kn": "ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಎಷ್ಟು ಎಕರೆ ಕೃಷಿ ಜಮೀನು ಇದೆ?"
    },
    "caste_category": {
        "label_en": "Social Category / Caste",
        "label_kn": "ಸಾಮಾಜಿಕ ಜಾತಿ ವರ್ಗ",
        "question_en": "What is your social / caste category (SC, ST, OBC, or General)?",
        "question_kn": "ನಿಮ್ಮ ಸಾಮಾಜಿಕ ಜಾತಿ ವರ್ಗ ಯಾವುದು (SC, ST, OBC, ಅಥವಾ ಸಾಮಾನ್ಯ)?"
    },
    "annual_income": {
        "label_en": "Annual Family Income",
        "label_kn": "ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ",
        "question_en": "What is your approximate annual family income in Rupees?",
        "question_kn": "ನಿಮ್ಮ ಕುಟುಂಬದ ಅಂದಾಜು ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು ರೂಪಾಯಿ?"
    },
    "irrigation_type": {
        "label_en": "Irrigation Source",
        "label_kn": "ನೀರಾವರಿ ಪದ್ಧತಿ",
        "question_en": "What is your primary irrigation source (e.g. Rainfed, Borewell, Canal)?",
        "question_kn": "ನಿಮ್ಮ ಜಮೀನಿನ ನೀರಾವರಿ ಪದ್ಧತಿ ಯಾವುದು (ಮಳೆಯಾಶ್ರಿತ, ಬೋರ್‌ವೆಲ್, ಅಥವಾ ಕಾಲುವೆ)?"
    },
    "has_borewell": {
        "label_en": "Existing Borewell Facility",
        "label_kn": "ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಬೋರ್‌ವೆಲ್ ಸೌಲಭ್ಯ",
        "question_en": "Do you have an existing functional irrigation borewell on your land?",
        "question_kn": "ನಿಮ್ಮ ಜಮೀನಿನಲ್ಲಿ ಈಗಾಗಲೇ ಯಾವುದೇ ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಬೋರ್‌ವೆಲ್ ಇದೆಯೇ?"
    },
    "crop_category": {
        "label_en": "Cultivated Crops / Category",
        "label_kn": "ಬೆಳೆಯುವ ಬೆಳೆಗಳು / ವರ್ಗ",
        "question_en": "Which agricultural or horticultural crops do you cultivate?",
        "question_kn": "ನೀವು ಪ್ರಸ್ತುತ ಯಾವ ಬೆಳೆಗಳನ್ನು ಬೆಳೆಯುತ್ತಿದ್ದೀರಿ?"
    },
    "is_income_tax_payee": {
        "label_en": "Income Tax Payer Status",
        "label_kn": "ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿದಾರರ ವಿವರ",
        "question_en": "Did you or any member of your family pay income tax in the last assessment year?",
        "question_kn": "ನೀವು ಅಥವಾ ನಿಮ್ಮ ಕುಟುಂಬದವರು ಕಳೆದ ಸಾಲಿನಲ್ಲಿ ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿಸಿದ್ದೀರಾ?"
    },
    "has_student_children": {
        "label_en": "Student Children (Higher Education)",
        "label_kn": "ಉನ್ನತ ಶಿಕ್ಷಣ ವ್ಯಾಸಂಗ ಮಾಡುವ ಮಕ್ಕಳು",
        "question_en": "Do you have children pursuing post-matric, PUC, Diploma, or Degree studies?",
        "question_kn": "ನಿಮ್ಮ ಮಕ್ಕಳು ಪಿಯುಸಿ, ಡಿಪ್ಲೋಮಾ, ಪದವಿ ಅಥವಾ ಉನ್ನತ ಶಿಕ್ಷಣದಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆಯೇ?"
    },
    "has_kisan_credit_card": {
        "label_en": "Kisan Credit Card (KCC) Status",
        "label_kn": "ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ವಿವರ",
        "question_en": "Do you currently hold an active Kisan Credit Card (KCC)?",
        "question_kn": "ನಿಮ್ಮ ಬಳಿ ಈಗಾಗಲೇ ಸಕ್ರಿಯವಾಗಿರುವ ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC) ಇದೆಯೇ?"
    }
}


class EligibilityEngine:
    """
    Core Deterministic Eligibility Engine.
    Executes rules-based matching of farmer profiles against official government schemes.
    """

    @classmethod
    def evaluate_farmer(
        cls,
        farmer_profile: Union[Dict[str, Any], FarmerProfile],
        schemes: Optional[List[GovernmentScheme]] = None
    ) -> EvaluationSummary:
        """
        Evaluates a farmer profile against the statutory scheme catalog.
        Categorizes schemes into:
        - eligible_schemes (100% mandatory conditions satisfied)
        - insufficient_info_schemes (no conditions failed, but missing information on mandatory rules)
        - ineligible_schemes (one or more mandatory conditions failed)
        """
        if schemes is None:
            schemes = SchemesCatalog.get_all_schemes()

        farmer_ctx = cls._extract_farmer_context(farmer_profile)
        farmer_id = farmer_ctx.get("id")

        eligible_list: List[SchemeEvaluationResult] = []
        insufficient_info_list: List[SchemeEvaluationResult] = []
        ineligible_list: List[SchemeEvaluationResult] = []

        # Aggregated tracking for all missing attributes
        missing_fields_map: Dict[str, List[str]] = {}

        for scheme in schemes:
            eval_result = cls.evaluate_scheme(farmer_ctx, scheme)

            if eval_result.status == EligibilityStatus.ELIGIBLE:
                eligible_list.append(eval_result)
            elif eval_result.status == EligibilityStatus.INSUFFICIENT_INFORMATION:
                insufficient_info_list.append(eval_result)
            else:
                ineligible_list.append(eval_result)

            # Record missing fields for question ranking
            for rule_ev in eval_result.rule_evaluations:
                if rule_ev.status == RuleEvaluationStatus.MISSING_DATA:
                    field = rule_ev.missing_field or rule_ev.parameter_name
                    if field not in missing_fields_map:
                        missing_fields_map[field] = []
                    missing_fields_map[field].append(scheme.name_kn)

        # Build prioritized missing information list
        all_missing_info: List[MissingInfoItem] = []
        for field, affected in sorted(missing_fields_map.items(), key=lambda x: len(x[1]), reverse=True):
            meta = FIELD_METADATA.get(field, {
                "label_en": field.replace("_", " ").title(),
                "label_kn": field,
                "question_en": f"Please provide your {field.replace('_', ' ')}.",
                "question_kn": f"ದಯವಿಟ್ಟು ನಿಮ್ಮ {field} ವಿವರವನ್ನು ಒದಗಿಸಿ."
            })
            all_missing_info.append(
                MissingInfoItem(
                    field_name=field,
                    label_en=meta["label_en"],
                    label_kn=meta["label_kn"],
                    question_en=meta["question_en"],
                    question_kn=meta["question_kn"],
                    affects_schemes=list(set(affected)),
                    priority=len(set(affected))
                )
            )

        # Sort results: eligible by match score desc, insufficient info by score desc
        eligible_list.sort(key=lambda s: s.match_score, reverse=True)
        insufficient_info_list.sort(key=lambda s: s.match_score, reverse=True)
        ineligible_list.sort(key=lambda s: s.match_score, reverse=True)

        return EvaluationSummary(
            evaluated_at=datetime.now(timezone.utc).isoformat(),
            farmer_id=farmer_id,
            total_schemes_evaluated=len(schemes),
            eligible_count=len(eligible_list),
            insufficient_info_count=len(insufficient_info_list),
            ineligible_count=len(ineligible_list),
            eligible_schemes=eligible_list,
            insufficient_info_schemes=insufficient_info_list,
            ineligible_schemes=ineligible_list,
            all_missing_information=all_missing_info,
            statutory_disclaimer_en=STATUTORY_DISCLAIMER_EN,
            statutory_disclaimer_kn=STATUTORY_DISCLAIMER_KN,
        )

    @classmethod
    def evaluate_scheme(
        cls,
        farmer_ctx: Union[Dict[str, Any], FarmerProfile],
        scheme: GovernmentScheme
    ) -> SchemeEvaluationResult:
        """
        Evaluates an individual statutory scheme against the farmer context.
        """
        farmer_data = cls._extract_farmer_context(farmer_ctx)

        rule_evaluations: List[RuleEvaluationResult] = []
        satisfied_en: List[str] = []
        satisfied_kn: List[str] = []
        unsatisfied_en: List[str] = []
        unsatisfied_kn: List[str] = []
        missing_en: List[str] = []
        missing_kn: List[str] = []

        total_rules = len(scheme.rules)
        mandatory_failed = False
        mandatory_missing = False
        passed_rules_count = 0

        for rule in scheme.rules:
            # Extract actual farmer value for parameter
            actual_val = cls._get_parameter_value(farmer_data, rule.parameter_name)

            status, msg_en, msg_kn = OperatorEvaluator.evaluate(
                operator=rule.operator,
                farmer_value=actual_val,
                target_value=rule.target_value,
                param_name=rule.parameter_name
            )

            # Handle prompts
            missing_prompt_en = rule.missing_prompt_en
            missing_prompt_kn = rule.missing_prompt_kn
            if not missing_prompt_en and rule.parameter_name in FIELD_METADATA:
                missing_prompt_en = FIELD_METADATA[rule.parameter_name]["question_en"]
                missing_prompt_kn = FIELD_METADATA[rule.parameter_name]["question_kn"]

            rule_ev = RuleEvaluationResult(
                rule_code=rule.rule_code,
                parameter_name=rule.parameter_name,
                operator=rule.operator.value if hasattr(rule.operator, "value") else str(rule.operator),
                target_value=rule.target_value,
                actual_value=actual_val,
                status=status,
                is_mandatory=rule.is_mandatory,
                explanation_en=rule.explanation_en,
                explanation_kn=rule.explanation_kn,
                detail_message_en=msg_en,
                detail_message_kn=msg_kn,
                missing_field=rule.parameter_name if status == RuleEvaluationStatus.MISSING_DATA else None,
                missing_prompt_en=missing_prompt_en if status == RuleEvaluationStatus.MISSING_DATA else None,
                missing_prompt_kn=missing_prompt_kn if status == RuleEvaluationStatus.MISSING_DATA else None
            )
            rule_evaluations.append(rule_ev)

            if status == RuleEvaluationStatus.PASSED:
                passed_rules_count += 1
                satisfied_en.append(rule.explanation_en)
                satisfied_kn.append(rule.explanation_kn)
            elif status == RuleEvaluationStatus.FAILED:
                if rule.is_mandatory:
                    mandatory_failed = True
                unsatisfied_en.append(f"{rule.explanation_en} ({msg_en})")
                unsatisfied_kn.append(f"{rule.explanation_kn} ({msg_kn})")
            elif status == RuleEvaluationStatus.MISSING_DATA:
                if rule.is_mandatory:
                    mandatory_missing = True
                missing_en.append(missing_prompt_en or f"Requires {rule.parameter_name}")
                missing_kn.append(missing_prompt_kn or f"{rule.parameter_name} ವಿವರ ಅಗತ್ಯವಿದೆ")

        # Determine overall scheme eligibility status
        if mandatory_failed:
            overall_status = EligibilityStatus.INELIGIBLE
        elif mandatory_missing:
            overall_status = EligibilityStatus.INSUFFICIENT_INFORMATION
        else:
            overall_status = EligibilityStatus.ELIGIBLE

        # Score calculation
        score = int((passed_rules_count / total_rules) * 100) if total_rules > 0 else 100

        doc_en = [d.document_name_en for d in scheme.documents]
        doc_kn = [d.document_name_kn for d in scheme.documents]

        return SchemeEvaluationResult(
            scheme_id=scheme.id,
            scheme_code=scheme.scheme_code,
            name_en=scheme.name_en,
            name_kn=scheme.name_kn,
            department_en=scheme.department_en,
            department_kn=scheme.department_kn,
            category=scheme.category,
            level=scheme.level,
            status=overall_status,
            match_score=score,
            source_url=scheme.source_url,
            last_verified_date=scheme.last_verified_date,
            official_reference=scheme.official_reference,
            benefit_amount_desc_en=scheme.benefit_amount_desc_en,
            benefit_amount_desc_kn=scheme.benefit_amount_desc_kn,
            summary_en=scheme.summary_en,
            summary_kn=scheme.summary_kn,
            satisfied_conditions_en=satisfied_en,
            satisfied_conditions_kn=satisfied_kn,
            unsatisfied_conditions_en=unsatisfied_en,
            unsatisfied_conditions_kn=unsatisfied_kn,
            missing_information_en=missing_en,
            missing_information_kn=missing_kn,
            required_documents_en=doc_en,
            required_documents_kn=doc_kn,
            how_to_apply_en="Apply through your village Raitha Samparka Kendra (RSK) or official department portal.",
            how_to_apply_kn="ನಿಮ್ಮ ಗ್ರಾಮದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) ಅಥವಾ ಇಲಾಖೆಯ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            application_portal=scheme.application_portal,
            rule_evaluations=rule_evaluations
        )

    @classmethod
    def _extract_farmer_context(cls, profile: Union[Dict[str, Any], FarmerProfile]) -> Dict[str, Any]:
        """
        Normalizes a farmer profile into an evaluatable parameter dictionary.
        Idempotent: safe to call multiple times without losing extracted parameters.
        Preserves None values so missing information can be accurately identified.
        """
        if isinstance(profile, FarmerProfile):
            data = profile.model_dump()
        elif isinstance(profile, dict):
            data = dict(profile)
        else:
            data = {}

        if data.get("_is_normalized"):
            return data

        # Preserve crop_category if already present
        existing_categories = data.get("crop_category")
        if isinstance(existing_categories, list):
            crop_categories = list(existing_categories)
        elif isinstance(existing_categories, str) and existing_categories:
            crop_categories = [existing_categories]
        else:
            crop_categories = []

        crops = data.get("crops") or []
        crop_names = []
        for c in crops:
            if isinstance(c, dict):
                c_name = c.get("crop_name")
                c_cat = c.get("crop_category")
                if c_name:
                    crop_names.append(c_name)
                if c_cat and c_cat not in crop_categories:
                    crop_categories.append(c_cat)
            elif isinstance(c, str):
                crop_names.append(c)
            else:
                c_name = getattr(c, "crop_name", None)
                c_cat = getattr(c, "crop_category", None)
                if c_name:
                    crop_names.append(c_name)
                if c_cat and c_cat not in crop_categories:
                    crop_categories.append(c_cat)

        context = {
            "_is_normalized": True,
            "id": data.get("id"),
            "full_name": data.get("full_name"),
            "phone_number": data.get("phone_number"),
            "district": data.get("district"),
            "district_kn": data.get("district_kn"),
            "taluk": data.get("taluk"),
            "village": data.get("village"),
            "state": data.get("state", "Karnataka"),
            "total_land_acres": data.get("total_land_acres"),
            "caste_category": data.get("caste_category"),
            "annual_income": data.get("annual_income"),
            "farmer_category": data.get("farmer_category"),
            "soil_type": data.get("soil_type"),
            "irrigation_type": data.get("irrigation_type"),
            "has_borewell": data.get("has_borewell"),
            "fruits_id": data.get("fruits_id"),
            "aadhaar_linked_bank_account": data.get("aadhaar_linked_bank_account"),
            "is_income_tax_payee": data.get("is_income_tax_payee"),
            "has_student_children": data.get("has_student_children"),
            "has_kisan_credit_card": data.get("has_kisan_credit_card"),
            "crops": crop_names,
            "crop_category": crop_categories
        }

        return context

    @classmethod
    def _get_parameter_value(cls, farmer_ctx: Dict[str, Any], parameter_name: str) -> Any:
        """
        Safe retrieval of farmer parameters, handling alias mappings.
        """
        # Direct lookup
        if parameter_name in farmer_ctx:
            return farmer_ctx[parameter_name]

        # Common aliases
        aliases = {
            "land_acres": "total_land_acres",
            "land": "total_land_acres",
            "caste": "caste_category",
            "income": "annual_income",
            "irrigation": "irrigation_type",
            "borewell": "has_borewell",
            "tax_payee": "is_income_tax_payee",
            "student_children": "has_student_children",
            "kcc": "has_kisan_credit_card"
        }
        target = aliases.get(parameter_name)
        if target and target in farmer_ctx:
            return farmer_ctx[target]

        return None


# =====================================================================
# Backward-Compatible RuleEvaluator Adapter
# Preserves exact interface expected by existing FastAPI endpoints and chat handlers
# =====================================================================

class RuleEvaluator:
    """
    Backward-compatible adapter wrapping the new EligibilityEngine.
    Maintains exact legacy dictionary responses for existing endpoints while
    leveraging the new deterministic statutory engine under the hood.
    """

    @staticmethod
    def load_fallback_schemes() -> List[Dict[str, Any]]:
        schemes = SchemesCatalog.get_all_schemes()
        return [s.model_dump() for s in schemes]

    @classmethod
    def evaluate_farmer(
        cls,
        farmer_profile: Dict[str, Any],
        schemes: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Drop-in replacement for legacy RuleEvaluator.evaluate_farmer.
        Returns legacy dictionary format:
        {
            "eligible_schemes": [...],
            "partially_eligible_schemes": [...],
            "ineligible_schemes": [...]
        }
        """
        # Convert raw dictionaries to GovernmentScheme models if passed
        scheme_models = None
        if schemes:
            scheme_models = []
            for s in schemes:
                try:
                    scheme_models.append(GovernmentScheme.model_validate(s))
                except Exception:
                    pass

        summary = EligibilityEngine.evaluate_farmer(farmer_profile, schemes=scheme_models)

        # Legacy eligible schemes (100% matched)
        legacy_eligible = []
        for s in summary.eligible_schemes:
            legacy_eligible.append({
                "scheme_id": s.scheme_id,
                "scheme_code": s.scheme_code,
                "name_en": s.name_en,
                "name_kn": s.name_kn,
                "department_kn": s.department_kn,
                "department_en": s.department_en,
                "match_score": s.match_score,
                "indicative_status": "LIKELY_ELIGIBLE",
                "benefit_amount_kn": s.benefit_amount_desc_kn,
                "qualification_reasons_kn": s.satisfied_conditions_kn,
                "required_documents_kn": s.required_documents_kn,
                "how_to_apply_kn": s.how_to_apply_kn,
                "application_portal": s.application_portal,
                "source_url": s.source_url,
                "last_verified_date": s.last_verified_date,
                "official_reference": s.official_reference
            })

        # Legacy partially eligible schemes (insufficient info or partial match >= 50%)
        legacy_partially_eligible = []
        for s in summary.insufficient_info_schemes:
            legacy_partially_eligible.append({
                "scheme_id": s.scheme_id,
                "scheme_code": s.scheme_code,
                "name_en": s.name_en,
                "name_kn": s.name_kn,
                "department_kn": s.department_kn,
                "department_en": s.department_en,
                "match_score": s.match_score,
                "indicative_status": "INSUFFICIENT_INFORMATION",
                "benefit_amount_kn": s.benefit_amount_desc_kn,
                "qualification_reasons_kn": s.satisfied_conditions_kn,
                "missing_criteria_kn": s.missing_information_kn,
                "required_documents_kn": s.required_documents_kn,
                "how_to_apply_kn": s.how_to_apply_kn,
                "application_portal": s.application_portal,
                "source_url": s.source_url,
                "last_verified_date": s.last_verified_date,
                "official_reference": s.official_reference
            })

        # Legacy ineligible schemes
        legacy_ineligible = []
        for s in summary.ineligible_schemes:
            legacy_ineligible.append({
                "scheme_id": s.scheme_id,
                "scheme_code": s.scheme_code,
                "name_en": s.name_en,
                "name_kn": s.name_kn,
                "department_kn": s.department_kn,
                "department_en": s.department_en,
                "match_score": s.match_score,
                "indicative_status": "INELIGIBLE",
                "benefit_amount_kn": s.benefit_amount_desc_kn,
                "qualification_reasons_kn": s.satisfied_conditions_kn,
                "unmet_reasons_kn": s.unsatisfied_conditions_kn,
                "required_documents_kn": s.required_documents_kn,
                "how_to_apply_kn": s.how_to_apply_kn,
                "application_portal": s.application_portal,
                "source_url": s.source_url,
                "last_verified_date": s.last_verified_date,
                "official_reference": s.official_reference
            })

        return {
            "eligible_schemes": legacy_eligible,
            "partially_eligible_schemes": legacy_partially_eligible,
            "ineligible_schemes": legacy_ineligible,
            "missing_information": [m.model_dump() for m in summary.all_missing_information],
            "statutory_disclaimer_en": STATUTORY_DISCLAIMER_EN,
            "statutory_disclaimer_kn": STATUTORY_DISCLAIMER_KN
        }
