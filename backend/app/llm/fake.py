from collections import deque

from app.core.config import LLMProfile, Settings
from app.llm.interfaces import LLMMessage, LLMResult


class FakeLLMClient:
    def __init__(
        self,
        settings: Settings,
        replies: list[str] | None = None,
    ) -> None:
        self.settings = settings
        self.replies = deque(replies or [])
        self.calls: list[tuple[LLMProfile, list[LLMMessage], bool]] = []

    def model_for(self, profile: LLMProfile) -> str:
        return self.settings.model_for(profile)

    def chat(
        self,
        profile: LLMProfile,
        messages: list[LLMMessage],
        *,
        json_mode: bool = False,
    ) -> LLMResult:
        self.calls.append((profile, list(messages), json_mode))
        if not self.replies:
            raise RuntimeError("FakeLLMClient has no scripted reply for this call")
        content = self.replies.popleft()
        return LLMResult(
            content=content,
            model=self.model_for(profile),
            profile=profile,
            prompt_tokens=None,
            completion_tokens=None,
            latency_ms=0,
        )
