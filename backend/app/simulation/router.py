from typing import NoReturn

from fastapi import APIRouter, Query

from app.core.errors import API_ERROR_RESPONSES, AppError, ErrorCode
from app.schemas.contracts import (
    EmptyRequest,
    ScenarioListOut,
    ScenarioOut,
    SessionCreateIn,
    SessionListOut,
    SessionOut,
    SessionStatus,
    StartSessionOut,
    TurnCreateIn,
    TurnListOut,
    TurnSubmitOut,
)

router = APIRouter(tags=["simulation"], responses=API_ERROR_RESPONSES)


def _not_implemented() -> NoReturn:
    raise AppError(
        ErrorCode.NOT_IMPLEMENTED,
        "This endpoint is not implemented yet.",
        501,
    )


@router.get("/scenarios", response_model=ScenarioListOut, operation_id="listScenarios")
def list_scenarios() -> ScenarioListOut:
    _not_implemented()


@router.get(
    "/scenarios/{scenario_id}",
    response_model=ScenarioOut,
    operation_id="getScenario",
)
def get_scenario(scenario_id: str) -> ScenarioOut:
    _not_implemented()


@router.post(
    "/sessions",
    response_model=SessionOut,
    status_code=201,
    operation_id="createSession",
)
def create_session(payload: SessionCreateIn) -> SessionOut:
    _not_implemented()


@router.get("/sessions", response_model=SessionListOut, operation_id="listSessions")
def list_sessions(
    status: SessionStatus | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> SessionListOut:
    _not_implemented()


@router.get(
    "/sessions/{session_id}",
    response_model=SessionOut,
    operation_id="getSession",
)
def get_session(session_id: str) -> SessionOut:
    _not_implemented()


@router.post(
    "/sessions/{session_id}/start",
    response_model=StartSessionOut,
    operation_id="startSession",
)
def start_session(session_id: str, payload: EmptyRequest) -> StartSessionOut:
    _not_implemented()


@router.post(
    "/sessions/{session_id}/turns",
    response_model=TurnSubmitOut,
    operation_id="submitTurn",
)
def submit_turn(session_id: str, payload: TurnCreateIn) -> TurnSubmitOut:
    _not_implemented()


@router.get(
    "/sessions/{session_id}/turns",
    response_model=TurnListOut,
    operation_id="listTurns",
)
def list_turns(session_id: str) -> TurnListOut:
    _not_implemented()


@router.post(
    "/sessions/{session_id}/end",
    response_model=SessionOut,
    operation_id="endSession",
)
def end_session(session_id: str, payload: EmptyRequest) -> SessionOut:
    _not_implemented()
