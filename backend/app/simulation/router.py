from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated, cast

from fastapi import APIRouter, Depends, FastAPI, Query, Request
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings
from app.core.db import build_engine
from app.core.errors import API_ERROR_RESPONSES
from app.roleplay.interfaces import RoleplayAgent, StubRoleplayAgent
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
from app.simulation.service import SimulationService


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    settings = cast(Settings, application.state.settings)
    service = getattr(application.state, "simulation_service", None)
    engine = None
    if service is None:
        engine = build_engine(settings.echorole_db_url)
        factory = sessionmaker(bind=engine, expire_on_commit=False)
        agent = cast(
            RoleplayAgent,
            getattr(application.state, "roleplay_agent", StubRoleplayAgent()),
        )
        service = SimulationService(
            session_factory=factory,
            settings=settings,
            agent=agent,
            clock=getattr(application.state, "simulation_clock", None),
        )
        application.state.simulation_service = service
    try:
        service.seed_scenarios()
        service.sweep_idle_sessions()
        yield
    finally:
        if engine is not None:
            engine.dispose()
            application.state.simulation_service = None


router = APIRouter(tags=["simulation"], responses=API_ERROR_RESPONSES, lifespan=lifespan)


def _service(request: Request) -> SimulationService:
    return cast(SimulationService, request.app.state.simulation_service)


ServiceDep = Annotated[SimulationService, Depends(_service)]


@router.get("/scenarios", response_model=ScenarioListOut, operation_id="listScenarios")
def list_scenarios(service: ServiceDep) -> ScenarioListOut:
    return service.list_scenarios()


@router.get(
    "/scenarios/{scenario_id}",
    response_model=ScenarioOut,
    operation_id="getScenario",
)
def get_scenario(
    scenario_id: str,
    service: ServiceDep,
) -> ScenarioOut:
    return service.get_scenario(scenario_id)


@router.post(
    "/sessions",
    response_model=SessionOut,
    status_code=201,
    operation_id="createSession",
)
def create_session(
    payload: SessionCreateIn,
    service: ServiceDep,
) -> SessionOut:
    return service.create_session(payload.scenario_id)


@router.get("/sessions", response_model=SessionListOut, operation_id="listSessions")
def list_sessions(
    service: ServiceDep,
    status: SessionStatus | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> SessionListOut:
    return service.list_sessions(status, limit, offset)


@router.get(
    "/sessions/{session_id}",
    response_model=SessionOut,
    operation_id="getSession",
)
def get_session(
    session_id: str,
    service: ServiceDep,
) -> SessionOut:
    return service.get_session(session_id)


@router.post(
    "/sessions/{session_id}/start",
    response_model=StartSessionOut,
    operation_id="startSession",
)
def start_session(
    session_id: str,
    payload: EmptyRequest,
    service: ServiceDep,
) -> StartSessionOut:
    del payload
    return service.start_session(session_id)


@router.post(
    "/sessions/{session_id}/turns",
    response_model=TurnSubmitOut,
    operation_id="submitTurn",
)
def submit_turn(
    session_id: str,
    payload: TurnCreateIn,
    service: ServiceDep,
) -> TurnSubmitOut:
    return service.submit_turn(session_id, payload)


@router.get(
    "/sessions/{session_id}/turns",
    response_model=TurnListOut,
    operation_id="listTurns",
)
def list_turns(
    session_id: str,
    service: ServiceDep,
) -> TurnListOut:
    return service.list_turns(session_id)


@router.post(
    "/sessions/{session_id}/end",
    response_model=SessionOut,
    operation_id="endSession",
)
def end_session(
    session_id: str,
    payload: EmptyRequest,
    service: ServiceDep,
) -> SessionOut:
    del payload
    return service.end_session(session_id)
