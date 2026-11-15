from __future__ import annotations

import io
import logging
import math
import os
import sys
import threading
import time
from typing import Any, Literal

import httpx

from app.core.config import Settings, get_settings
from app.core.errors import AppError, ErrorCode
from app.speech.interfaces import FakeSpeechEngine, SpeechEngine, SpeechSegment, Transcription

logger = logging.getLogger(__name__)

# Monkey-patch PyAV open if needed to avoid TypeError on PyAV >= 14 with metadata_errors="ignore"
try:
    av_mod = sys.modules.get("av") or __import__("av")

    _original_av_open = getattr(av_mod, "open")  # noqa: B009

    def _safe_av_open(*args: Any, **kwargs: Any) -> Any:
        kwargs.pop("metadata_errors", None)
        return _original_av_open(*args, **kwargs)

    setattr(av_mod, "open", _safe_av_open)  # noqa: B010
except Exception:
    pass

ACCEPTED_AUDIO_TYPES: frozenset[str] = frozenset(
    {
        "audio/webm",
        "audio/ogg",
        "audio/wav",
        "audio/mp4",
        "audio/mpeg",
    }
)


def decode_audio_in_memory(audio: bytes) -> Any:
    """Decodes audio bytes completely in-memory without writing to disk."""
    if not audio:
        raise AppError(
            ErrorCode.AUDIO_EMPTY_OR_SILENT,
            "Audio file is empty.",
            422,
        )
    try:
        audio_mod = __import__("faster_whisper.audio", fromlist=["decode_audio"])
        decode_audio = getattr(audio_mod, "decode_audio")  # noqa: B009

        buf = io.BytesIO(audio)
        return decode_audio(buf)
    except AppError:
        raise
    except (ModuleNotFoundError, ImportError) as exc:
        raise AppError(
            ErrorCode.STT_UNAVAILABLE,
            "Speech recognition engine (faster-whisper) is not installed.",
            503,
            details={"detail": str(exc)},
        ) from exc
    except Exception as exc:
        logger.warning("In-memory audio decoding failed: %s", exc)
        raise AppError(
            ErrorCode.AUDIO_UNSUPPORTED_FORMAT,
            f"Audio format is unsupported or file is corrupted: {exc}",
            415,
        ) from exc


class FasterWhisperEngine:
    """faster-whisper implementation of the SpeechEngine protocol with background warm-up."""

    def __init__(
        self,
        model_name: str | None = None,
        device: str | None = None,
        compute_type: str | None = None,
        warmup: bool = True,
    ) -> None:
        settings = get_settings()

        if model_name is not None:
            self.model_name = model_name
        else:
            self.model_name = settings.whisper_model

        env_device = os.environ.get("WHISPER_DEVICE")
        if device:
            self.device = device
        elif env_device:
            self.device = env_device
        else:
            self.device = settings.whisper_device or "auto"

        env_compute = os.environ.get("WHISPER_COMPUTE_TYPE")
        if compute_type:
            self.compute_type = compute_type
        elif env_compute:
            self.compute_type = env_compute
        else:
            self.compute_type = settings.whisper_compute_type or "default"

        self._status: Literal["ready", "loading", "unavailable"] = "loading"
        self._error_detail: str | None = None
        self._model: Any = None
        self._lock = threading.Lock()
        self._warmup_thread: threading.Thread | None = None

        if not self._is_whisper_available():
            self._status = "unavailable"
            self._error_detail = "faster-whisper is not installed in the environment."
            logger.info("faster-whisper is not installed. STT will be unavailable.")
            return

        if warmup:
            self._warmup_thread = threading.Thread(
                target=self._load_and_warmup,
                name="whisper-warmup",
                daemon=True,
            )
            self._warmup_thread.start()

    @staticmethod
    def _is_whisper_available() -> bool:
        import importlib.util

        return importlib.util.find_spec("faster_whisper") is not None

    def _load_and_warmup(self) -> None:
        with self._lock:
            try:
                whisper_mod = __import__("faster_whisper")
                whisper_model_cls = getattr(whisper_mod, "WhisperModel")  # noqa: B009

                logger.info(
                    "Loading faster-whisper model '%s' (device=%s, compute_type=%s)...",
                    self.model_name,
                    self.device,
                    self.compute_type,
                )
                self._model = whisper_model_cls(
                    self.model_name,
                    device=self.device,
                    compute_type=self.compute_type,
                )
                # Warm-up inference with 0.5s of silence
                np_mod = sys.modules.get("numpy") or __import__("numpy")
                dummy_audio = np_mod.zeros(8000, dtype=np_mod.float32)
                _ = list(
                    self._model.transcribe(
                        dummy_audio,
                        language="en",
                        vad_filter=False,
                    )[0]
                )
                self._status = "ready"
                self._error_detail = None
                logger.info("faster-whisper model '%s' loaded and ready.", self.model_name)
            except (ModuleNotFoundError, ImportError) as exc:
                logger.info("faster-whisper not available: %s", exc)
                self._status = "unavailable"
                self._error_detail = "faster-whisper is not installed in the environment."
            except Exception as exc:
                logger.exception(
                    "Failed to load faster-whisper model '%s': %s",
                    self.model_name,
                    exc,
                )
                self._status = "unavailable"
                self._error_detail = str(exc)

    def status(self) -> dict[str, object]:
        return {
            "status": self._status,
            "engine": "faster-whisper",
            "model": self.model_name,
            "device": self.device,
            "language": "en",
            "detail": self._error_detail,
        }

    def transcribe(self, audio: bytes, content_type: str) -> Transcription:
        if self._status == "unavailable" or self._model is None:
            detail_msg = self._error_detail or "faster-whisper is not installed"
            raise AppError(
                ErrorCode.STT_UNAVAILABLE,
                f"Speech-to-text service is unavailable: {detail_msg}",
                503,
                details=self.status(),
            )
        if self._status == "loading":
            raise AppError(
                ErrorCode.STT_NOT_READY,
                "Speech-to-text model is still loading.",
                503,
                details=self.status(),
            )

        settings = get_settings()

        # 1. Size check
        max_bytes = settings.max_audio_mb * 1024 * 1024
        if len(audio) > max_bytes:
            msg = f"Audio size ({len(audio)} bytes) exceeds limit of {settings.max_audio_mb} MB."
            raise AppError(
                ErrorCode.AUDIO_TOO_LARGE,
                msg,
                413,
            )

        # 2. Content-type check
        normalized_content_type = content_type.split(";")[0].strip().lower()
        if normalized_content_type not in ACCEPTED_AUDIO_TYPES:
            raise AppError(
                ErrorCode.AUDIO_UNSUPPORTED_FORMAT,
                f"Unsupported audio format '{content_type}'.",
                415,
            )

        # 3. Decode in-memory without saving to disk
        arr = decode_audio_in_memory(audio)
        if len(arr) == 0:
            raise AppError(
                ErrorCode.AUDIO_EMPTY_OR_SILENT,
                "Audio contains no audio samples.",
                422,
            )

        duration_seconds = len(arr) / 16000.0
        duration_ms = int(duration_seconds * 1000)

        # 4. Duration check
        if duration_seconds > settings.max_audio_seconds:
            msg = (
                f"Audio duration of {duration_seconds:.1f}s exceeds limit of "
                f"{settings.max_audio_seconds}s."
            )
            raise AppError(
                ErrorCode.AUDIO_TOO_LONG,
                msg,
                422,
            )

        # 5. Transcribe with forced English and VAD filter enabled
        start_time = time.perf_counter()
        try:
            segments_gen, _ = self._model.transcribe(
                arr,
                language="en",
                vad_filter=True,
            )
            raw_segments = list(segments_gen)
        except Exception as exc:
            logger.exception("Transcription execution failed: %s", exc)
            raise AppError(
                ErrorCode.AUDIO_UNSUPPORTED_FORMAT,
                f"Transcription failed: {exc}",
                415,
            ) from exc

        processing_ms = int((time.perf_counter() - start_time) * 1000)

        speech_segments: list[SpeechSegment] = []
        for s in raw_segments:
            seg_text = s.text.strip()
            if not seg_text:
                continue
            conf = round(min(max(math.exp(s.avg_logprob), 0.0), 1.0), 2)
            speech_segments.append(
                SpeechSegment(
                    start_ms=int(s.start * 1000),
                    end_ms=int(s.end * 1000),
                    text=seg_text,
                    confidence=conf,
                )
            )

        full_text = " ".join("".join(s.text for s in raw_segments).split()).strip()

        if not full_text or len(speech_segments) == 0:
            raise AppError(
                ErrorCode.AUDIO_EMPTY_OR_SILENT,
                "No speech detected in audio.",
                422,
            )

        words = full_text.split()
        avg_confidence = (
            round(
                sum(s.confidence for s in speech_segments if s.confidence is not None)
                / len(speech_segments),
                2,
            )
            if speech_segments
            else None
        )

        return Transcription(
            text=full_text,
            language="en",
            duration_ms=duration_ms,
            avg_confidence=avg_confidence,
            word_count=len(words),
            processing_ms=processing_ms,
            segments=speech_segments,
        )


class GroqWhisperEngine:
    """OpenAI-compatible Whisper speech recognition engine (e.g. Groq Cloud Whisper API)."""

    def __init__(
        self,
        settings: Settings | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        self._settings = settings or get_settings()
        self._api_key = self._settings.stt_api_key.get_secret_value().strip()
        self._base_url = self._settings.stt_base_url.rstrip("/")
        self.model_name = self._settings.stt_model or "whisper-large-v3-turbo"
        self._client = client or httpx.Client(timeout=30.0)
        self._owns_client = client is None

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def status(self) -> dict[str, object]:
        if not self._api_key:
            return {
                "status": "unavailable",
                "engine": "groq-whisper",
                "model": self.model_name,
                "device": "cloud",
                "language": "en",
                "detail": "STT_API_KEY is not configured.",
            }
        return {
            "status": "ready",
            "engine": "groq-whisper",
            "model": self.model_name,
            "device": "cloud",
            "language": "en",
            "detail": None,
        }

    def transcribe(self, audio: bytes, content_type: str) -> Transcription:
        if not audio or len(audio) == 0:
            raise AppError(
                ErrorCode.AUDIO_EMPTY_OR_SILENT,
                "Audio file is empty.",
                422,
            )
        if not self._api_key:
            raise AppError(
                ErrorCode.STT_UNAVAILABLE,
                "Remote STT is unavailable: STT_API_KEY is not configured.",
                503,
            )

        ext = "webm"
        if "ogg" in content_type:
            ext = "ogg"
        elif "wav" in content_type:
            ext = "wav"
        elif "mp4" in content_type or "m4a" in content_type:
            ext = "mp4"
        elif "mpeg" in content_type or "mp3" in content_type:
            ext = "mp3"
        filename = f"audio.{ext}"

        url = f"{self._base_url}/audio/transcriptions"
        headers = {"Authorization": f"Bearer {self._api_key}"}
        data = {
            "model": self.model_name,
            "language": "en",
            "response_format": "verbose_json",
        }

        started_at = time.perf_counter()
        retries = 3
        backoff_delays = (1.0, 2.0, 3.0)
        payload: dict[str, Any] = {}

        for attempt in range(retries):
            try:
                files = {"file": (filename, audio, content_type)}
                response = self._client.post(
                    url,
                    headers=headers,
                    data=data,
                    files=files,
                )
                if response.status_code == 429:
                    if attempt < retries - 1:
                        time.sleep(backoff_delays[attempt])
                        continue
                    raise AppError(
                        ErrorCode.STT_UNAVAILABLE,
                        (
                            "Groq Whisper STT is temporarily rate limited. "
                            "Please try again or use text input."
                        ),
                        503,
                    )
                if response.status_code in (401, 403):
                    raise AppError(
                        ErrorCode.STT_UNAVAILABLE,
                        "Groq Whisper STT authentication failed (invalid STT_API_KEY).",
                        503,
                    )
                if response.status_code >= 500:
                    if attempt < retries - 1:
                        time.sleep(backoff_delays[attempt])
                        continue
                    raise AppError(
                        ErrorCode.STT_UNAVAILABLE,
                        f"Groq Whisper STT server returned status {response.status_code}.",
                        503,
                    )
                if response.status_code >= 400:
                    raise AppError(
                        ErrorCode.AUDIO_UNSUPPORTED_FORMAT,
                        f"STT transcription failed with error: {response.text}",
                        response.status_code if response.status_code in (415, 422) else 400,
                    )

                payload = response.json()
                break
            except httpx.RequestError as exc:
                if attempt < retries - 1:
                    time.sleep(backoff_delays[attempt])
                    continue
                logger.error("Groq Whisper STT network error: %s", exc)
                raise AppError(
                    ErrorCode.STT_UNAVAILABLE,
                    f"Remote STT service is unreachable: {exc}",
                    503,
                ) from exc

        processing_ms = int((time.perf_counter() - started_at) * 1000)
        raw_text = str(payload.get("text", ""))
        full_text = " ".join(raw_text.split()).strip()

        if not full_text:
            raise AppError(
                ErrorCode.AUDIO_EMPTY_OR_SILENT,
                "No speech detected in audio.",
                422,
            )

        words = full_text.split()
        duration_s = payload.get("duration")
        duration_ms = (
            int(float(duration_s) * 1000)
            if duration_s is not None
            else max(1000, int((len(words) / 135) * 60 * 1000))
        )

        speech_segments: list[SpeechSegment] = []
        raw_segments = payload.get("segments") or []
        if isinstance(raw_segments, list):
            for seg in raw_segments:
                if isinstance(seg, dict):
                    start_ms = int(float(seg.get("start", 0)) * 1000)
                    end_ms = int(float(seg.get("end", 0)) * 1000)
                    seg_text = str(seg.get("text", "")).strip()
                    avg_logprob = seg.get("avg_logprob")
                    confidence = (
                        round(math.exp(float(avg_logprob)), 2)
                        if avg_logprob is not None
                        else None
                    )
                    speech_segments.append(SpeechSegment(start_ms, end_ms, seg_text, confidence))

        if not speech_segments:
            speech_segments.append(SpeechSegment(0, duration_ms, full_text, 0.95))

        avg_confidence = (
            round(
                sum(s.confidence for s in speech_segments if s.confidence is not None)
                / len(speech_segments),
                2,
            )
            if speech_segments and any(s.confidence is not None for s in speech_segments)
            else 0.95
        )

        return Transcription(
            text=full_text,
            language="en",
            duration_ms=duration_ms,
            avg_confidence=avg_confidence,
            word_count=len(words),
            processing_ms=processing_ms,
            segments=speech_segments,
        )


_engine_instance: SpeechEngine | None = None
_engine_lock = threading.Lock()


def get_speech_engine() -> SpeechEngine:
    global _engine_instance
    if _engine_instance is None:
        with _engine_lock:
            if _engine_instance is None:
                if os.environ.get("PYTEST_CURRENT_TEST"):
                    _engine_instance = FakeSpeechEngine()
                else:
                    settings = get_settings()
                    if settings.is_stt_configured:
                        _engine_instance = GroqWhisperEngine(settings)
                    else:
                        _engine_instance = FasterWhisperEngine()
    return _engine_instance


def set_speech_engine(engine: SpeechEngine | None) -> None:
    global _engine_instance
    with _engine_lock:
        _engine_instance = engine


def reset_speech_engine() -> None:
    global _engine_instance
    with _engine_lock:
        _engine_instance = None
