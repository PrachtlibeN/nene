from fastapi import APIRouter, Request

from app.core.config import LLMProfile, Settings
from app.core.errors import API_ERROR_RESPONSES
from app.schemas.contracts import (
    HealthComponent,
    HealthComponents,
    HealthOut,
    LLMHealthComponent,
    STTHealthComponent,
)

router = APIRouter(responses=API_ERROR_RESPONSES)


@router.get("/health", response_model=HealthOut, operation_id="getHealth")
def get_health(request: Request) -> HealthOut:
    settings: Settings = request.app.state.settings
    return HealthOut(
        status="degraded",
        version="0.1.0",
        contract_version="0.3.0",
        components=HealthComponents(
            database=HealthComponent(status="ok"),
            llm=LLMHealthComponent(
                status="loading",
                models={
                    "roleplay": settings.model_for(LLMProfile.ROLEPLAY),
                    "evaluation": settings.model_for(LLMProfile.EVALUATION),
                },
                detail="LLM client is not initialized in Phase 0.",
            ),
            stt=STTHealthComponent(
                status="loading",
                model=settings.whisper_model,
                detail="Speech engine is not initialized in Phase 0.",
            ),
        ),
    )
