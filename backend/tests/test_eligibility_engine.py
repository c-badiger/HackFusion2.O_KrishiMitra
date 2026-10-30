"""
Krishi Mitra - Eligibility Engine Unit Tests
Tests the deterministic, transparent statutory rules evaluator.
Ensures zero LLM hallucination, strict adherence to verified government rules,
auditable three-state classification, missing information discovery,
and clear statutory disclaimers.

NOTE: All farmer profiles in this test file are FICTIONAL TEST DATA created
solely for verification and testing of the eligibility engine.
"""

import sys
from pathlib import Path
import pytest
from datetime import datetime

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app

from app.rules_engine.models import (
    EligibilityStatus,
    RuleOperator,
    RuleEvaluationStatus,
    FarmerProfile,
    CropRecord,
    STATUTORY_DISCLAIMER_EN,
    STATUTORY_DISCLAIMER_KN,
)
from app.rules_engine.operators import OperatorEvaluator
from app.rules_engine.schemes_catalog import SchemesCatalog
from app.rules_engine.engine import EligibilityEngine, RuleEvaluator

client = TestClient(app)

# =====================================================================
# FICTIONAL TEST DATASETS
# WARNING: All profiles below are artificial test cases for unit testing
# =====================================================================

FICTIONAL_PROFILE_MARGINAL_OBC = {
    "id": 201,
    "full_name": "Fictional Basavaraj Gowda (ಕಾಲ್ಪನಿಕ)",
    "district": "Mandya",
    "district_kn": "ಮಂಡ್ಯ",
    "caste_category": "OBC",
    "annual_income": 95000.0,
    "total_land_acres": 2.5,
    "irrigation_type": "Rainfed",
    "has_borewell": False,
    "fruits_id": "KA-DEMO-201",
    "is_income_tax_payee": False,
    "has_student_children": False,
    "has_kisan_credit_card": False,
    "crops": [
        {"crop_name": "Ragi", "crop_name_kn": "ರಾಗಿ", "crop_category": "Siridhanya_Millet", "acres": 2.0, "season": "Kharif"}
    ]
}

FICTIONAL_PROFILE_CANAL_GENERAL = {
    "id": 202,
    "full_name": "Fictional Manjula Ramesh (ಕಾಲ್ಪನಿಕ)",
    "district": "Dharwad",
    "district_kn": "ಧಾರವಾಡ",
    "caste_category": "General",
    "annual_income": 180000.0,
    "total_land_acres": 4.0,
    "irrigation_type": "Canal",
    "has_borewell": False,
    "is_income_tax_payee": False,
    "has_student_children": False,
    "has_kisan_credit_card": False,
    "crops": [
        {"crop_name": "Cotton", "crop_name_kn": "ಹತ್ತಿ", "crop_category": "Cash_Crop", "acres": 2.5, "season": "Kharif"},
        {"crop_name": "Jowar", "crop_name_kn": "ಜೋಳ", "crop_category": "Cereal", "acres": 1.5, "season": "Rabi"}
    ]
}

FICTIONAL_PROFILE_INCOMPLETE = {
    "id": 203,
    "full_name": "Fictional Suresh (ಕಾಲ್ಪನಿಕ)",
    "district": "Tumakuru",
    "total_land_acres": 2.0,
    "irrigation_type": "Rainfed",
    "caste_category": None,
    "annual_income": None,
    "has_borewell": None,
    "is_income_tax_payee": None,
    "crops": []
}

FICTIONAL_PROFILE_LANDLESS = {
    "id": 204,
    "full_name": "Fictional Anand (ಕಾಲ್ಪನಿಕ)",
    "district": "Kolar",
    "caste_category": "SC",
    "annual_income": 40000.0,
    "total_land_acres": 0.0,
    "has_borewell": False,
    "crops": []
}

FICTIONAL_PROFILE_TAX_PAYEE = {
    "id": 205,
    "full_name": "Fictional Vijay (ಕಾಲ್ಪನಿಕ)",
    "district": "Belagavi",
    "caste_category": "General",
    "annual_income": 850000.0,
    "total_land_acres": 10.0,
    "is_income_tax_payee": True,
    "has_borewell": True,
    "crops": [{"crop_name": "Sugarcane", "crop_category": "Cash_Crop", "acres": 10.0, "season": "Annual"}]
}

FICTIONAL_PROFILE_STUDENT_PARENT = {
    "id": 206,
    "full_name": "Fictional Shantavva (ಕಾಲ್ಪನಿಕ)",
    "district": "Haveri",
    "total_land_acres": 3.0,
    "has_student_children": True,
    "is_income_tax_payee": False,
    "crops": [{"crop_name": "Maize", "crop_category": "Cereal", "acres": 3.0, "season": "Kharif"}]
}

FICTIONAL_PROFILE_DRIP_IRRIGATION = {
    "id": 207,
    "full_name": "Fictional Mallesh (ಕಾಲ್ಪನಿಕ)",
    "district": "Chikkaballapura",
    "total_land_acres": 3.5,
    "has_borewell": True,
    "irrigation_type": "Borewell",
    "crops": [{"crop_name": "Tomato", "crop_category": "Horticulture", "acres": 2.0, "season": "Kharif"}]
}


# =====================================================================
# 1. Scheme Catalog & Verification Metadata Tests
# =====================================================================

def test_scheme_catalog_statutory_integrity():
    """
    Requirement: Maintain structured government scheme information.
    Store source URLs and last verification dates.
    Never invent government scheme rules.
    """
    schemes = SchemesCatalog.get_all_schemes()
    assert len(schemes) >= 6, f"Expected at least 6 verified schemes, got {len(schemes)}"

    for s in schemes:
        # Mandatory statutory identity fields
        assert s.id > 0
        assert s.scheme_code.strip() != ""
        assert s.name_en.strip() != ""
        assert s.name_kn.strip() != ""
        assert s.department_en.strip() != ""
        assert s.department_kn.strip() != ""
        assert s.level in ("Karnataka_State", "Central_Government")

        # Official Source URL validation
        assert s.source_url.startswith("http://") or s.source_url.startswith("https://"), (
            f"Scheme {s.scheme_code} missing valid official source URL: {s.source_url}"
        )
        assert any(
            domain in s.source_url
            for domain in [".gov.in", ".nic.in", "myscheme.gov.in", "karnataka.gov.in"]
        ), f"Scheme {s.scheme_code} must reference an official .gov.in or .nic.in portal: {s.source_url}"

        # Verification Date validation
        assert s.last_verified_date.strip() != "", f"Scheme {s.scheme_code} missing verification date"
        # Validate ISO date format YYYY-MM-DD
        parsed_date = datetime.strptime(s.last_verified_date, "%Y-%m-%d")
        assert parsed_date.year >= 2024, f"Verification date must be recent: {s.last_verified_date}"

        # Official guideline reference validation
        assert s.official_reference.strip() != "", f"Scheme {s.scheme_code} missing official guideline reference"

        # Rules and documents presence
        assert len(s.rules) > 0, f"Scheme {s.scheme_code} must have at least one statutory rule"
        assert len(s.documents) > 0, f"Scheme {s.scheme_code} must have required document checklist"


# =====================================================================
# 2. Transparent Operator Tests
# =====================================================================

def test_operator_numeric_comparisons():
    """
    Requirement: Implement transparent eligibility rules (<, <=, >, >=).
    """
    # Less Than (<)
    status, msg_en, _ = OperatorEvaluator.evaluate(RuleOperator.LT, 2.0, 5.0, "total_land_acres")
    assert status == RuleEvaluationStatus.PASSED
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.LT, 5.0, 5.0, "total_land_acres")
    assert status == RuleEvaluationStatus.FAILED

    # Less Than Equal (<=)
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.LTE, 5.0, 5.0, "total_land_acres")
    assert status == RuleEvaluationStatus.PASSED
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.LTE, 6.0, 5.0, "total_land_acres")
    assert status == RuleEvaluationStatus.FAILED

    # Greater Than (>)
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.GT, 0.5, 0.0, "total_land_acres")
    assert status == RuleEvaluationStatus.PASSED
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.GT, 0.0, 0.0, "total_land_acres")
    assert status == RuleEvaluationStatus.FAILED

    # Greater Than Equal (>=)
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.GTE, 1.0, 1.0, "total_land_acres")
    assert status == RuleEvaluationStatus.PASSED
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.GTE, 0.8, 1.0, "total_land_acres")
    assert status == RuleEvaluationStatus.FAILED


def test_operator_membership_and_contains():
    """
    Requirement: IN, CONTAINS, and boolean equality checks.
    """
    # IN
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.IN, "OBC", ["SC", "ST", "OBC"], "caste_category")
    assert status == RuleEvaluationStatus.PASSED
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.IN, "General", ["SC", "ST", "OBC"], "caste_category")
    assert status == RuleEvaluationStatus.FAILED

    # CONTAINS for lists
    status, _, _ = OperatorEvaluator.evaluate(
        RuleOperator.CONTAINS,
        ["Siridhanya_Millet", "Pulse"],
        "Siridhanya_Millet",
        "crop_category"
    )
    assert status == RuleEvaluationStatus.PASSED

    status, _, _ = OperatorEvaluator.evaluate(
        RuleOperator.CONTAINS,
        ["Cash_Crop", "Cereal"],
        "Siridhanya_Millet",
        "crop_category"
    )
    assert status == RuleEvaluationStatus.FAILED

    # Boolean equality
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.EQ, False, False, "has_borewell")
    assert status == RuleEvaluationStatus.PASSED
    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.EQ, True, False, "has_borewell")
    assert status == RuleEvaluationStatus.FAILED


def test_operator_missing_data_handling():
    """
    Requirement: Distinguish insufficient information.
    When a farmer parameter is None, operator MUST return MISSING_DATA.
    """
    status, msg_en, msg_kn = OperatorEvaluator.evaluate(RuleOperator.EQ, None, False, "has_borewell")
    assert status == RuleEvaluationStatus.MISSING_DATA
    assert "not provided" in msg_en.lower()
    assert "ವಿವರದಲ್ಲಿ ಒದಗಿಸಿಲ್ಲ" in msg_kn

    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.LTE, None, 200000.0, "annual_income")
    assert status == RuleEvaluationStatus.MISSING_DATA

    status, _, _ = OperatorEvaluator.evaluate(RuleOperator.IN, None, ["SC", "ST", "OBC"], "caste_category")
    assert status == RuleEvaluationStatus.MISSING_DATA


# =====================================================================
# 3. Three-State Eligibility & Scenario Evaluation Tests
# =====================================================================

def test_scenario_all_round_marginal_farmer_eligible():
    """
    Test Fictional Scenario 1: Marginal OBC farmer cultivating millets in rainfed zone.
    Expected: Eligible for Raitha Siri, Krishi Bhagya, Ganga Kalyana, PM-KISAN, PMFBY.
    """
    summary = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_MARGINAL_OBC)
    eligible_codes = [s.scheme_code for s in summary.eligible_schemes]

    assert "KA-AGRI-RS-001" in eligible_codes  # Raitha Siri
    assert "KA-AGRI-KB-002" in eligible_codes  # Krishi Bhagya
    assert "KA-WEL-GK-003" in eligible_codes   # Ganga Kalyana
    assert "CENT-PM-KISAN-004" in eligible_codes  # PM-KISAN
    assert "CENT-PMFBY-005" in eligible_codes  # PMFBY

    # Verify audit reasons
    gk = next(s for s in summary.eligible_schemes if s.scheme_code == "KA-WEL-GK-003")
    assert len(gk.satisfied_conditions_en) == 4
    assert len(gk.satisfied_conditions_kn) == 4
    assert gk.status == EligibilityStatus.ELIGIBLE


def test_scenario_general_canal_farmer_ineligible_for_targeted():
    """
    Test Fictional Scenario 2: General category canal-irrigated farmer.
    Expected:
    - INELIGIBLE for Ganga Kalyana (caste and canal)
    - INELIGIBLE for Krishi Bhagya (not rainfed)
    - INELIGIBLE for Raitha Siri (not cultivating millets)
    - ELIGIBLE for PM-KISAN, PMFBY, KCC
    """
    summary = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_CANAL_GENERAL)
    ineligible_codes = [s.scheme_code for s in summary.ineligible_schemes]
    eligible_codes = [s.scheme_code for s in summary.eligible_schemes]

    assert "KA-WEL-GK-003" in ineligible_codes
    assert "KA-AGRI-KB-002" in ineligible_codes
    assert "KA-AGRI-RS-001" in ineligible_codes

    assert "CENT-PM-KISAN-004" in eligible_codes
    assert "CENT-PMFBY-005" in eligible_codes
    assert "CENT-KCC-007" in eligible_codes

    # Check that explanation gives exact failure reasons
    gk = next(s for s in summary.ineligible_schemes if s.scheme_code == "KA-WEL-GK-003")
    assert any("caste" in r.lower() or "sc, st" in r.lower() for r in gk.unsatisfied_conditions_en)


def test_scenario_incomplete_profile_insufficient_information():
    """
    Requirement: Distinguish eligible, ineligible, and insufficient information.
    Identify missing information.
    """
    summary = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_INCOMPLETE)

    # Must flag insufficient information
    assert summary.insufficient_info_count > 0

    insufficient_codes = [s.scheme_code for s in summary.insufficient_info_schemes]
    # Ganga Kalyana requires caste, income, borewell status, none of which failed but are missing
    assert "KA-WEL-GK-003" in insufficient_codes

    # Check missing information breakdown
    missing_fields = [m.field_name for m in summary.all_missing_information]
    assert "caste_category" in missing_fields
    assert "annual_income" in missing_fields
    assert "has_borewell" in missing_fields

    # Bilingual question prompt validation
    for m in summary.all_missing_information:
        assert m.question_en.strip() != ""
        assert m.question_kn.strip() != ""
        assert len(m.affects_schemes) > 0


def test_scenario_landless_worker_ineligible():
    """
    Test Fictional Scenario 4: Landless worker (0 acres).
    Must be ineligible for all schemes requiring agricultural land ownership.
    """
    summary = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_LANDLESS)
    eligible_codes = [s.scheme_code for s in summary.eligible_schemes]
    ineligible_codes = [s.scheme_code for s in summary.ineligible_schemes]

    assert "CENT-PM-KISAN-004" in ineligible_codes
    assert "KA-AGRI-KB-002" in ineligible_codes
    assert "KA-WEL-GK-003" in ineligible_codes
    assert len(eligible_codes) == 0


def test_scenario_income_tax_payee_excluded_from_pmkisan():
    """
    Test Fictional Scenario 5: Large farmer paying income tax.
    Statutory rule excludes income tax payees from PM-KISAN.
    """
    summary = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_TAX_PAYEE)
    ineligible_codes = [s.scheme_code for s in summary.ineligible_schemes]

    assert "CENT-PM-KISAN-004" in ineligible_codes
    pmk = next(s for s in summary.ineligible_schemes if s.scheme_code == "CENT-PM-KISAN-004")
    assert any("tax" in r.lower() for r in pmk.unsatisfied_conditions_en)


def test_scenario_student_children_scholarship():
    """
    Test Fictional Scenario 6: Farmer with student children.
    Eligible for CM Raita Vidya Nidhi.
    """
    summary = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_STUDENT_PARENT)
    eligible_codes = [s.scheme_code for s in summary.eligible_schemes]

    assert "KA-EDU-RVN-006" in eligible_codes


def test_scenario_drip_micro_irrigation():
    """
    Test Fictional Scenario 7: Farmer with functional borewell.
    Eligible for PMKSY-PDMC micro-irrigation subsidy.
    """
    summary = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_DRIP_IRRIGATION)
    eligible_codes = [s.scheme_code for s in summary.eligible_schemes]

    assert "CENT-PMKSY-PDMC-008" in eligible_codes


# =====================================================================
# 4. Deterministic Separation from LLM Tests
# =====================================================================

def test_engine_pure_determinism():
    """
    Requirement: Keep eligibility logic separate from the LLM.
    Zero hallucination: Multiple evaluations with same inputs must yield bitwise identical outputs.
    """
    res1 = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_MARGINAL_OBC)
    res2 = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_MARGINAL_OBC)

    assert res1.eligible_count == res2.eligible_count
    assert res1.insufficient_info_count == res2.insufficient_info_count
    assert res1.ineligible_count == res2.ineligible_count

    codes1 = [s.scheme_code for s in res1.eligible_schemes]
    codes2 = [s.scheme_code for s in res2.eligible_schemes]
    assert codes1 == codes2


# =====================================================================
# 5. Statutory Disclaimers & Transparency Tests
# =====================================================================

def test_statutory_disclaimers_present():
    """
    Requirement: Do not claim official government approval.
    All evaluations must include explicit statutory disclaimers in English and Kannada.
    """
    summary = EligibilityEngine.evaluate_farmer(FICTIONAL_PROFILE_MARGINAL_OBC)

    assert summary.statutory_disclaimer_en == STATUTORY_DISCLAIMER_EN
    assert summary.statutory_disclaimer_kn == STATUTORY_DISCLAIMER_KN

    # Must contain warning that this is indicative and NOT official approval
    assert "indicative" in summary.statutory_disclaimer_en.lower()
    assert "not" in summary.statutory_disclaimer_en.lower()
    assert "ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಅನುಮೋದನೆಯಲ್ಲ" in summary.statutory_disclaimer_kn


# =====================================================================
# 6. Backward Compatibility with Legacy RuleEvaluator
# =====================================================================

def test_backward_compatible_rule_evaluator():
    """
    Ensure existing callers using RuleEvaluator.evaluate_farmer continue to work.
    """
    legacy_out = RuleEvaluator.evaluate_farmer(FICTIONAL_PROFILE_MARGINAL_OBC)
    assert "eligible_schemes" in legacy_out
    assert "partially_eligible_schemes" in legacy_out
    assert "ineligible_schemes" in legacy_out
    assert "statutory_disclaimer_kn" in legacy_out
    assert len(legacy_out["eligible_schemes"]) > 0


# =====================================================================
# 7. FastAPI Endpoints Integration Tests
# =====================================================================

def test_fastapi_eligibility_evaluate_endpoint():
    """
    Test POST /api/eligibility/evaluate
    """
    payload = {
        "profile": {
            "total_land_acres": 2.5,
            "caste_category": "OBC",
            "annual_income": 95000.0,
            "irrigation_type": "Rainfed",
            "has_borewell": False,
            "crops": [
                {"crop_name": "Ragi", "crop_category": "Siridhanya_Millet", "acres": 2.0, "season": "Kharif"}
            ]
        }
    }
    response = client.post("/api/eligibility/evaluate", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]

    assert data["eligible_count"] > 0
    assert "statutory_disclaimer_en" in data
    assert "statutory_disclaimer_kn" in data

    # Verify first eligible scheme has official source url and verification date
    first_scheme = data["eligible_schemes"][0]
    assert first_scheme["source_url"].startswith("http")
    assert first_scheme["last_verified_date"] != ""
    assert first_scheme["official_reference"] != ""


def test_fastapi_eligibility_explain_endpoint():
    """
    Test POST /api/eligibility/explain
    """
    payload = {
        "scheme_id": 1,  # Raitha Siri
        "language": "kn",
        "profile": {
            "total_land_acres": 2.5,
            "caste_category": "OBC",
            "annual_income": 95000.0,
            "irrigation_type": "Rainfed",
            "crops": [
                {"crop_name": "Ragi", "crop_category": "Siridhanya_Millet", "acres": 2.0, "season": "Kharif"}
            ]
        }
    }
    response = client.post("/api/eligibility/explain", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]

    assert data["scheme_id"] == 1
    assert data["status"] == "ELIGIBLE"
    assert len(data["satisfied_reasons"]) > 0
    assert "ರೈತ ಸಿರಿ" in data["scheme_name_kn"]
    assert data["source_url"] != ""


def test_fastapi_missing_info_endpoint():
    """
    Test POST /api/eligibility/missing-info
    """
    payload = {
        "profile": {
            "total_land_acres": 2.0,
            "irrigation_type": "Rainfed"
            # Missing income, caste, borewell
        }
    }
    response = client.post("/api/eligibility/missing-info", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]

    assert data["missing_fields_count"] > 0
    assert len(data["missing_information"]) > 0
    field_names = [m["field_name"] for m in data["missing_information"]]
    assert "annual_income" in field_names
    assert "caste_category" in field_names


def test_fastapi_fictional_test_profiles_endpoint():
    """
    Test GET /api/eligibility/fictional-test-profiles
    """
    response = client.get("/api/eligibility/fictional-test-profiles")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]

    assert "__NOTICE__" in data
    assert "FICTIONAL" in data["__NOTICE__"]
    assert len(data["profiles"]) >= 5


if __name__ == "__main__":
    pytest.main(["-v", __file__])
