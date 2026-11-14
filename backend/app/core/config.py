from __future__ import annotations

import json
from enum import StrEnum
from pathlib import Path

from pydantic import BaseModel, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://nene.siegpracht49.workers.dev",
]
DEFAULT_CORS_ORIGIN_REGEX = r"^https://([a-zA-Z0-9_-]+\.)*(workers\.dev|pages\.dev)$"


class LLMProfile(StrEnum):
    ROLEPLAY = "roleplay"
    EVALUATION = "evaluation"


class LLMProvider(StrEnum):
    OLLAMA = "ollama"
    OPENAI_COMPATIBLE = "openai_compatible"


class ProfileConfig(BaseModel):
    model: str
    temperature: float
    max_tokens: int
    num_ctx: int
    timeout_s: float


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPOSITORY_ROOT / ".env",
        env_file_encoding="utf-8",
        hide_input_in_errors=True,
        populate_by_name=True,
        extra="ignore",
    )

    echorole_db_url: str = "sqlite:///./data/echorole.db"
    cors_origins: list[str] | str = Field(
        default_factory=lambda: list(DEFAULT_CORS_ORIGINS),
        validation_alias="CORS_ORIGINS",
    )
    cors_origin_regex: str | None = Field(
        default=DEFAULT_CORS_ORIGIN_REGEX,
        validation_alias="CORS_ORIGIN_REGEX",
    )
    llm_provider: LLMProvider = Field(
        default=LLMProvider.OLLAMA,
        validation_alias="LLM_PROVIDER",
    )
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str | None = Field(default=None, validation_alias="OLLAMA_MODEL")
    ollama_model_roleplay: str | None = Field(
        default=None, validation_alias="OLLAMA_MODEL_ROLEPLAY"
    )
    ollama_model_evaluation: str | None = Field(
        default=None, validation_alias="OLLAMA_MODEL_EVALUATION"
    )
    openai_base_url: str = Field(
        default="https://api.openai.com/v1",
        validation_alias="OPENAI_BASE_URL",
    )
    openai_api_key: SecretStr = Field(
        default=SecretStr(""),
        validation_alias="OPENAI_API_KEY",
    )
    openai_model: str | None = Field(default=None, validation_alias="OPENAI_MODEL")
    ollama_num_ctx: int = Field(default=4096, ge=1)
    llm_timeout_s: float = Field(default=60, gt=0)
    roleplay_temperature: float = Field(default=0.8, ge=0, le=2)
    roleplay_max_tokens: int = Field(default=1024, ge=1)
    evaluation_temperature: float = Field(default=0.2, ge=0, le=2)
    evaluation_max_tokens: int = Field(default=1500, ge=1)
    roleplay_history_turns: int = Field(default=12, ge=1)
    whisper_model: str = "unconfigured"
    whisper_device: str = "auto"
    whisper_compute_type: str = "default"
    max_audio_seconds: int = Field(default=120, ge=1)
    max_audio_mb: int = Field(default=10, ge=1)
    session_idle_timeout_minutes: int = Field(default=60, ge=1)

    @field_validator("ollama_model", "openai_model")
    @classmethod
    def normalize_model(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: object) -> list[str]:
        if isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        if isinstance(v, str):
            val = v.strip()
            if not val:
                return []
            if (val.startswith("[") and val.endswith("]")) or (
                val.startswith("(") and val.endswith(")")
            ):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed if str(x).strip()]
                except Exception:
                    pass
                inner = val[1:-1].strip()
                if inner:
                    return [
                        x.strip().strip("'\"")
                        for x in inner.split(",")
                        if x.strip().strip("'\"")
                    ]
                return []
            return [x.strip() for x in val.split(",") if x.strip()]
        return []

    @field_validator("cors_origin_regex", mode="before")
    @classmethod
    def assemble_cors_origin_regex(cls, v: object) -> str | None:
        if v is None:
            return None
        val = str(v).strip()
        return val if val else None

    @model_validator(mode="after")
    def require_active_provider_model(self) -> Settings:
        if self.llm_provider is LLMProvider.OLLAMA and not self.ollama_model:
            raise ValueError("OLLAMA_MODEL must be set to a non-empty model name")
        if self.llm_provider is LLMProvider.OPENAI_COMPATIBLE and not self.openai_model:
            raise ValueError("OPENAI_MODEL must be set to a non-empty model name")
        return self

    def model_for(self, profile: LLMProfile) -> str:
        if self.llm_provider is LLMProvider.OPENAI_COMPATIBLE:
            return self.openai_model or ""
        if profile is LLMProfile.ROLEPLAY and self.ollama_model_roleplay:
            return self.ollama_model_roleplay
        if profile is LLMProfile.EVALUATION and self.ollama_model_evaluation:
            return self.ollama_model_evaluation
        return self.ollama_model or ""

    def profile_config(self, profile: LLMProfile) -> ProfileConfig:
        if profile is LLMProfile.ROLEPLAY:
            return ProfileConfig(
                model=self.model_for(profile),
                temperature=self.roleplay_temperature,
                max_tokens=self.roleplay_max_tokens,
                num_ctx=self.ollama_num_ctx,
                timeout_s=self.llm_timeout_s,
            )
        return ProfileConfig(
            model=self.model_for(profile),
            temperature=self.evaluation_temperature,
            max_tokens=self.evaluation_max_tokens,
            num_ctx=self.ollama_num_ctx,
            timeout_s=self.llm_timeout_s,
        )


def get_settings() -> Settings:
    return Settings()
