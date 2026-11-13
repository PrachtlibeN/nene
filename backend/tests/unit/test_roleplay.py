from app.core.config import LLMProfile, Settings
from app.llm.fake import FakeLLMClient
from app.llm.interfaces import LLMMessage
from app.roleplay.agent import RoleplayAgent
from app.roleplay.interfaces import RoleplayContext
from app.roleplay.prompts import build_roleplay_prompt
from app.schemas.contracts import ScenarioOut


def make_scenario() -> ScenarioOut:
    return ScenarioOut.model_validate(
        {
            "id": "scn_test",
            "slug": "test-interview",
            "title": "Test Interview",
            "description": "A test scenario.",
            "language": "en",
            "difficulty": 2,
            "max_turns": 8,
            "estimated_minutes": 10,
            "definition": {
                "persona": {
                    "name": "Morgan Lee",
                    "role": "Engineering Manager",
                    "style": "Direct and curious",
                    "pressure_level": 2,
                },
                "task": {
                    "goal": "Describe a project you led.",
                    "success_criteria": ["Use a concrete example", "Explain the result"],
                },
                "evaluation_focus": ["relevance", "structure"],
            },
        }
    )


def make_context(history: list[LLMMessage] | None = None) -> RoleplayContext:
    return RoleplayContext(
        session_id="ses_test",
        conversation_id="cnv_rp_test",
        scenario=make_scenario(),
        history=history or [],
        turn_index=1,
        max_turns=8,
    )


def test_prompt_uses_scenario_and_sets_spoken_roleplay_boundaries() -> None:
    prompt = build_roleplay_prompt(make_scenario())

    assert "Morgan Lee" in prompt
    assert "Describe a project you led." in prompt
    assert "60 words or fewer" in prompt
    assert "Do not use Markdown, stage directions" in prompt
    assert "coaching, hints, feedback, or scores" in prompt
    assert "[END]" in prompt


def test_open_session_uses_roleplay_profile_and_returns_llm_metadata() -> None:
    settings = Settings(OLLAMA_MODEL="test-model")
    llm = FakeLLMClient(settings, replies=["Tell me about a project you led."])
    agent = RoleplayAgent(llm, settings)

    reply = agent.open_session(make_context())

    assert reply.text == "Tell me about a project you led."
    assert not reply.should_end
    assert reply.llm.model == settings.model_for(LLMProfile.ROLEPLAY)
    profile, messages, json_mode = llm.calls[0]
    assert profile is LLMProfile.ROLEPLAY
    assert len(messages) == 1
    assert messages[0].role == "system"
    assert not json_mode


def test_respond_trims_history_and_strips_end_marker_and_caps_reply() -> None:
    settings = Settings(OLLAMA_MODEL="test-model", roleplay_history_turns=2)
    reply_text = " ".join(["spoken"] * 61) + " [END]"
    llm = FakeLLMClient(settings, replies=[reply_text])
    agent = RoleplayAgent(llm, settings)
    history = [
        LLMMessage(role="assistant", content="old interviewer"),
        LLMMessage(role="user", content="old candidate"),
        LLMMessage(role="assistant", content="recent interviewer one"),
        LLMMessage(role="user", content="recent candidate one"),
        LLMMessage(role="assistant", content="recent interviewer two"),
        LLMMessage(role="user", content="recent candidate two"),
    ]

    reply = agent.respond(make_context(history), "Current answer")

    _, sent_messages, _ = llm.calls[0]
    assert [message.content for message in sent_messages[1:]] == [
        "recent interviewer one",
        "recent candidate one",
        "recent interviewer two",
        "recent candidate two",
        "Current answer",
    ]
    assert reply.should_end
    assert "[END]" not in reply.text
    assert len(reply.text.split()) == 60
