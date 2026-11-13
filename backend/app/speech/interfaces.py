from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class SpeechSegment:
    start_ms: int
    end_ms: int
    text: str
    confidence: float | None


@dataclass(frozen=True)
class Transcription:
    text: str
    language: str
    duration_ms: int
    avg_confidence: float | None
    word_count: int
    processing_ms: int
    segments: list[SpeechSegment]


class SpeechEngine(Protocol):
    def transcribe(self, audio: bytes, content_type: str) -> Transcription: ...

    def status(self) -> dict[str, object]: ...


class FakeSpeechEngine:
    def transcribe(self, audio: bytes, content_type: str) -> Transcription:
        return Transcription(
            text="A candidate response.",
            language="en",
            duration_ms=1000,
            avg_confidence=None,
            word_count=3,
            processing_ms=0,
            segments=[SpeechSegment(0, 1000, "A candidate response.", None)],
        )

    def status(self) -> dict[str, object]:
        return {"status": "loading"}
