import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  ApiError,
  type ScenarioOut,
  type SessionOut,
  type SpeechMeta,
  type TurnOut,
} from "../../api/client";
import { ErrorAlert } from "../../components/ErrorAlert";
import {
  cancelSpeech,
  cleanSpeakerTag,
  createSpeechRecognitionController,
  createSpeechSynthesisController,
  getSupportedAudioMimeType,
  isSpeechRecognitionSupported,
  stopAllSpeech,
  unlockSpeechAudio,
  type EnglishAccent,
  type SpeechRecognitionController,
  type SpeechSequenceItem,
} from "../../utils/speech";
import { PushToTalkButton } from "./PushToTalkButton";
import { RoleplayStage } from "./RoleplayStage";
import { TranscriptReview } from "./TranscriptReview";
import { TypedInputFallback } from "./TypedInputFallback";
import type { PushToTalkState } from "./types";
import { useAudioReactor } from "./useAudioReactor";

const EMPTY_TURNS: TurnOut[] = [];

interface SessionViewProps {
  initialSession: SessionOut;
  scenario: ScenarioOut;
  initialTurns?: TurnOut[];
  initialTurn?: TurnOut | null;
  onViewFeedback: (sessionId: string) => void;
  onEndSessionComplete?: (session: SessionOut) => void;
  onBackToScenarios?: () => void;
  /** Test hook to inject custom audio blob creation */
  onMockRecordAudio?: () => Promise<Blob>;
}

export const SessionView: React.FC<SessionViewProps> = ({
  initialSession,
  scenario,
  initialTurns,
  initialTurn,
  onViewFeedback,
  onEndSessionComplete,
  onBackToScenarios,
  onMockRecordAudio,
}) => {
  const [session, setSession] = useState<SessionOut>(initialSession);
  const openingTurns = useMemo(
    () => initialTurns ?? (initialTurn ? [initialTurn] : EMPTY_TURNS),
    [initialTurns, initialTurn],
  );
  const [turns, setTurns] = useState<TurnOut[]>(openingTurns);
  const [state, setState] = useState<PushToTalkState>(
    openingTurns.some((turn) => turn.speaker === "interviewer")
      ? "speaking"
      : "idle",
  );
  const [activeSpeakingTurn, setActiveSpeakingTurn] = useState<TurnOut | null>(
    openingTurns.find((turn) => turn.speaker === "interviewer") ?? null,
  );
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [maxAudioSeconds, setMaxAudioSeconds] = useState<number>(120);

  const [reviewText, setReviewText] = useState<string>("");
  const [reviewSpeechMeta, setReviewSpeechMeta] = useState<SpeechMeta | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  const [isMicDenied, setIsMicDenied] = useState<boolean>(false);
  const [isServerSttUnavailable, setIsServerSttUnavailable] = useState<boolean>(false);
  const [isAudioAutoplayBlocked, setIsAudioAutoplayBlocked] = useState<boolean>(false);
  const [error, setError] = useState<unknown | null>(null);

  // Hidden by default: user opens typing mode via keyboard toggle icon button
  const [showKeyboardFallback, setShowKeyboardFallback] = useState<boolean>(false);

  // English accent preference: UK (en-GB) or US (en-US), persisted to localStorage
  const [accent, setAccent] = useState<EnglishAccent>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("echorole_accent");
        if (saved === "en-GB" || saved === "en-US") return saved;
      } catch {
        // ignore localStorage access errors
      }
    }
    return "en-US";
  });

  const handleToggleAccent = () => {
    const nextAccent: EnglishAccent = accent === "en-US" ? "en-GB" : "en-US";
    setAccent(nextAccent);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("echorole_accent", nextAccent);
      } catch {
        // ignore localStorage access errors
      }
    }
    pttRecognitionControllerRef.current?.setAccent(nextAccent);
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRef = useRef(createSpeechSynthesisController());
  const spokenTurnIdsRef = useRef<Set<string>>(new Set());
  const webSpeechTranscriptRef = useRef<string>("");
  const pttRecognitionControllerRef = useRef<SpeechRecognitionController | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  const openingTurnsRef = useRef(openingTurns);
  openingTurnsRef.current = openingTurns;
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const accentRef = useRef(accent);
  accentRef.current = accent;

  // Fetch speech status and health on mount to detect server STT readiness immediately
  useEffect(() => {
    let mounted = true;
    unlockSpeechAudio();

    // Global gesture capture: keeps speech synthesis active across browser interaction
    const handleGesture = () => {
      unlockSpeechAudio();
    };
    window.addEventListener("click", handleGesture);
    window.addEventListener("touchstart", handleGesture);

    Promise.allSettled([api.getSpeechStatus(), api.getHealth()])
      .then(([speechResult, healthResult]) => {
        if (!mounted) return;
        if (speechResult.status === "fulfilled") {
          const status = speechResult.value;
          if (status.limits?.max_audio_seconds) {
            setMaxAudioSeconds(status.limits.max_audio_seconds);
          }
          if (status.stt?.status === "ready") {
            setIsServerSttUnavailable(false);
          } else if (status.stt?.status === "unavailable") {
            setIsServerSttUnavailable(true);
          }
        }
        if (healthResult.status === "fulfilled") {
          const health = healthResult.value;
          if (health.components?.stt?.status === "ready") {
            setIsServerSttUnavailable(false);
          } else if (health.components?.stt?.status === "unavailable") {
            setIsServerSttUnavailable(true);
          }
        }
      })
      .catch(() => {
        // Do not force unavailable on network errors; processAudioTranscription will catch STT_UNAVAILABLE
      });
    const speech = speechRef.current;
    return () => {
      mounted = false;
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      cancelSpeech();
      if (timerRef.current) clearInterval(timerRef.current);
      if (stopFlushTimeoutRef.current) {
        clearTimeout(stopFlushTimeoutRef.current);
        stopFlushTimeoutRef.current = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore error on stop
        }
      }
      pttRecognitionControllerRef.current?.abort();
      speech.stop();
      stopAllSpeech();
    };
  }, []);

  // Speak opening panel turns sequentially with independent lip-sync and subtitles
  useEffect(() => {
    const unplayedOpeningTurns = openingTurns.filter((turn) => {
      if (turn.speaker !== "interviewer") return false;
      const turnKey = turn.id || `${turn.idx}-${turn.speaker}-${turn.text.slice(0, 25)}`;
      return !spokenTurnIdsRef.current.has(turnKey);
    });

    if (unplayedOpeningTurns.length > 0) {
      setState("speaking");
      setActiveSpeakingTurn(unplayedOpeningTurns[0]);
      speechRef.current.speakSequence(
        unplayedOpeningTurns.map((turn) => speechItemForTurn(turn, scenario)),
        () => {
          setState("idle");
          setActiveSpeakingTurn(null);
          setIsAudioAutoplayBlocked(false);
        },
        () => {
          setState("idle");
          setActiveSpeakingTurn(null);
          setIsAudioAutoplayBlocked(true);
        },
        (item) => {
          if (item.turn) {
            setActiveSpeakingTurn(item.turn);
            const turnKey = item.turn.id || `${item.turn.idx}-${item.turn.speaker}-${item.turn.text.slice(0, 25)}`;
            spokenTurnIdsRef.current.add(turnKey);
          }
        },
        accent,
      );
    }
  }, [openingTurns, scenario, accent]);

  const handleUnblockAudio = () => {
    setIsAudioAutoplayBlocked(false);
    unlockSpeechAudio(true);
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }

    const openingInterviewerTurns = openingTurns.filter(
      (turn) => turn.speaker === "interviewer",
    );
    if (openingInterviewerTurns.length > 0) {
      setState("speaking");
      setActiveSpeakingTurn(openingInterviewerTurns[0]);
      speechRef.current.speakSequence(
        openingInterviewerTurns.map((turn) => speechItemForTurn(turn, scenario)),
        () => {
          setState("idle");
          setActiveSpeakingTurn(null);
          setIsAudioAutoplayBlocked(false);
        },
        () => {
          setState("idle");
          setActiveSpeakingTurn(null);
          setIsAudioAutoplayBlocked(true);
        },
        (item) => {
          if (item.turn) {
            setActiveSpeakingTurn(item.turn);
            const turnKey = item.turn.id || `${item.turn.idx}-${item.turn.speaker}-${item.turn.text.slice(0, 25)}`;
            spokenTurnIdsRef.current.add(turnKey);
          }
        },
        accent,
      );
    }
  };

  // Audio reactor hook for dynamic Lip-sync and Hamon waves
  const activeSpeakerId = useMemo(() => {
    if (state !== "speaking") return null;
    if (activeSpeakingTurn) return activeSpeakingTurn.speaker_id ?? null;
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].speaker === "interviewer") {
        return turns[i].speaker_id ?? null;
      }
    }
    return null;
  }, [state, activeSpeakingTurn, turns]);

  const audioReactor = useAudioReactor({
    state,
    activeSpeakerId,
  });

  // Push-to-talk: Start recording
  const handleStartRecording = async () => {
    unlockSpeechAudio();
    if (state === "speaking") {
      cancelSpeech();
      speechRef.current.stop();
    }
    setActiveSpeakingTurn(null);
    if (state !== "idle" && state !== "speaking") return;
    setError(null);

    // If a mock audio recorder hook is provided (for tests)
    if (onMockRecordAudio) {
      recordingStartTimeRef.current = Date.now();
      setState("recording");
      setRecordingSeconds(0);
      startTimer();
      return;
    }

    // If server STT is unavailable and browser supports Web Speech API
    if (isServerSttUnavailable && isSpeechRecognitionSupported()) {
      recordingStartTimeRef.current = Date.now();
      webSpeechTranscriptRef.current = "";
      setInterimTranscript("");
      if (!pttRecognitionControllerRef.current) {
        pttRecognitionControllerRef.current = createSpeechRecognitionController({
          onStart: () => {
            setState("recording");
            setRecordingSeconds(0);
            startTimer();
          },
          onInterimTranscript: (interim) => {
            setInterimTranscript(interim);
          },
          onResult: (transcript) => {
            webSpeechTranscriptRef.current = transcript;
          },
          onError: (_err, isPermanentDenied) => {
            if (isPermanentDenied) {
              setIsMicDenied(true);
              setShowKeyboardFallback(true);
            }
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setInterimTranscript("");
            setState("idle");
          },
        });
      }
      try {
        pttRecognitionControllerRef.current.setAccent(accent);
        pttRecognitionControllerRef.current.start();
        setState("recording");
        setRecordingSeconds(0);
        startTimer();
      } catch {
        setState("idle");
      }
      return;
    }

    // If server STT is unavailable and browser does NOT support Web Speech API
    if (isServerSttUnavailable && !isSpeechRecognitionSupported()) {
      setError(
        new Error(
          "Speech recognition is unavailable on this server tier and not supported by your browser. Please type your response below.",
        ),
      );
      return;
    }

    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error("Microphone API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: blobType,
        });
        await processAudioTranscription(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      recorder.start();
      setState("recording");
      setRecordingSeconds(0);
      startTimer();
    } catch (err: unknown) {
      setIsMicDenied(true);
      setShowKeyboardFallback(true);
      setError(
        err instanceof Error
          ? err
          : new Error("Microphone access was denied or could not be initialized."),
      );
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        const next = prev + 1;
        if (next >= maxAudioSeconds) {
          handleStopRecording();
        }
        return next;
      });
    }, 1000);
  };

  // Push-to-talk: Stop recording
  const handleStopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stopFlushTimeoutRef.current) {
      clearTimeout(stopFlushTimeoutRef.current);
      stopFlushTimeoutRef.current = null;
    }

    if (onMockRecordAudio) {
      setState("transcribing");
      try {
        const audioBlob = await onMockRecordAudio();
        await processAudioTranscription(audioBlob);
      } catch (err) {
        setError(err);
        setState("idle");
      }
      return;
    }

    if (isServerSttUnavailable && isSpeechRecognitionSupported()) {
      setState("transcribing");
      // 400ms buffer flush before stopping Web Speech recognition to capture final syllables
      stopFlushTimeoutRef.current = setTimeout(() => {
        pttRecognitionControllerRef.current?.stop({ immediate: true });
        setTimeout(() => {
          const transcript = webSpeechTranscriptRef.current.trim();
          setInterimTranscript("");
          if (transcript.length > 0) {
            setReviewText(transcript);
            const elapsedMs = recordingStartTimeRef.current
              ? Math.max(1000, Date.now() - recordingStartTimeRef.current)
              : Math.max(1000, recordingSeconds * 1000);
            const words = transcript.split(/\s+/).filter(Boolean);
            const durationMs = Math.max(
              elapsedMs,
              Math.round((words.length / 140) * 60 * 1000),
            );
            setReviewSpeechMeta({
              duration_ms: durationMs,
              word_count: words.length,
              language: "en",
              avg_confidence: 0.95,
            });
            setState("review");
          } else {
            setState("idle");
          }
        }, 150);
      }, 400);
      return;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      setState("transcribing");
      // 400ms buffer flush before stopping MediaRecorder to capture trailing speech
      stopFlushTimeoutRef.current = setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          try {
            mediaRecorderRef.current.stop();
          } catch {
            // ignore error on stop
          }
        }
      }, 400);
    } else {
      setState("idle");
    }
  };

  const processAudioTranscription = async (blob: Blob) => {
    setState("transcribing");
    setError(null);
    try {
      const transcription = await api.transcribeAudio(blob);
      setReviewText(transcription.text);
      setReviewSpeechMeta({
        duration_ms: transcription.duration_ms,
        avg_confidence: transcription.avg_confidence,
        word_count: transcription.word_count,
        language: transcription.language,
      });
      setState("review");
    } catch (err) {
      if (err instanceof ApiError && err.code === "STT_UNAVAILABLE") {
        setIsServerSttUnavailable(true);
        if (!isSpeechRecognitionSupported()) {
          setError(
            new Error(
              "Speech recognition is unavailable on this server tier and not supported by your browser. Please type your response below.",
            ),
          );
        } else {
          setError(null);
        }
      } else {
        setError(err);
      }
      setState("idle");
    }
  };

  // Submit candidate turn & play sequential interviewer turns
  const submitTurn = async (
    text: string,
    source: "speech" | "typed",
    speechMeta: SpeechMeta | null,
  ) => {
    if (activeSpeakingTurn !== null || state === "speaking") {
      cancelSpeech();
      speechRef.current.stop();
    }
    unlockSpeechAudio(true);
    setActiveSpeakingTurn(null);
    setState("sending");
    setError(null);
    try {
      setState("waiting_reply");

      const response = await api.submitTurn(session.id, {
        text,
        source,
        speech_meta: source === "speech" ? speechMeta : null,
      });

      const interviewerTurns =
        response.interviewer_turns && response.interviewer_turns.length > 0
          ? response.interviewer_turns
          : [response.interviewer_turn];

      setTurns((prev) => [...prev, response.candidate_turn, ...interviewerTurns]);
      setSession(response.session);
      setReviewText("");
      setReviewSpeechMeta(null);

      // Play interviewer turns sequentially (only unplayed turns)
      const unplayedInterviewerTurns = interviewerTurns.filter((turn) => {
        if (!turn.text) return false;
        const turnKey = turn.id || `${turn.idx}-${turn.speaker}-${turn.text.slice(0, 25)}`;
        return !spokenTurnIdsRef.current.has(turnKey);
      });

      if (unplayedInterviewerTurns.length > 0) {
        setState("speaking");
        setActiveSpeakingTurn(unplayedInterviewerTurns[0]);
        speechRef.current.speakSequence(
          unplayedInterviewerTurns.map((turn) => speechItemForTurn(turn, scenario)),
          () => {
            setState("idle");
            setActiveSpeakingTurn(null);
            if (response.session.status === "ended") {
              onViewFeedback(response.session.id);
            }
          },
          () => {
            setState("idle");
            setActiveSpeakingTurn(null);
            if (response.session.status === "ended") {
              onViewFeedback(response.session.id);
            }
          },
          (item) => {
            if (item.turn) {
              setActiveSpeakingTurn(item.turn);
              const turnKey = item.turn.id || `${item.turn.idx}-${item.turn.speaker}-${item.turn.text.slice(0, 25)}`;
              spokenTurnIdsRef.current.add(turnKey);
            }
          },
          accent,
        );
      } else {
        setState("idle");
        setActiveSpeakingTurn(null);
        if (response.session.status === "ended") {
          onViewFeedback(response.session.id);
        }
      }
    } catch (err) {
      setError(err);
      setState("idle");
    }
  };

  const handleSendReviewedSpeech = (text: string) => {
    unlockSpeechAudio();
    if (activeSpeakingTurn !== null || state === "speaking") {
      cancelSpeech();
    }
    submitTurn(text, "speech", reviewSpeechMeta);
  };

  const handleDiscardReview = () => {
    setReviewText("");
    setReviewSpeechMeta(null);
    setInterimTranscript("");
    setState("idle");
  };

  const handleSendTyped = (text: string) => {
    unlockSpeechAudio();
    if (activeSpeakingTurn !== null || state === "speaking") {
      cancelSpeech();
    }
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    const estimatedDurationMs = Math.max(1000, Math.round((words.length / 135) * 60 * 1000));
    submitTurn(trimmed, "typed", {
      duration_ms: estimatedDurationMs,
      word_count: words.length,
      language: "en",
      avg_confidence: null,
    });
  };

  const handleMuteSpeaker = () => {
    cancelSpeech();
    speechRef.current.stop();
    setState("idle");
    setActiveSpeakingTurn(null);
  };

  const handleReplayTurn = (text: string, speakerId?: string) => {
    unlockSpeechAudio(true);
    setIsAudioAutoplayBlocked(false);
    setState("speaking");
    const persona = (scenario.definition.personas ?? []).find(
      (panelPersona) => panelPersona.id === speakerId,
    );
    const replayingTurn = turns.find(
      (t) => cleanSpeakerTag(t.text) === text || t.text.includes(text),
    );
    if (replayingTurn) setActiveSpeakingTurn(replayingTurn);

    speechRef.current.speakSequence(
      [
        {
          text: cleanSpeakerTag(text),
          voiceGender: persona?.voice_gender,
          speakerId,
          turn: replayingTurn,
        },
      ],
      () => {
        setState("idle");
        setActiveSpeakingTurn(null);
      },
      () => {
        setState("idle");
        setActiveSpeakingTurn(null);
      },
      (item) => {
        if (item.turn) setActiveSpeakingTurn(item.turn);
      },
      accent,
    );
  };

  const handleTestVoice = () => {
    unlockSpeechAudio(true);
    setIsAudioAutoplayBlocked(false);
    setState("speaking");
    speechRef.current.speak(
      `Hello! This is a voice test from ${personas.length === 2 ? `${personas[0]?.name} and ${personas[1]?.name}` : "your interview panel"}.`,
      () => {
        setState("idle");
        setActiveSpeakingTurn(null);
      },
      () => {
        setState("idle");
        setActiveSpeakingTurn(null);
      },
      accent,
    );
  };

  const handleEndSession = async () => {
    cancelSpeech();
    setError(null);
    try {
      speechRef.current.stop();
      setActiveSpeakingTurn(null);
      const endedSession = await api.endSession(session.id);
      setSession(endedSession);
      setState("idle");
      onEndSessionComplete?.(endedSession);
    } catch (err) {
      setError(err);
    }
  };

  const isSessionEnded = session.status === "ended" || session.status === "abandoned";
  const interviewerName = scenario.definition.persona.name;
  const personas = scenario.definition.personas ?? [];
  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-between overflow-y-auto bg-washi-100 p-2 sm:p-4 select-none space-y-2">
      {/* Minimalist Top Floating Toolbar */}
      <div className="mx-auto max-w-5xl w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/95 border border-washi-300 shadow-xs backdrop-blur-sm">
        {/* Left: Back/Exit Button */}
        <button
          type="button"
          onClick={() => {
            cancelSpeech();
            onBackToScenarios?.();
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sumi-600 hover:text-sumi-900 focus:outline-none transition-colors"
          aria-label="Exit session"
        >
          <span>&larr;</span>
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Center: Scenario Info & Turns */}
        <div className="text-center truncate px-2">
          <div className="flex items-center justify-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isSessionEnded ? "bg-sumi-400" : "bg-matcha-600 animate-pulse"
              }`}
            />
            <h2 className="text-xs sm:text-sm font-bold text-sumi-900 truncate">
              {scenario.title}
            </h2>
            <span className="text-[11px] font-semibold text-ai-700 bg-ai-50 px-2 py-0.2 rounded border border-ai-200">
              Turns: {session.turn_count}/{session.max_turns}
            </span>
          </div>
          <p className="text-[11px] text-sumi-500 truncate hidden sm:block">
            {personas.length === 2 ? (
              <>
                Panel:{" "}
                {personas.map((p, idx) => (
                  <span key={p.id}>
                    {idx > 0 ? " & " : ""}
                    <span className="font-semibold text-sumi-700">{p.name}</span>
                  </span>
                ))}
              </>
            ) : (
              <span>Interviewer: {interviewerName}</span>
            )}
          </p>
        </div>

        {/* Right: Accent Toggle, Test Voice & End Session */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleTestVoice}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-ai-200 bg-ai-50 text-ai-700 hover:bg-ai-100 focus:outline-none transition-colors shadow-2xs"
            title="Test AI audio speech output"
            aria-label="Test AI voice audio"
          >
            <span>🔊 Test Voice</span>
          </button>
          <button
            type="button"
            onClick={handleToggleAccent}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-washi-300 bg-washi-50 text-sumi-700 hover:bg-washi-200 focus:outline-none transition-colors shadow-2xs"
            title={`Accent: ${accent === "en-GB" ? "British English (UK)" : "American English (US)"}. Click to toggle.`}
            aria-label="Toggle English Accent"
          >
            <span>{accent === "en-GB" ? "🇬🇧 UK" : "🇺🇸 US"}</span>
          </button>
          {!isSessionEnded ? (
            <button
              type="button"
              onClick={handleEndSession}
              disabled={state === "recording" || state === "sending"}
              className="rounded-lg border border-shu-300 bg-shu-50 px-3 py-1 text-xs font-semibold text-shu-700 hover:bg-shu-100 focus:outline-none disabled:opacity-50 transition-colors shadow-2xs"
            >
              End Session
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onViewFeedback(session.id)}
              className="rounded-lg bg-ai-700 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-ai-800 focus:outline-none transition-all"
            >
              Feedback &rarr;
            </button>
          )}
        </div>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* Session Completed Banner if Ended */}
      {isSessionEnded && (
        <div className="mx-auto max-w-5xl w-full rounded-2xl border border-ai-300 bg-ai-50/95 p-4 text-center shadow-md backdrop-blur-sm">
          <h3 className="text-base font-bold text-ai-900">
            Practice Session Completed!
          </h3>
          <p className="mt-1 text-xs text-ai-800">
            End reason:{" "}
            <span className="font-semibold uppercase">
              {session.end_reason ?? "Completed"}
            </span>
            . You can now view detailed Coach evaluation and metrics.
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => onViewFeedback(session.id)}
              className="rounded-xl bg-ai-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-ai-800 focus:outline-none transition-all"
            >
              View Coach Evaluation &amp; Metrics &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Audio Autoplay Unblock Banner for Edge & Mobile browsers */}
      {isAudioAutoplayBlocked && (
        <aside
          role="alert"
          aria-live="polite"
          onClick={handleUnblockAudio}
          className="mx-auto max-w-5xl w-full cursor-pointer rounded-2xl border-2 border-yamabuki-400 bg-yamabuki-50/95 p-3.5 sm:p-4 text-sumi-900 shadow-md transition-all hover:bg-yamabuki-100 active:scale-98"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl animate-pulse shrink-0">🔊</span>
              <div className="text-left min-w-0">
                <p className="text-xs sm:text-sm font-bold text-sumi-900 truncate">
                  Audio paused by browser media policy
                </p>
                <p className="text-[11px] sm:text-xs text-sumi-700">
                  Tap anywhere on this bar to listen to your interview panel intro.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleUnblockAudio();
              }}
              className="shrink-0 rounded-xl bg-ai-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-ai-800 transition-colors cursor-pointer"
            >
              Play Audio ▶
            </button>
          </div>
        </aside>
      )}

      {/* Sân Khấu 2 Nhân Vật Chiếm ~75–80% Màn Hình */}
      <RoleplayStage
        scenario={scenario}
        latestTurn={latestTurn}
        activeSpeakingTurn={activeSpeakingTurn}
        state={state}
        volume={audioReactor.volume}
        onReplayTurn={handleReplayTurn}
        interimTranscript={interimTranscript}
      />

      {/* Bottom Mobile-First Controls Area */}
      {!isSessionEnded && (
        <div className="mx-auto max-w-5xl w-full rounded-2xl border border-washi-300 bg-white/95 p-3 sm:p-4 shadow-md backdrop-blur-sm space-y-3">
          {/* Review Transcript Stage (No Auto-Send) */}
          {state === "review" && (
            <TranscriptReview
              initialText={reviewText}
              speechMeta={reviewSpeechMeta}
              onSend={handleSendReviewedSpeech}
              onDiscard={handleDiscardReview}
              isSending={false}
            />
          )}

          {/* Transcribing loader */}
          {state === "transcribing" && (
            <div className="flex items-center justify-center gap-3 p-3 text-xs sm:text-sm font-semibold text-ai-700 bg-ai-50 rounded-xl border border-ai-200">
              <svg
                className="h-4 w-4 animate-spin text-ai-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span>Transcribing your speech...</span>
            </div>
          )}

          {/* Main Controls: Mic Button & Keyboard Toggle Button */}
          {state !== "review" && (
            <div className="relative flex items-center justify-center">
              <PushToTalkButton
                state={state}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                recordingSeconds={recordingSeconds}
                maxAudioSeconds={maxAudioSeconds}
                isMicDenied={isMicDenied}
                isServerSttUnavailable={isServerSttUnavailable}
                isBrowserSpeechSupported={isSpeechRecognitionSupported()}
                onMuteSpeaker={handleMuteSpeaker}
                volume={audioReactor.volume}
                interimTranscript={interimTranscript}
              />

              {/* Small Keyboard Toggle Icon Button beside Mic */}
              <button
                type="button"
                onClick={() => setShowKeyboardFallback((prev) => !prev)}
                className={`absolute right-2 sm:right-6 bottom-2 p-2.5 rounded-full border transition-all ${
                  showKeyboardFallback || isMicDenied
                    ? "bg-ai-700 text-white border-ai-700 shadow-sm"
                    : "bg-washi-100 text-sumi-600 border-washi-300 hover:bg-white"
                }`}
                aria-label="Toggle keyboard input"
                title="Toggle keyboard input"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h18M3 14h18m-9-4v8m-4-8v8m8-8v8M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Microphone Unavailable Warning Banner when Keyboard is closed */}
          {isMicDenied && !showKeyboardFallback && (
            <div
              role="status"
              className="rounded-lg border border-shu-200 bg-shu-50 p-2.5 text-xs text-shu-800 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">Microphone unavailable.</span>
                <span className="hidden sm:inline">Use typed input to practice.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyboardFallback(true)}
                className="px-2.5 py-1 text-xs font-semibold bg-shu-600 text-white rounded-md hover:bg-shu-700 transition-colors shadow-2xs"
              >
                Open Keyboard ⌨️
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Keyboard Input Modal Overlay */}
      {showKeyboardFallback && !isSessionEnded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Type your response"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-sumi-900/50 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowKeyboardFallback(false);
            }
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-washi-300 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-washi-200">
              <div className="flex items-center gap-2">
                <span className="text-base">⌨️</span>
                <h3 className="text-sm font-bold text-sumi-900">Type Your Response</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyboardFallback(false)}
                className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-sumi-500 hover:text-sumi-900 hover:bg-washi-200 focus:outline-none transition-colors"
                aria-label="Close keyboard input"
              >
                ✕
              </button>
            </div>

            <TypedInputFallback
              isMicDenied={isMicDenied}
              isServerSttUnavailable={isServerSttUnavailable}
              onMicDeniedChange={setIsMicDenied}
              isDisabled={
                state === "transcribing" ||
                state === "waiting_reply" ||
                state === "speaking"
              }
              isSending={state === "sending"}
              autoFocus={true}
              onSendTyped={(text) => {
                handleSendTyped(text);
                setShowKeyboardFallback(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

function speechItemForTurn(turn: TurnOut, scenario: ScenarioOut): SpeechSequenceItem {
  const persona = (scenario.definition.personas ?? []).find(
    (panelPersona) => panelPersona.id === turn.speaker_id,
  );
  return {
    text: cleanSpeakerTag(turn.text),
    voiceGender: persona?.voice_gender,
    speakerId: turn.speaker_id ?? undefined,
    turn: turn,
  };
}
