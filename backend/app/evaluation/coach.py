from __future__ import annotations

import json
import logging
from collections.abc import Mapping
from typing import Any

from app.core.config import LLMProfile
from app.evaluation.interfaces import CoachContext, CoachOutput
from app.evaluation.prompts import build_coach_system_prompt, build_coach_user_prompt
from app.llm.interfaces import LLMClient, LLMMessage
from app.schemas.contracts import CoachResult

LOGGER = logging.getLogger(__name__)
_TOP_LEVEL_FIELDS = {
    "summary",
    "task_outcome",
    "criteria",
    "strengths",
    "improvements",
    "next_task",
}
_NESTED_FIELDS: dict[str, set[str]] = {
    "task_outcome": {"achieved", "explanation"},
    "criteria": {"criterion", "score", "rationale", "evidence_turn_ids"},
    "strengths": {"text", "evidence_turn_ids"},
    "improvements": {"text", "evidence_turn_ids", "example_rewrite"},
    "next_task": {"title", "instructions"},
}


class EvaluationParseError(ValueError):
    def __init__(self, messages: list[LLMMessage]) -> None:
        super().__init__("The coach returned invalid output after one retry.")
        self.messages = messages


class EvaluationCoach:
    def __init__(self, llm: LLMClient) -> None:
        self.llm = llm

    def evaluate(self, ctx: CoachContext) -> CoachOutput:
        user_message = LLMMessage(
            role="user",
            content=build_coach_user_prompt(ctx.scenario, ctx.transcript),
        )
        llm_messages = [
            LLMMessage(role="system", content=build_coach_system_prompt()),
            user_message,
        ]
        history = [user_message]
        candidate_ids = {
            turn.id for turn in ctx.transcript if turn.speaker == "candidate"
        }
        total_latency_ms = 0
        model = self.llm.model_for(LLMProfile.EVALUATION)

        for attempt in range(2):
            response = self.llm.chat(
                LLMProfile.EVALUATION,
                llm_messages,
                json_mode=True,
            )
            total_latency_ms += response.latency_ms
            model = response.model
            assistant_message = LLMMessage(
                role="assistant",
                content=response.content,
            )
            llm_messages.append(assistant_message)
            history.append(assistant_message)
            try:
                raw = json.loads(response.content)
                normalized = self._discard_extra_fields(raw)
                result = CoachResult.model_validate(normalized)
                self._validate_integer_scores(raw)
                self._validate_evidence(result, candidate_ids)
            except (TypeError, ValueError):
                if attempt == 1:
                    raise EvaluationParseError(history) from None
                correction = LLMMessage(
                    role="user",
                    content=(
                        "Correct the validation issues in your previous answer. "
                        "Return only a valid CoachResult JSON object with six unique "
                        "criteria, integer scores from 0 to 10, and evidence IDs "
                        "from candidate turns in the transcript."
                    ),
                )
                llm_messages.append(correction)
                history.append(correction)
                continue
            return CoachOutput(
                result=result,
                model=model,
                latency_ms=total_latency_ms,
                messages=history,
            )
        raise RuntimeError("Coach retry loop exited without a result")

    @classmethod
    def _discard_extra_fields(cls, raw: Any) -> Any:
        if not isinstance(raw, dict):
            return raw
        extra_fields = set(raw) - _TOP_LEVEL_FIELDS
        cls._log_discarded(extra_fields)
        normalized: dict[str, Any] = {}
        for key in _TOP_LEVEL_FIELDS & set(raw):
            value = raw[key]
            nested_fields = _NESTED_FIELDS.get(key)
            if nested_fields is None:
                normalized[key] = value
            elif key in {"criteria", "strengths", "improvements"} and isinstance(
                value, list
            ):
                normalized[key] = [
                    cls._clean_mapping(item, nested_fields) for item in value
                ]
            else:
                normalized[key] = cls._clean_mapping(value, nested_fields)
        return normalized

    @classmethod
    def _clean_mapping(cls, value: Any, allowed: set[str]) -> Any:
        if not isinstance(value, dict):
            return value
        cls._log_discarded(set(value) - allowed)
        return {key: item for key, item in value.items() if key in allowed}

    @staticmethod
    def _log_discarded(fields: set[str]) -> None:
        if fields:
            LOGGER.warning("Discarded unrecognized CoachResult fields: %s", sorted(fields))

    @staticmethod
    def _validate_integer_scores(raw: Any) -> None:
        if not isinstance(raw, Mapping):
            return
        criteria = raw.get("criteria")
        if not isinstance(criteria, list):
            return
        for item in criteria:
            if isinstance(item, Mapping) and "score" in item:
                score = item["score"]
                if type(score) is not int or not 0 <= score <= 10:
                    raise ValueError("Criterion scores must be integers from 0 to 10")

    @staticmethod
    def _validate_evidence(
        result: CoachResult,
        candidate_ids: set[str],
    ) -> None:
        evidence = [
            *(item.evidence_turn_ids for item in result.criteria),
            *(item.evidence_turn_ids for item in result.strengths),
            *(item.evidence_turn_ids for item in result.improvements),
        ]
        if any(
            turn_id not in candidate_ids
            for ids in evidence
            for turn_id in ids
        ):
            raise ValueError("Evidence IDs must refer to candidate turns in this transcript")
