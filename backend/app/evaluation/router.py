from typing import Annotated, cast

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.config import LLMProfile, Settings
from app.core.db import get_db
from app.core.errors import API_ERROR_RESPONSES, AppError, ErrorCode
from app.evaluation.interfaces import Clock, SimulationService, utc_now
from app.evaluation.service import EvaluationService
from app.llm.interfaces import LLMClient, LLMMessage, LLMResult
from app.schemas.contracts import EmptyRequest, EvaluationOut


class _UnconfiguredLLMClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def model_for(self, profile: LLMProfile) -> str:
        return self.settings.model_for(profile)

    def chat(
        self,
        profile: LLMProfile,
        messages: list[LLMMessage],
        *,
        json_mode: bool = False,
    ) -> LLMResult:
        raise AppError(
            ErrorCode.LLM_UNAVAILABLE,
            "No LLM client is configured for this application.",
            503,
        )


def get_llm_client(request: Request) -> LLMClient:
    client = getattr(request.app.state, "llm_client", None)
    if client is not None:
        return cast(LLMClient, client)
    return _UnconfiguredLLMClient(request.app.state.settings)


def get_evaluation_clock(request: Request) -> Clock:
    return getattr(request.app.state, "evaluation_clock", utc_now)


def get_simulation_service(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> SimulationService:
    service = getattr(request.app.state, "simulation_service", None)
    if service is not None:
        return cast(SimulationService, service)
    clock = getattr(request.app.state, "evaluation_clock", utc_now)
    from app.simulation.service import SimulationService as DefaultSimulationService
    from sqlalchemy.orm import sessionmaker

    session_factory = sessionmaker(bind=db.get_bind(), expire_on_commit=False)
    return DefaultSimulationService(
        session_factory=session_factory,
        settings=request.app.state.settings,
        clock=clock,
    )


def get_evaluation_service(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    llm: Annotated[LLMClient, Depends(get_llm_client)],
    clock: Annotated[Clock, Depends(get_evaluation_clock)],
    simulation: Annotated[SimulationService, Depends(get_simulation_service)],
) -> EvaluationService:
    return EvaluationService(
        db=db,
        settings=request.app.state.settings,
        llm=llm,
        simulation=simulation,
        clock=clock,
    )


router = APIRouter(tags=["evaluation"], responses=API_ERROR_RESPONSES)


@router.post(
    "/sessions/{session_id}/evaluation",
    response_model=EvaluationOut,
    status_code=202,
    operation_id="startEvaluation",
)
def start_evaluation(
    session_id: str,
    payload: EmptyRequest,
    background_tasks: BackgroundTasks,
    service: Annotated[EvaluationService, Depends(get_evaluation_service)],
) -> EvaluationOut:
    result = service.start_evaluation(session_id)
    background_tasks.add_task(service.run_evaluation, result.id)
    return result


@router.get(
    "/sessions/{session_id}/evaluation",
    response_model=EvaluationOut,
    operation_id="getEvaluation",
)
def get_evaluation(
    session_id: str,
    service: Annotated[EvaluationService, Depends(get_evaluation_service)],
    attempt: Annotated[int | None, Query(ge=1)] = None,
) -> EvaluationOut:
    return service.get_evaluation(session_id, attempt)
