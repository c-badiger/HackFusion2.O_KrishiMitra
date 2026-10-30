"""
Krishi Mitra - Deterministic Rule Operators
Provides transparent, auditable condition evaluation for statutory scheme criteria.
Completely isolated from LLM generation to guarantee zero hallucination.
"""

import json
from typing import Any, Tuple, Optional, Union
from app.rules_engine.models import RuleOperator, RuleEvaluationStatus

Union_RuleOperator_or_str = Union[RuleOperator, str]


class OperatorEvaluator:
    """
    Evaluates a single condition against farmer data.
    Returns (status, detail_message_en, detail_message_kn).
    """

    @staticmethod
    def evaluate(
        operator: Union_RuleOperator_or_str,
        farmer_value: Any,
        target_value: Any,
        param_name: str
    ) -> Tuple[RuleEvaluationStatus, str, str]:
        # Normalize operator
        op_str = operator.value if isinstance(operator, RuleOperator) else str(operator).upper().strip()

        # Handle target_value JSON parsing if stringified
        parsed_target = target_value
        if isinstance(target_value, str) and (
            (target_value.startswith("[") and target_value.endswith("]")) or
            (target_value.startswith("{") and target_value.endswith("}"))
        ):
            try:
                parsed_target = json.loads(target_value)
            except Exception:
                parsed_target = target_value

        # Check for missing data
        # Note: If the operator is EXISTS, farmer_value == None is an evaluatable condition
        if op_str == "EXISTS":
            exists = farmer_value is not None and farmer_value != ""
            if exists:
                return (
                    RuleEvaluationStatus.PASSED,
                    f"Parameter '{param_name}' is documented in profile.",
                    f"'{param_name}' ವಿವರವು ರೈತರ ವಿವರದಲ್ಲಿ ನಮೂದಾಗಿದೆ."
                )
            else:
                return (
                    RuleEvaluationStatus.FAILED,
                    f"Parameter '{param_name}' is not documented in profile.",
                    f"'{param_name}' ವಿವರವು ರೈತರ ವಿವರದಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ."
                )

        if farmer_value is None:
            return (
                RuleEvaluationStatus.MISSING_DATA,
                f"Required information '{param_name}' is not provided in farmer profile.",
                f"ಅಗತ್ಯವಿರುವ '{param_name}' ವಿವರವು ರೈತರ ವಿವರದಲ್ಲಿ ಒದಗಿಸಿಲ್ಲ."
            )

        # Equal (EQ, =)
        if op_str in ("=", "=="):
            return OperatorEvaluator._evaluate_eq(farmer_value, parsed_target, param_name)

        # Not Equal (NEQ, !=)
        elif op_str in ("!=", "<>"):
            return OperatorEvaluator._evaluate_neq(farmer_value, parsed_target, param_name)

        # Less Than (<)
        elif op_str == "<":
            return OperatorEvaluator._evaluate_comparison(farmer_value, parsed_target, param_name, "<")

        # Less Than or Equal (<=)
        elif op_str == "<=":
            return OperatorEvaluator._evaluate_comparison(farmer_value, parsed_target, param_name, "<=")

        # Greater Than (>)
        elif op_str == ">":
            return OperatorEvaluator._evaluate_comparison(farmer_value, parsed_target, param_name, ">")

        # Greater Than or Equal (>=)
        elif op_str == ">=":
            return OperatorEvaluator._evaluate_comparison(farmer_value, parsed_target, param_name, ">=")

        # IN (Value in list)
        elif op_str == "IN":
            return OperatorEvaluator._evaluate_in(farmer_value, parsed_target, param_name)

        # NOT_IN (Value not in list)
        elif op_str == "NOT_IN":
            return OperatorEvaluator._evaluate_not_in(farmer_value, parsed_target, param_name)

        # CONTAINS (List contains item or substring match)
        elif op_str == "CONTAINS":
            return OperatorEvaluator._evaluate_contains(farmer_value, parsed_target, param_name)

        # BETWEEN (e.g. [min, max])
        elif op_str == "BETWEEN":
            return OperatorEvaluator._evaluate_between(farmer_value, parsed_target, param_name)

        else:
            return (
                RuleEvaluationStatus.FAILED,
                f"Unsupported operator '{op_str}' for parameter '{param_name}'.",
                f"ಅಸಿಂಧು ಆಪರೇಟರ್ '{op_str}'."
            )

    @staticmethod
    def _evaluate_eq(val: Any, target: Any, param: str) -> Tuple[RuleEvaluationStatus, str, str]:
        # Handle boolean conversion
        if isinstance(target, bool) or (isinstance(target, str) and target.lower() in ("true", "false")):
            target_bool = target if isinstance(target, bool) else (target.lower() == "true")
            val_bool = bool(val)
            if val_bool == target_bool:
                return (
                    RuleEvaluationStatus.PASSED,
                    f"Parameter '{param}' is {val_bool}, matching requirement {target_bool}.",
                    f"'{param}' ಮೌಲ್ಯವು {val_bool} ಆಗಿದ್ದು, ನಿಗದಿತ ಷರತ್ತನ್ನು ಪೂರೈಸಿದೆ."
                )
            else:
                return (
                    RuleEvaluationStatus.FAILED,
                    f"Parameter '{param}' is {val_bool}, but requirement specifies {target_bool}.",
                    f"'{param}' ಮೌಲ್ಯವು {val_bool} ಆಗಿದ್ದು, ಷರತ್ತು {target_bool} ಗೆ ತಾಳೆಯಾಗುತ್ತಿಲ್ಲ."
                )

        # String / Numeric comparison
        val_str = str(val).strip().lower()
        target_str = str(target).strip().lower()
        if val_str == target_str:
            return (
                RuleEvaluationStatus.PASSED,
                f"Value '{val}' matches required '{target}'.",
                f"ಮೌಲ್ಯ '{val}' ನಿಗದಿತ '{target}' ಗೆ ತಾಳೆಯಾಗುತ್ತದೆ."
            )
        else:
            return (
                RuleEvaluationStatus.FAILED,
                f"Value '{val}' does not match required '{target}'.",
                f"ಮೌಲ್ಯ '{val}' ನಿಗದಿತ '{target}' ಗೆ ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತಿಲ್ಲ."
            )

    @staticmethod
    def _evaluate_neq(val: Any, target: Any, param: str) -> Tuple[RuleEvaluationStatus, str, str]:
        val_str = str(val).strip().lower()
        target_str = str(target).strip().lower()
        if val_str != target_str:
            return (
                RuleEvaluationStatus.PASSED,
                f"Value '{val}' satisfies non-equivalence requirement (!= '{target}').",
                f"ಮೌಲ್ಯ '{val}' ಷರತ್ತನ್ನು ಪೂರೈಸಿದೆ."
            )
        else:
            return (
                RuleEvaluationStatus.FAILED,
                f"Value '{val}' is disallowed by requirement (!= '{target}').",
                f"ಮೌಲ್ಯ '{val}' ನಿಷೇಧಿತ ಮೌಲ್ಯ '{target}' ಗೆ ಸಮನಾಗಿದೆ."
            )

    @staticmethod
    def _evaluate_comparison(val: Any, target: Any, param: str, comp: str) -> Tuple[RuleEvaluationStatus, str, str]:
        try:
            num_val = float(val)
            num_target = float(target)
        except (ValueError, TypeError):
            return (
                RuleEvaluationStatus.FAILED,
                f"Cannot perform numeric comparison '{comp}' between '{val}' and '{target}'.",
                f"ಸಂಖ್ಯಾತ್ಮಕ ಹೋಲಿಕೆ ಅಸಾಧ್ಯ."
            )

        passed = False
        if comp == "<":
            passed = num_val < num_target
        elif comp == "<=":
            passed = num_val <= num_target
        elif comp == ">":
            passed = num_val > num_target
        elif comp == ">=":
            passed = num_val >= num_target

        if passed:
            return (
                RuleEvaluationStatus.PASSED,
                f"Value {num_val} satisfies condition ({comp} {num_target}).",
                f"ಮೌಲ್ಯ {num_val} ಷರತ್ತು ({comp} {num_target}) ಅನ್ನು ಪೂರೈಸಿದೆ."
            )
        else:
            return (
                RuleEvaluationStatus.FAILED,
                f"Value {num_val} does not satisfy condition ({comp} {num_target}).",
                f"ಮೌಲ್ಯ {num_val} ಷರತ್ತು ({comp} {num_target}) ಅನ್ನು ಪೂರೈಸಿಲ್ಲ."
            )

    @staticmethod
    def _evaluate_in(val: Any, target: Any, param: str) -> Tuple[RuleEvaluationStatus, str, str]:
        target_list = target if isinstance(target, list) else [target]
        normalized_targets = [str(t).strip().lower() for t in target_list]

        if isinstance(val, list):
            val_items = [str(x).strip().lower() for x in val]
            matched = [x for x in val_items if x in normalized_targets]
            if matched:
                return (
                    RuleEvaluationStatus.PASSED,
                    f"Farmer category '{matched[0]}' matches authorized categories {target_list}.",
                    f"ರೈತರ ವರ್ಗ '{matched[0]}' ಅಧಿಕೃತ ವರ್ಗಗಳ ಪಟ್ಟಿಯಲ್ಲಿದೆ ({target_list})."
                )
            else:
                return (
                    RuleEvaluationStatus.FAILED,
                    f"Farmer categories {val} are not in authorized list {target_list}.",
                    f"ರೈತರ ಯಾವುದೇ ವರ್ಗ ಅಧಿಕೃತ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ ({target_list})."
                )

        normalized_val = str(val).strip().lower()
        if normalized_val in normalized_targets:
            return (
                RuleEvaluationStatus.PASSED,
                f"Value '{val}' is among recognized categories {target_list}.",
                f"ಮೌಲ್ಯ '{val}' ಅರ್ಹ ವರ್ಗಗಳ ಪಟ್ಟಿಯಲ್ಲಿದೆ ({target_list})."
            )
        else:
            return (
                RuleEvaluationStatus.FAILED,
                f"Value '{val}' is not in authorized list {target_list}.",
                f"ಮೌಲ್ಯ '{val}' ಅರ್ಹ ವರ್ಗಗಳ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ ({target_list})."
            )

    @staticmethod
    def _evaluate_not_in(val: Any, target: Any, param: str) -> Tuple[RuleEvaluationStatus, str, str]:
        target_list = target if isinstance(target, list) else [target]
        normalized_targets = [str(t).strip().lower() for t in target_list]

        if isinstance(val, list):
            val_items = [str(x).strip().lower() for x in val]
            matched = [x for x in val_items if x in normalized_targets]
            if not matched:
                return (
                    RuleEvaluationStatus.PASSED,
                    f"Categories {val} are not in excluded list {target_list}.",
                    f"ವರ್ಗಗಳು ಹೊರಗಿಡಲಾದ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ."
                )
            else:
                return (
                    RuleEvaluationStatus.FAILED,
                    f"Categories {matched} are in excluded list {target_list}.",
                    f"ವರ್ಗ {matched} ಹೊರಗಿಡಲಾದ ಪಟ್ಟಿಯಲ್ಲಿದೆ ({target_list})."
                )

        normalized_val = str(val).strip().lower()
        if normalized_val not in normalized_targets:
            return (
                RuleEvaluationStatus.PASSED,
                f"Value '{val}' is not in excluded list {target_list}.",
                f"ಮೌಲ್ಯ '{val}' ಹೊರಗಿಡಲಾದ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ."
            )
        else:
            return (
                RuleEvaluationStatus.FAILED,
                f"Value '{val}' is in excluded list {target_list}.",
                f"ಮೌಲ್ಯ '{val}' ಹೊರಗಿಡಲಾದ ಪಟ್ಟಿಯಲ್ಲಿದೆ ({target_list})."
            )

    @staticmethod
    def _evaluate_contains(val: Any, target: Any, param: str) -> Tuple[RuleEvaluationStatus, str, str]:
        # If farmer value is a list (e.g. list of crop categories or crops)
        if isinstance(val, list):
            val_items = [str(x).strip().lower() for x in val]
            target_str = str(target).strip().lower()
            if target_str in val_items:
                return (
                    RuleEvaluationStatus.PASSED,
                    f"Found '{target}' within farmer's registered list {val}.",
                    f"ರೈತರ ವಿವರದಲ್ಲಿ '{target}' ಬೆಳೆ/ಗುಣಲಕ್ಷಣ ದಾಖಲಾಗಿದೆ."
                )
            else:
                return (
                    RuleEvaluationStatus.FAILED,
                    f"'{target}' is not present in farmer's list {val}.",
                    f"ರೈತರ ವಿವರದಲ್ಲಿ '{target}' ಬೆಳೆ/ಗುಣಲಕ್ಷಣ ಕಂಡುಬಂದಿಲ್ಲ."
                )

        # Substring search
        val_str = str(val).strip().lower()
        target_str = str(target).strip().lower()
        if target_str in val_str:
            return (
                RuleEvaluationStatus.PASSED,
                f"'{target}' is contained in '{val}'.",
                f"'{val}' ವಿವರದಲ್ಲಿ '{target}' ಸೇರಿದೆ."
            )
        else:
            return (
                RuleEvaluationStatus.FAILED,
                f"'{target}' is not contained in '{val}'.",
                f"'{val}' ವಿವರದಲ್ಲಿ '{target}' ಕಂಡುಬಂದಿಲ್ಲ."
            )

    @staticmethod
    def _evaluate_between(val: Any, target: Any, param: str) -> Tuple[RuleEvaluationStatus, str, str]:
        try:
            num_val = float(val)
            if isinstance(target, (list, tuple)) and len(target) == 2:
                low = float(target[0])
                high = float(target[1])
            else:
                return (
                    RuleEvaluationStatus.FAILED,
                    f"Invalid target range for BETWEEN: {target}.",
                    f"ಅಸಿಂಧು ಶ್ರೇಣಿ ಮೌಲ್ಯ."
                )
        except (ValueError, TypeError):
            return (
                RuleEvaluationStatus.FAILED,
                f"Cannot compare '{val}' in range {target}.",
                f"ಶ್ರೇಣಿ ಹೋಲಿಕೆ ಅಸಾಧ್ಯ."
            )

        if low <= num_val <= high:
            return (
                RuleEvaluationStatus.PASSED,
                f"Value {num_val} is within permissible range [{low}, {high}].",
                f"ಮೌಲ್ಯ {num_val} ನಿಗದಿತ ವ್ಯಾಪ್ತಿಯಲ್ಲಿದೆ [{low}, {high}]."
            )
        else:
            return (
                RuleEvaluationStatus.FAILED,
                f"Value {num_val} is outside permissible range [{low}, {high}].",
                f"ಮೌಲ್ಯ {num_val} ನಿಗದಿತ ವ್ಯಾಪ್ತಿಯಿಂದ ಹೊರಗಿದೆ [{low}, {high}]."
            )


# Type alias for type hints
Union_RuleOperator_or_str = Any
