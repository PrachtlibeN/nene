from __future__ import annotations

import re

from app.core.config import LLMProfile, Settings, get_settings
from app.core.errors import AppError, ErrorCode
from app.llm.interfaces import LLMClient, LLMMessage
from app.roleplay.interfaces import LLMMeta, RoleplayContext, RoleplayReply
from app.roleplay.prompts import build_roleplay_prompt

_END_MARKER = re.compile(r"\[END\]", re.IGNORECASE)


class RoleplayAgent:
    def __init__(self, llm: LLMClient, settings: Settings | None = None) -> None:
        self._llm = llm
        self._settings = settings or get_settings()

    def open_session(self, ctx: RoleplayContext) -> RoleplayReply:
        result = self._llm.chat(
            LLMProfile.ROLEPLAY,
            [LLMMessage(role="system", content=build_roleplay_prompt(ctx.scenario))],
        )
        return self._reply(
            result.content,
            result.model,
            result.latency_ms,
            result.prompt_tokens,
            result.completion_tokens,
        )

    def respond(self, ctx: RoleplayContext, candidate_text: str) -> RoleplayReply:
        history_limit = self._settings.roleplay_history_turns * 2
        history = ctx.history[-history_limit:]
        messages = [
            LLMMessage(role="system", content=build_roleplay_prompt(ctx.scenario)),
            *history,
            LLMMessage(role="user", content=candidate_text),
        ]
        result = self._llm.chat(LLMProfile.ROLEPLAY, messages)
        return self._reply(
            result.content,
            result.model,
            result.latency_ms,
            result.prompt_tokens,
            result.completion_tokens,
        )

    @staticmethod
    def _reply(
        content: str,
        model: str,
        latency_ms: int,
        prompt_tokens: int | None,
        completion_tokens: int | None,
    ) -> RoleplayReply:
        should_end = _END_MARKER.search(content) is not None
        text = " ".join(_END_MARKER.sub(" ", content).split())
        text = " ".join(text.split()[:60])
        if not text:
            raise AppError(
                ErrorCode.LLM_BAD_OUTPUT,
                "Roleplay model returned an empty reply.",
                502,
            )
        return RoleplayReply(
            text=text,
            should_end=should_end,
            llm=LLMMeta(
                model=model,
                latency_ms=latency_ms,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            ),
        )
