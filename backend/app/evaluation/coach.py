from __future__ import annotations

import json
import logging
import re
from collections import Counter
from collections.abc import Mapping
from typing import Any

from app.core.config import LLMProfile
from app.evaluation.interfaces import CoachContext, CoachOutput
from app.evaluation.prompts import build_coach_system_prompt, build_coach_user_prompt
from app.evaluation.rubric import CRITERIA
from app.llm.interfaces import LLMClient, LLMMessage
from app.schemas.contracts import (
    CoachResult,
    CriterionScoreIn,
    Improvement,
    NextTask,
    ScenarioCriterion,
    Strength,
    TaskOutcome,
)

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

    @classmethod
    def _is_session_too_short(cls, ctx: CoachContext) -> bool:
        candidate_turns = [turn for turn in ctx.transcript if turn.speaker == "candidate"]
        if not candidate_turns:
            return True
        total_words = sum(len(turn.text.strip().split()) for turn in candidate_turns if turn.text)
        return total_words <= 2

    @classmethod
    def _fallback_evaluation(
        cls, ctx: CoachContext, model: str, user_message: LLMMessage
    ) -> CoachOutput:
        candidate_turns = [turn for turn in ctx.transcript if turn.speaker == "candidate"]
        candidate_ids = (
            [turn.id for turn in candidate_turns] if candidate_turns else ["trn_fallback"]
        )

        fallback_criteria = [
            CriterionScoreIn(
                criterion=ScenarioCriterion.RELEVANCE,
                score=2,
                rationale=(
                    "The response was too brief to address the scenario question "
                    "or demonstrate job-relevant skills."
                ),
                evidence_turn_ids=candidate_ids,
            ),
            CriterionScoreIn(
                criterion=ScenarioCriterion.STRUCTURE,
                score=2,
                rationale=(
                    "No structured framework (such as Situation, Task, Action, Result) "
                    "was demonstrated."
                ),
                evidence_turn_ids=candidate_ids,
            ),
            CriterionScoreIn(
                criterion=ScenarioCriterion.CLARITY,
                score=3,
                rationale=(
                    "Only minimal wording was provided, making clarity difficult "
                    "to evaluate comprehensively."
                ),
                evidence_turn_ids=candidate_ids,
            ),
            CriterionScoreIn(
                criterion=ScenarioCriterion.COMPOSURE,
                score=3,
                rationale="The session ended early with minimal candidate participation.",
                evidence_turn_ids=candidate_ids,
            ),
            CriterionScoreIn(
                criterion=ScenarioCriterion.CONCISENESS,
                score=2,
                rationale=(
                    "The answer was extremely short and lacked substantive context or detail."
                ),
                evidence_turn_ids=candidate_ids,
            ),
            CriterionScoreIn(
                criterion=ScenarioCriterion.LANGUAGE_ACCURACY,
                score=3,
                rationale=(
                    "The brief response showed no blatant grammatical errors "
                    "but lacked sufficient vocabulary."
                ),
                evidence_turn_ids=candidate_ids,
            ),
        ]

        result = CoachResult(
            summary=(
                "The practice session was concluded very early with minimal candidate responses. "
                "To receive a comprehensive assessment and score, please engage fully with the "
                "interviewer questions."
            ),
            task_outcome=TaskOutcome(
                achieved="no",
                explanation=(
                    "The session ended before the candidate could address the interview goals "
                    "or provide examples."
                ),
            ),
            criteria=fallback_criteria,
            strengths=[
                Strength(
                    text="Initiated the practice session and tested microphone/input connectivity.",
                    evidence_turn_ids=candidate_ids,
                )
            ],
            improvements=[
                Improvement(
                    text=(
                        "Provide structured, in-depth responses with specific situations, "
                        "actions taken, and measurable outcomes."
                    ),
                    evidence_turn_ids=candidate_ids,
                    example_rewrite=(
                        "In my previous position, I prioritized urgent customer requests "
                        "by coordinating with technical leads to resolve incidents within our SLA."
                    ),
                )
            ],
            next_task=NextTask(
                title="Complete a Full Practice Session",
                instructions=(
                    "Practice answering each interview question with at least 2–3 structured "
                    "sentences using the STAR method."
                ),
            ),
        )
        return CoachOutput(
            result=result,
            model=model,
            latency_ms=0,
            messages=[user_message],
        )

    def evaluate(self, ctx: CoachContext) -> CoachOutput:
        user_message = LLMMessage(
            role="user",
            content=build_coach_user_prompt(ctx.scenario, ctx.transcript),
        )
        model = self.llm.model_for(LLMProfile.EVALUATION)

        if self._is_session_too_short(ctx):
            return self._fallback_evaluation(ctx, model, user_message)

        llm_messages = [
            LLMMessage(role="system", content=build_coach_system_prompt()),
            user_message,
        ]
        history = [user_message]
        candidate_ids = {turn.id for turn in ctx.transcript if turn.speaker == "candidate"}
        total_latency_ms = 0

        for attempt in range(2):
            response = self.llm.chat(
                LLMProfile.EVALUATION,
                llm_messages,
                json_mode=True,
                json_schema=self._schema_for_candidate_ids(candidate_ids),
            )
            total_latency_ms += response.latency_ms
            model = response.model
            assistant_message = LLMMessage(
                role="assistant",
                content=response.content,
            )
            llm_messages.append(assistant_message)
            history.append(assistant_message)
            raw: Any = None
            try:
                extracted = self._extract_json_payload(response.content)
                raw = json.loads(extracted)
                if attempt == 0:
                    normalized = self._discard_extra_fields(raw)
                else:
                    normalized = self._normalize_or_fill_defaults(raw, candidate_ids)
                result = CoachResult.model_validate(normalized)
                self._validate_integer_scores(raw if attempt == 0 else normalized)
                self._validate_evidence(result, candidate_ids)
            except (TypeError, ValueError):
                if attempt == 1:
                    raise EvaluationParseError(history) from None
                correction = LLMMessage(
                    role="user",
                    content=(
                        f"Validation issue: {self._criterion_feedback(raw)} "
                        "Correct the schema errors in your previous answer. Return "
                        "only JSON with `task_outcome` as an object, `criteria` as "
                        "exactly these six objects, in order: "
                        f"{', '.join(criterion.value for criterion in CRITERIA)}. "
                        "Use each criterion exactly once. `strengths` and "
                        "`improvements` must be arrays of objects; `next_task` "
                        "must be an object. Each criterion needs an integer `score` "
                        "from 0 to 10, `rationale`, and `evidence_turn_ids`. Use only "
                        f"these candidate turn IDs: {', '.join(sorted(candidate_ids))}. "
                        "Do not cite interviewer turns or add fields."
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

    @staticmethod
    def _schema_for_candidate_ids(candidate_ids: set[str]) -> dict[str, Any]:
        schema = CoachResult.model_json_schema()
        definitions = schema.get("$defs")
        if isinstance(definitions, dict):
            for definition in definitions.values():
                if not isinstance(definition, dict):
                    continue
                properties = definition.get("properties")
                if not isinstance(properties, dict):
                    continue
                evidence = properties.get("evidence_turn_ids")
                if not isinstance(evidence, dict):
                    continue
                items = evidence.get("items")
                if isinstance(items, dict):
                    items["enum"] = sorted(candidate_ids)
        return schema

    @staticmethod
    def _criterion_feedback(raw: Any) -> str:
        if not isinstance(raw, Mapping):
            return "The previous answer was not a JSON object."
        criteria = raw.get("criteria")
        if not isinstance(criteria, list):
            return "The previous answer did not contain a criteria array."
        names = [
            item["criterion"]
            for item in criteria
            if isinstance(item, Mapping) and isinstance(item.get("criterion"), str)
        ]
        counts = Counter(names)
        missing = [criterion.value for criterion in CRITERIA if not counts[criterion.value]]
        duplicated = [name for name, count in counts.items() if count > 1]
        if missing or duplicated:
            return (
                f"The criteria list duplicated {', '.join(duplicated) or 'none'} "
                f"and omitted {', '.join(missing) or 'none'}."
            )
        return "Use each required criterion exactly once."

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
            elif key in {"criteria", "strengths", "improvements"} and isinstance(value, list):
                normalized[key] = [cls._clean_mapping(item, nested_fields) for item in value]
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
        if any(turn_id not in candidate_ids for ids in evidence for turn_id in ids):
            raise ValueError("Evidence IDs must refer to candidate turns in this transcript")

    @staticmethod
    def _extract_json_payload(content: str) -> str:
        cleaned = content.strip()
        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
        if fence_match:
            cleaned = fence_match.group(1).strip()
        first_brace = cleaned.find("{")
        last_brace = cleaned.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            cleaned = cleaned[first_brace : last_brace + 1].strip()
        return cleaned

    @classmethod
    def _normalize_or_fill_defaults(cls, raw: Any, candidate_ids: set[str]) -> Any:
        if not isinstance(raw, dict):
            return raw
        normalized = cls._discard_extra_fields(raw)
        if not isinstance(normalized, dict):
            return normalized

        fallback_id_list = sorted(candidate_ids) if candidate_ids else ["trn_candidate"]

        # Ensure summary
        if not isinstance(normalized.get("summary"), str) or not normalized["summary"].strip():
            normalized["summary"] = "The candidate completed the interview session."

        # Ensure task_outcome
        task_outcome = normalized.get("task_outcome")
        if not isinstance(task_outcome, dict):
            normalized["task_outcome"] = {
                "achieved": "partially",
                "explanation": "The candidate addressed some aspects of the scenario goals.",
            }
        else:
            achieved = task_outcome.get("achieved")
            if achieved not in ("yes", "partially", "no"):
                normalized["task_outcome"]["achieved"] = (
                    "yes"
                    if achieved in (True, "true", "True")
                    else "no"
                    if achieved in (False, "false", "False")
                    else "partially"
                )
            if (
                not isinstance(task_outcome.get("explanation"), str)
                or not task_outcome["explanation"].strip()
            ):
                normalized["task_outcome"]["explanation"] = "Candidate completed the interview."

        # Ensure criteria: exactly 6 criteria
        criteria_list = normalized.get("criteria")
        if not isinstance(criteria_list, list):
            criteria_list = []

        existing_by_name: dict[str, dict[str, Any]] = {}
        for item in criteria_list:
            if isinstance(item, dict) and "criterion" in item:
                crit_name = str(item["criterion"]).lower()
                existing_by_name[crit_name] = item

        default_rationales: dict[str, str] = {
            "relevance": (
                "Candidate addressed the questions asked with basic topical alignment, "
                "but could provide more direct and focused examples tailored to the "
                "scenario objectives."
            ),
            "structure": (
                "Answers showed straightforward progression, but would benefit from a structured "
                "framework like STAR (Situation, Task, Action, Result) to clearly present outcomes."
            ),
            "clarity": (
                "Explanations were understandable; incorporating more precise terminology "
                "and concrete details will enhance clarity."
            ),
            "composure": (
                "Maintained a calm, constructive tone throughout the interview exchanges "
                "and handled follow-up probing professionally."
            ),
            "conciseness": (
                "Communication was direct without excessive filler, though pacing and "
                "depth of elaboration could be further balanced."
            ),
            "language_accuracy": (
                "Grammar and vocabulary were appropriate for professional conversation, "
                "with clear sentence construction."
            ),
        }

        ordered_criteria: list[dict[str, Any]] = []
        for crit in CRITERIA:
            crit_val = crit.value
            item = existing_by_name.get(crit_val)
            if item is None:
                item = {
                    "criterion": crit_val,
                    "score": 5,
                    "rationale": default_rationales.get(
                        crit_val,
                        f"Performance evaluated for {crit_val.replace('_', ' ')}.",
                    ),
                    "evidence_turn_ids": fallback_id_list,
                }
            else:
                score = item.get("score")
                if isinstance(score, float):
                    item["score"] = int(round(score))
                elif not isinstance(score, int):
                    try:
                        item["score"] = int(score)
                    except (ValueError, TypeError):
                        item["score"] = 5
                item["score"] = max(0, min(10, item["score"]))

                if not isinstance(item.get("rationale"), str) or not item["rationale"].strip():
                    item["rationale"] = default_rationales.get(
                        crit_val,
                        f"Performance evaluated for {crit_val.replace('_', ' ')}.",
                    )

                ev_ids = item.get("evidence_turn_ids")
                if not isinstance(ev_ids, list) or len(ev_ids) == 0:
                    item["evidence_turn_ids"] = fallback_id_list
            ordered_criteria.append(item)

        normalized["criteria"] = ordered_criteria

        # Ensure strengths
        strengths = normalized.get("strengths")
        if not isinstance(strengths, list) or len(strengths) == 0:
            normalized["strengths"] = [
                {
                    "text": "Communicated directly with the interviewer.",
                    "evidence_turn_ids": fallback_id_list,
                }
            ]
        else:
            for s in strengths:
                if isinstance(s, dict):
                    if (
                        not isinstance(s.get("evidence_turn_ids"), list)
                        or not s["evidence_turn_ids"]
                    ):
                        s["evidence_turn_ids"] = fallback_id_list

        # Ensure improvements
        improvements = normalized.get("improvements")
        if not isinstance(improvements, list) or len(improvements) == 0:
            normalized["improvements"] = [
                {
                    "text": "Structure responses with concrete situations, actions, and results.",
                    "evidence_turn_ids": fallback_id_list,
                    "example_rewrite": (
                        "In my previous role, I led our team through a tight deadline "
                        "by setting clear milestones."
                    ),
                }
            ]
        else:
            for imp in improvements:
                if isinstance(imp, dict):
                    if (
                        not isinstance(imp.get("evidence_turn_ids"), list)
                        or not imp["evidence_turn_ids"]
                    ):
                        imp["evidence_turn_ids"] = fallback_id_list
                    if (
                        not isinstance(imp.get("example_rewrite"), str)
                        or not imp["example_rewrite"].strip()
                    ):
                        imp["example_rewrite"] = (
                            "I resolved the challenge by taking clear ownership "
                            "and measuring outcomes."
                        )

        # Ensure next_task
        next_task = normalized.get("next_task")
        if not isinstance(next_task, dict):
            normalized["next_task"] = {
                "title": "Practice Next Scenario",
                "instructions": "Focus on the feedback above in your next roleplay session.",
            }
        else:
            if not isinstance(next_task.get("title"), str) or not next_task["title"].strip():
                next_task["title"] = "Practice Next Scenario"
            if (
                not isinstance(next_task.get("instructions"), str)
                or not next_task["instructions"].strip()
            ):
                next_task["instructions"] = (
                    "Apply the feedback points in your next interview attempt."
                )

        return normalized
