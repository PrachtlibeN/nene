import pytest
from pydantic import ValidationError

from app.core.config import LLMProfile, LLMProvider, Settings


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


def test_openai_compatible_provider_does_not_require_ollama_model() -> None:
    settings = Settings(
        _env_file=None,
        LLM_PROVIDER="openai_compatible",
        OPENAI_MODEL="cloud-test-model",
    )

    assert settings.llm_provider is LLMProvider.OPENAI_COMPATIBLE
    assert settings.openai_api_key.get_secret_value() == ""
    assert settings.model_for(LLMProfile.ROLEPLAY) == "cloud-test-model"
    assert settings.model_for(LLMProfile.EVALUATION) == "cloud-test-model"


def test_openai_compatible_provider_requires_a_model() -> None:
    with pytest.raises(ValidationError, match="OPENAI_MODEL must be set"):
        Settings(_env_file=None, LLM_PROVIDER="openai_compatible")


def test_openai_api_key_is_masked_in_settings_representation() -> None:
    settings = Settings(_env_file=None, OPENAI_API_KEY="test-token")

    assert "test-token" not in repr(settings)


def test_cors_origins_defaults_include_cloudflare_and_local() -> None:
    settings = Settings(_env_file=None, OLLAMA_MODEL="test-model")
    assert "https://nene.siegpracht49.workers.dev" in settings.cors_origins
    assert "http://localhost:5173" in settings.cors_origins
    assert settings.cors_origin_regex is not None


@pytest.mark.parametrize(
    "raw_input,expected",
    [
        ("https://a.com,https://b.com", ["https://a.com", "https://b.com"]),
        ("https://single.com", ["https://single.com"]),
        ('["https://json1.com", "https://json2.com"]', ["https://json1.com", "https://json2.com"]),
        ("['https://single-quote.com']", ["https://single-quote.com"]),
        ('["*"]', ["*"]),
        ("*", ["*"]),
        ("", []),
    ],
)
def test_cors_origins_parsing_formats(raw_input: str, expected: list[str]) -> None:
    settings = Settings(
        _env_file=None,
        OLLAMA_MODEL="test-model",
        CORS_ORIGINS=raw_input,
    )
    assert settings.cors_origins == expected
