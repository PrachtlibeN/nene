from typing import NoReturn

from fastapi import APIRouter, Query

from app.core.errors import API_ERROR_RESPONSES, AppError, ErrorCode
from app.schemas.contracts import EmptyRequest, EvaluationOut

router = APIRouter(tags=["evaluation"], responses=API_ERROR_RESPONSES)


def _not_implemented() -> NoReturn:
    raise AppError(
        ErrorCode.NOT_IMPLEMENTED,
        "This endpoint is not implemented yet.",
        501,
    )


@router.post(
    "/sessions/{session_id}/evaluation",
    response_model=EvaluationOut,
    status_code=202,
    operation_id="startEvaluation",
)
def start_evaluation(session_id: str, payload: EmptyRequest) -> EvaluationOut:
    _not_implemented()


@router.get(
    "/sessions/{session_id}/evaluation",
    response_model=EvaluationOut,
    operation_id="getEvaluation",
)
def get_evaluation(
    session_id: str,
    attempt: int | None = Query(default=None, ge=1),
) -> EvaluationOut:
    _not_implemented()
