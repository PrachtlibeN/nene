from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.schemas.contracts import CoachResult, ScenarioOut, TurnOut


@dataclass(frozen=True)
class CoachContext:
    evaluation_id: str
    conversation_id: str
    scenario: ScenarioOut
    transcript: list[TurnOut]


@dataclass(frozen=True)
class CoachOutput:
    result: CoachResult
    model: str
    latency_ms: int


class EvaluationCoach(Protocol):
    def evaluate(self, ctx: CoachContext) -> CoachOutput: ...
