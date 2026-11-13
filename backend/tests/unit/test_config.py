import pytest
from pydantic import ValidationError

from app.core.config import LLMProfile, Settings


def test_model_config_uses_profile_override_and_fallback() -> None:
    settings = Settings(
        OLLAMA_MODEL="base-model",
        ollama_model_roleplay="roleplay-model",
    )
    assert settings.model_for(LLMProfile.ROLEPLAY) == "roleplay-model"
    assert settings.model_for(LLMProfile.EVALUATION) == "base-model"


def test_missing_required_model_names_environment_variable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OLLAMA_MODEL", raising=False)
    with pytest.raises(ValidationError) as error:
        Settings(_env_file=None)
    assert "OLLAMA_MODEL" in str(error.value)


def test_blank_required_model_is_rejected() -> None:
    with pytest.raises(ValidationError, match="OLLAMA_MODEL must be set"):
        Settings(OLLAMA_MODEL="  ")
