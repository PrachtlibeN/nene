from __future__ import annotations

from enum import StrEnum
from pathlib import Path

from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


class LLMProfile(StrEnum):
    ROLEPLAY = "roleplay"
    EVALUATION = "evaluation"


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
        populate_by_name=True,
        extra="ignore",
    )

    echorole_db_url: str = "sqlite:///./data/echorole.db"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = Field(validation_alias="OLLAMA_MODEL")
    ollama_model_roleplay: str | None = Field(
        default=None, validation_alias="OLLAMA_MODEL_ROLEPLAY"
    )
    ollama_model_evaluation: str | None = Field(
        default=None, validation_alias="OLLAMA_MODEL_EVALUATION"
    )
    ollama_num_ctx: int = Field(default=4096, ge=1)
    llm_timeout_s: float = Field(default=60, gt=0)
    roleplay_temperature: float = Field(default=0.8, ge=0, le=2)
    roleplay_max_tokens: int = Field(default=160, ge=1)
    evaluation_temperature: float = Field(default=0.2, ge=0, le=2)
    evaluation_max_tokens: int = Field(default=1500, ge=1)
    roleplay_history_turns: int = Field(default=12, ge=1)
    whisper_model: str = "unconfigured"
    whisper_device: str = "auto"
    whisper_compute_type: str = "default"
    max_audio_seconds: int = Field(default=120, ge=1)
    max_audio_mb: int = Field(default=10, ge=1)
    session_idle_timeout_minutes: int = Field(default=60, ge=1)

    @field_validator("ollama_model")
    @classmethod
    def require_nonempty_model(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("OLLAMA_MODEL must be set to a non-empty model name")
        return normalized

    def model_for(self, profile: LLMProfile) -> str:
        if profile is LLMProfile.ROLEPLAY and self.ollama_model_roleplay:
            return self.ollama_model_roleplay
        if profile is LLMProfile.EVALUATION and self.ollama_model_evaluation:
            return self.ollama_model_evaluation
        return self.ollama_model

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
