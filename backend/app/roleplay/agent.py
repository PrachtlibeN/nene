from __future__ import annotations

import re

from app.core.config import LLMProfile, Settings, get_settings
from app.core.errors import AppError, ErrorCode
from app.llm.interfaces import LLMClient, LLMMessage
from app.roleplay.interfaces import LLMMeta, RoleplayContext, RoleplayReply
from app.roleplay.prompts import build_roleplay_prompt
from app.schemas.contracts import ScenarioPanelPersona

_END_MARKER = re.compile(r"\[END\]", re.IGNORECASE)
_SPEAKER_BRACKET_RE = re.compile(
    r"^\s*(?:\[(?!\s*END\b)[^\]\n]{2,80}\]|\([^\)\n]{2,80}\))\s*:?\s*",
    re.IGNORECASE,
)


def _strip_speaker_prefix(
    text: str,
    persona: ScenarioPanelPersona | None = None,
) -> str:
    cleaned = text.strip()
    while True:
        match = _SPEAKER_BRACKET_RE.match(cleaned)
        if match:
            cleaned = cleaned[match.end() :].strip()
        else:
            break

    names_to_check: list[str] = [
        "interviewer",
        "interviewer 1",
        "interviewer 2",
        "panelist",
        "alex",
        "sarah",
        "morgan",
        "priya",
        "nina",
        "dana",
    ]
    if persona is not None:
        if persona.name:
            names_to_check.append(persona.name)
            if persona.role_title:
                names_to_check.append(f"{persona.name} - {persona.role_title}")
                names_to_check.append(f"{persona.name}, {persona.role_title}")
                names_to_check.append(persona.role_title)

    for name in names_to_check:
        escaped = re.escape(name)
        pattern = re.compile(rf"^\s*{escaped}\s*:\s*", re.IGNORECASE)
        cleaned = pattern.sub("", cleaned).strip()

    return cleaned


def _truncate_text(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text

    truncated_words = words[:max_words]
    candidate = " ".join(truncated_words)

    # Check for sentence-ending punctuation (.!?) to avoid mid-sentence cuts
    matches = list(re.finditer(r"[\.!?](?:\s|$)", candidate))
    if matches:
        last_match = matches[-1]
        sentence_end_text = candidate[: last_match.end()].strip()
        # Keep sentence-bounded cut if it preserves at least 40% of max_words
        if len(sentence_end_text.split()) >= max(10, int(max_words * 0.4)):
            return sentence_end_text

    return candidate


class RoleplayAgent:
    def __init__(self, llm: LLMClient, settings: Settings | None = None) -> None:
        self._llm = llm
        self._settings = settings or get_settings()

    def open_session(self, ctx: RoleplayContext) -> RoleplayReply | list[RoleplayReply]:
        personas = ctx.scenario.definition.personas
        if not personas:
            return self._generate(ctx, None, [], None, None)

        first = self._generate(
            ctx,
            personas[0],
            [],
            None,
            "Introduce the interview and briefly frame the situation. Do not ask the "
            "candidate a question; the other panel member will ask the first question.",
        )
        if first.should_end:
            return [first]
        history = [
            LLMMessage(
                role="assistant",
                content=self._labeled_text(first, personas[0].role_title),
            )
        ]
        second = self._generate(
            ctx,
            personas[1],
            history,
            None,
            "Briefly acknowledge the other panel member's opening, then ask the "
            "candidate one focused first question. Do not repeat the opening.",
        )
        return [first, second]

    def respond(
        self, ctx: RoleplayContext, candidate_text: str
    ) -> RoleplayReply | list[RoleplayReply]:
        personas = ctx.scenario.definition.personas
        is_final_turn = ctx.turn_index >= ctx.max_turns

        if not personas:
            if is_final_turn:
                closing_reply = self._generate(
                    ctx,
                    None,
                    ctx.history,
                    candidate_text,
                    (
                        "This is the final turn of the interview. Do not ask any new questions. "
                        "Provide a brief, professional closing assessment and acknowledgment "
                        "of the candidate's answers, thank them warmly for their time, "
                        "state that the interview is concluded, and end with the marker [END]."
                    ),
                )
                return RoleplayReply(
                    text=closing_reply.text,
                    should_end=True,
                    llm=closing_reply.llm,
                    speaker_id=closing_reply.speaker_id,
                    speaker_name=closing_reply.speaker_name,
                )
            return self._generate(ctx, None, ctx.history, candidate_text, None)

        persona_index = (ctx.turn_index - 1) % len(personas)
        assigned_persona = personas[persona_index]

        if is_final_turn:
            closing_reply = self._generate(
                ctx,
                assigned_persona,
                ctx.history,
                candidate_text,
                (
                    "This is the final turn of the interview. Do not ask any new questions. "
                    "Provide a brief, professional closing assessment and acknowledgment "
                    "of the candidate's answers, thank them warmly for their time, "
                    "state that the interview is concluded, and include the marker [END]."
                ),
            )
            return RoleplayReply(
                text=closing_reply.text,
                should_end=True,
                llm=closing_reply.llm,
                speaker_id=closing_reply.speaker_id,
                speaker_name=closing_reply.speaker_name,
            )

        return self._generate(
            ctx,
            assigned_persona,
            ctx.history,
            candidate_text,
            (
                "Continue the interview from your focus area. Acknowledge the candidate's response "
                "and ask exactly one clear, focused follow-up question. "
                "Do not repeat earlier panel questions."
            ),
        )

    def _generate(
        self,
        ctx: RoleplayContext,
        persona: ScenarioPanelPersona | None,
        history: list[LLMMessage],
        candidate_text: str | None,
        instruction: str | None,
    ) -> RoleplayReply:
        history_limit = self._settings.roleplay_history_turns * 2
        recent_history = history[-history_limit:]
        messages = [
            LLMMessage(
                role="system",
                content=build_roleplay_prompt(
                    ctx.scenario,
                    persona=persona,
                    instruction=instruction,
                ),
            ),
            *recent_history,
        ]
        if candidate_text is not None:
            messages.append(LLMMessage(role="user", content=candidate_text))
        result = self._llm.chat(LLMProfile.ROLEPLAY, messages)
        return self._reply(
            result.content,
            result.model,
            result.latency_ms,
            result.prompt_tokens,
            result.completion_tokens,
            persona,
            max_words=self._settings.roleplay_max_words,
        )

    @staticmethod
    def _labeled_text(reply: RoleplayReply, role_title: str) -> str:
        return f"[{reply.speaker_name} - {role_title}]: {reply.text}"

    @staticmethod
    def _reply(
        content: str,
        model: str,
        latency_ms: int,
        prompt_tokens: int | None,
        completion_tokens: int | None,
        persona: ScenarioPanelPersona | None = None,
        max_words: int = 120,
    ) -> RoleplayReply:
        should_end = _END_MARKER.search(content) is not None
        text = " ".join(_END_MARKER.sub(" ", content).split())
        text = _strip_speaker_prefix(text, persona)
        text = _truncate_text(text, max_words)
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
            speaker_id=persona.id if persona is not None else None,
            speaker_name=persona.name if persona is not None else None,
        )
