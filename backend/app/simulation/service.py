from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import AppError, ErrorCode
from app.evaluation.interfaces import CoachScenario, Transcript
from app.models.entities import Scenario, Turn
from app.models.entities import Session as InterviewSession
from app.schemas.contracts import (
    ScenarioDefinition,
    SessionStatus,
    SpeechMeta,
    TurnOut,
    TurnSource,
)

Clock = Callable[[], datetime]


def utc_now() -> datetime:
    return datetime.now(UTC)


def format_timestamp(value: datetime) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Clock must return a timezone-aware datetime")
    return value.astimezone(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


class SimulationService:
    def __init__(
        self,
        db: Session,
        settings: Settings,
        clock: Clock | None = None,
    ) -> None:
        self.db = db
        self.settings = settings
        self.clock = clock or utc_now

    def assert_session_ended(self, session_id: str) -> None:
        self._expire_idle_session(session_id)
        session = self.db.get(InterviewSession, session_id)
        if session is None:
            raise AppError(
                ErrorCode.SESSION_NOT_FOUND,
                f"Session {session_id} was not found.",
                404,
                {"session_id": session_id},
            )
        if session.status != SessionStatus.ENDED.value:
            raise AppError(
                ErrorCode.SESSION_NOT_ENDED,
                f"Session {session_id} has not ended.",
                409,
                {"session_id": session_id, "status": session.status},
            )

    def get_transcript(self, session_id: str) -> Transcript:
        self._expire_idle_session(session_id)
        session = self.db.get(InterviewSession, session_id)
        if session is None:
            raise AppError(
                ErrorCode.SESSION_NOT_FOUND,
                f"Session {session_id} was not found.",
                404,
                {"session_id": session_id},
            )
        scenario = self.db.get(Scenario, session.scenario_id)
        if scenario is None:
            raise RuntimeError(f"Session {session_id} references a missing scenario")
        definition = ScenarioDefinition.model_validate_json(scenario.definition_json)
        turns = list(
            self.db.scalars(
                select(Turn)
                .where(Turn.session_id == session_id)
                .order_by(Turn.idx)
            ).all()
        )
        return Transcript(
            scenario=CoachScenario(
                task_goal=definition.task.goal,
                success_criteria=definition.task.success_criteria,
                evaluation_focus=definition.evaluation_focus,
            ),
            turns=[
                TurnOut(
                    id=turn.id,
                    session_id=turn.session_id,
                    idx=turn.idx,
                    speaker=turn.speaker,
                    text=turn.text,
                    source=TurnSource(turn.source),
                    speech_meta=(
                        SpeechMeta.model_validate_json(turn.speech_meta_json)
                        if turn.speech_meta_json is not None
                        else None
                    ),
                    created_at=datetime.fromisoformat(
                        turn.created_at.replace("Z", "+00:00")
                    ),
                )
                for turn in turns
            ],
        )

    def _expire_idle_session(self, session_id: str) -> None:
        now = self.clock()
        cutoff = format_timestamp(
            now - timedelta(minutes=self.settings.session_idle_timeout_minutes)
        )
        self.db.execute(
            update(InterviewSession)
            .where(
                InterviewSession.id == session_id,
                InterviewSession.status == SessionStatus.ACTIVE.value,
                InterviewSession.in_flight == 0,
                InterviewSession.last_activity_at < cutoff,
            )
            .values(
                status=SessionStatus.ABANDONED.value,
                end_reason="timeout",
                ended_at=InterviewSession.last_activity_at,
            )
            .execution_options(synchronize_session="fetch")
        )
        self.db.commit()
