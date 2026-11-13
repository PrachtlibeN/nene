from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

from app.api.health import router as health_router
from app.core.config import Settings
from app.core.errors import register_exception_handlers
from app.core.ids import new_request_id
from app.core.logging import configure_logging
from app.evaluation.router import router as evaluation_router
from app.simulation.router import router as simulation_router
from app.speech.router import router as speech_router


def create_app(settings: Settings | None = None) -> FastAPI:
    configure_logging()
    app_settings = settings or Settings()
    application = FastAPI(
        title="Nene API",
        version="0.1.0",
        openapi_url="/openapi.json",
        docs_url="/docs",
    )
    application.state.settings = app_settings
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    register_exception_handlers(application)

    @application.middleware("http")
    async def request_id_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        supplied_id = request.headers.get("X-Request-ID", "").strip()
        request_id = supplied_id if supplied_id and len(supplied_id) <= 128 else new_request_id()
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    application.include_router(health_router, prefix="/api/v1")
    application.include_router(simulation_router, prefix="/api/v1")
    application.include_router(speech_router, prefix="/api/v1")
    application.include_router(evaluation_router, prefix="/api/v1")
    return application


app = create_app()
