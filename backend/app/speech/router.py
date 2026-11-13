from typing import Annotated, NoReturn

from fastapi import APIRouter, File, UploadFile

from app.core.errors import API_ERROR_RESPONSES, AppError, ErrorCode
from app.schemas.contracts import SpeechStatusOut, TranscriptionOut

router = APIRouter(
    prefix="/speech",
    tags=["speech"],
    responses=API_ERROR_RESPONSES,
)


def _not_implemented() -> NoReturn:
    raise AppError(
        ErrorCode.NOT_IMPLEMENTED,
        "This endpoint is not implemented yet.",
        501,
    )


@router.get("/status", response_model=SpeechStatusOut, operation_id="getSpeechStatus")
def get_speech_status() -> SpeechStatusOut:
    _not_implemented()


@router.post(
    "/transcribe",
    response_model=TranscriptionOut,
    operation_id="transcribeSpeech",
)
def transcribe_speech(audio: Annotated[UploadFile, File()]) -> TranscriptionOut:
    _not_implemented()
