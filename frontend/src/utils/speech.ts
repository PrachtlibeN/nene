/**
 * Safe wrapper for browser SpeechSynthesis and SpeechRecognition APIs.
 */

import type { TurnOut } from "../api/client";

export type EnglishAccent = "en-US" | "en-GB";

export interface SpeechSynthesisController {
  speak: (
    text: string,
    onEnd?: () => void,
    onError?: () => void,
    accent?: EnglishAccent,
  ) => void;
  speakSequence: (
    items: SpeechSequenceItem[],
    onEnd?: () => void,
    onError?: () => void,
    onItemStart?: (item: SpeechSequenceItem, index: number) => void,
    accent?: EnglishAccent,
  ) => void;
  stop: () => void;
  isSpeaking: () => boolean;
  isSupported: () => boolean;
}

export interface SpeechSequenceItem {
  text: string;
  voiceGender?: "male" | "female";
  speakerId?: string;
  turn?: TurnOut;
}

/**
 * Strips leading bracketed or named speaker tags such as "[Sarah - People Partner]: "
 * from dialogue text so it doesn't display or get spoken aloud by TTS.
 */
export function cleanSpeakerTag(text: string): string {
  if (!text) return "";
  let cleaned = text.trim();
  while (cleaned) {
    const next = cleaned.replace(
      /^\s*(?:\[(?!\s*END\b)[^\]\n]{2,80}\]|\([^)\n]{2,80}\))\s*:?\s*/i,
      "",
    );
    if (next === cleaned) break;
    cleaned = next.trim();
  }
  // Strip unbracketed persona/interviewer prefixes like "Sarah - People Partner:" or "Sarah:"
  cleaned = cleaned.replace(
    /^(?:alex|sarah|morgan|interviewer|people partner|engineering manager)(?:\s*-\s*[A-Za-z0-9 _.-]+)?\s*:\s*/i,
    "",
  );
  return cleaned.trim();
}

export interface BrowserSpeechRecognitionEvent {
  resultIndex?: number;
  results: {
    length?: number;
    [index: number]: {
      isFinal?: boolean;
      length?: number;
      [index: number]: {
        transcript: string;
        confidence?: number;
      };
    };
  };
}

export interface BrowserSpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface BrowserSpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous?: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (transcript: string) => void;
  /**
   * Called with interim (in-progress) transcript updates as the user speaks.
   */
  onInterimTranscript?: (interim: string) => void;
  /**
   * Called when speech recognition encounters an error.
   * isPermanentDenied is true only for 'not-allowed' or 'service-not-allowed'.
   */
  onError?: (error: string, isPermanentDenied: boolean) => void;
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: (options?: { immediate?: boolean }) => void;
  abort: () => void;
  setAccent: (accent: EnglishAccent) => void;
  isListening: () => boolean;
  isStarting: () => boolean;
  isSupported: () => boolean;
}

let activeRecognitionInstance: BrowserSpeechRecognitionInstance | null = null;

export function getSpeechRecognitionClass(): (new () => BrowserSpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognitionInstance;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionClass() !== null;
}

/**
 * Returns the first supported audio recording MIME type for MediaRecorder.
 * Supports webm (Chrome/Edge/Firefox) and mp4/aac (iOS Safari/macOS Safari).
 */
export function getSupportedAudioMimeType(): string {
  if (
    typeof window === "undefined" ||
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return "";
  }
  const preferred = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const candidate of preferred) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return "";
}

export function abortActiveSpeechRecognition(): void {
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.abort();
    } catch {
      // ignore errors on abort
    }
    activeRecognitionInstance = null;
  }
}

export function stopAllSpeech(): void {
  abortActiveSpeechRecognition();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      // Chrome/Edge bug: cancel() can leave the synthesis engine in a paused state
      window.speechSynthesis.resume();
    } catch {
      // ignore errors on cancel
    }
  }
}

/**
 * Immediate cancellation of all ongoing speech and synthesis playback.
 */
export function cancelSpeech(): void {
  stopAllSpeech();
}

export function createSpeechRecognitionController(
  callbacks: SpeechRecognitionCallbacks,
): SpeechRecognitionController {
  let isStarting = false;
  let isListening = false;
  let shouldBeListening = false;
  let currentAccent: EnglishAccent = "en-US";
  let stopTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let currentInstance: BrowserSpeechRecognitionInstance | null = null;

  const clearPendingStop = (): void => {
    if (stopTimeoutId) {
      clearTimeout(stopTimeoutId);
      stopTimeoutId = null;
    }
  };

  const initInstance = (): BrowserSpeechRecognitionInstance => {
    clearPendingStop();
    if (activeRecognitionInstance) {
      try {
        activeRecognitionInstance.abort();
      } catch {
        // ignore errors on abort
      }
      activeRecognitionInstance = null;
    }

    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      throw new Error("SpeechRecognition is not supported");
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = currentAccent;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      isStarting = false;
      isListening = true;
      callbacks.onStart?.();
    };

    recognition.onend = () => {
      clearPendingStop();
      if (shouldBeListening) {
        try {
          recognition.start();
          return;
        } catch {
          // If restart fails, proceed to clean up
        }
      }
      isStarting = false;
      isListening = false;
      if (activeRecognitionInstance === recognition) {
        activeRecognitionInstance = null;
      }
      callbacks.onEnd?.();
    };

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      clearPendingStop();
      shouldBeListening = false;
      isStarting = false;
      isListening = false;
      if (activeRecognitionInstance === recognition) {
        activeRecognitionInstance = null;
      }
      const err = event.error;
      const isDenied = err === "not-allowed" || err === "service-not-allowed";
      callbacks.onError?.(err, isDenied);
    };

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      if (event && event.results) {
        const len = typeof event.results.length === "number" ? event.results.length : 1;
        for (let i = 0; i < len; i++) {
          const item = event.results[i];
          const text = item?.[0]?.transcript?.trim();
          if (!text) continue;
          if (item.isFinal === false) {
            interimTranscript += (interimTranscript ? " " : "") + text;
          } else {
            finalTranscript += (finalTranscript ? " " : "") + text;
          }
        }
      }

      if (!finalTranscript && !interimTranscript && event?.results?.[0]?.[0]?.transcript) {
        finalTranscript = event.results[0][0].transcript.trim();
      }

      callbacks.onInterimTranscript?.(interimTranscript);

      const combined = [finalTranscript, interimTranscript].filter(Boolean).join(" ").trim();
      if (combined) {
        callbacks.onResult?.(combined);
      }
    };

    currentInstance = recognition;
    activeRecognitionInstance = recognition;
    return recognition;
  };

  const start = (): void => {
    if (isStarting || isListening) return;

    if (!isSpeechRecognitionSupported()) {
      callbacks.onError?.("not-supported", true);
      return;
    }

    shouldBeListening = true;
    isStarting = true;
    try {
      const recognition = initInstance();
      recognition.start();
    } catch (err: unknown) {
      const isInvalidState =
        err instanceof Error &&
        (err.name === "InvalidStateError" ||
          err.message?.toLowerCase().includes("invalidstate"));

      if (isInvalidState) {
        try {
          if (currentInstance) {
            currentInstance.abort();
            currentInstance = null;
          }
          const retryRecognition = initInstance();
          retryRecognition.start();
        } catch {
          shouldBeListening = false;
          isStarting = false;
          isListening = false;
        }
      } else {
        shouldBeListening = false;
        isStarting = false;
        isListening = false;
        callbacks.onError?.(
          err instanceof Error ? err.message : "recognition-error",
          false,
        );
      }
    }
  };

  const stop = (options?: { immediate?: boolean }): void => {
    shouldBeListening = false;
    isStarting = false;
    clearPendingStop();

    const doStop = () => {
      clearPendingStop();
      if (currentInstance) {
        try {
          currentInstance.stop();
        } catch {
          // ignore errors on stop
        }
      }
    };

    if (options?.immediate) {
      doStop();
    } else {
      // 400ms flush buffer to capture trailing syllables before closing recognition
      stopTimeoutId = setTimeout(doStop, 400);
    }
  };

  const abort = (): void => {
    clearPendingStop();
    shouldBeListening = false;
    isStarting = false;
    isListening = false;
    if (currentInstance) {
      try {
        currentInstance.abort();
      } catch {
        // ignore errors on abort
      }
      if (activeRecognitionInstance === currentInstance) {
        activeRecognitionInstance = null;
      }
      currentInstance = null;
    }
  };

  const setAccent = (accent: EnglishAccent): void => {
    currentAccent = accent;
    if (currentInstance) {
      currentInstance.lang = accent;
    }
  };

  return {
    start,
    stop,
    abort,
    setAccent,
    isListening: () => isListening,
    isStarting: () => isStarting,
    isSupported: isSpeechRecognitionSupported,
  };
}

let audioUnlocked = false;

/**
 * Plays a silent (volume=0) utterance on user gesture to permanently unlock
 * speech synthesis audio in browsers with strict autoplay policies (iOS/Safari/Chrome).
 */
export function unlockSpeechAudio(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (audioUnlocked) return;
  try {
    const utterance = new window.SpeechSynthesisUtterance("");
    utterance.volume = 0;
    utterance.rate = 10;
    utterance.onend = () => {
      audioUnlocked = true;
    };
    utterance.onerror = () => {
      audioUnlocked = true;
    };
    window.speechSynthesis.speak(utterance);
    audioUnlocked = true;
  } catch {
    // ignore
  }
}

let voicesLoadedPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Resolves available SpeechSynthesis voices, handling asynchronous onvoiceschanged
 * across browsers (e.g. Chrome/Safari lazy voice loading) with a fallback timeout (default 300ms).
 */
export function ensureVoicesLoaded(timeoutMs = 300): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }
  const current = window.speechSynthesis.getVoices();
  if (current && current.length > 0) {
    return Promise.resolve(current);
  }
  if (voicesLoadedPromise) {
    return voicesLoadedPromise;
  }

  voicesLoadedPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(window.speechSynthesis.getVoices() || []);
      }
    }, timeoutMs);

    const onVoicesChanged = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        if (window.speechSynthesis.removeEventListener) {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        } else if ("onvoiceschanged" in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
        resolve(window.speechSynthesis.getVoices() || []);
      }
    };

    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    } else if ("onvoiceschanged" in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    }
  });

  return voicesLoadedPromise;
}

// Auto-trigger voice loading eagerly
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  ensureVoicesLoaded(300).catch(() => {});
}

export function splitTextIntoSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const regex = /[^.!?\n]+(?:[.!?\n]+|$)/g;
  const matches = trimmed.match(regex);
  if (!matches) return [trimmed];
  const sentences = matches.map((s) => s.trim()).filter((s) => s.length > 0);
  return sentences.length > 0 ? sentences : [trimmed];
}

export function createSpeechSynthesisController(): SpeechSynthesisController {
  let activeSequenceId = 0;
  let cancelGraceTimer: ReturnType<typeof setTimeout> | null = null;
  let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  let resumeInterval: ReturnType<typeof setInterval> | null = null;

  const clearTimers = (): void => {
    if (cancelGraceTimer) {
      clearTimeout(cancelGraceTimer);
      cancelGraceTimer = null;
    }
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
    if (resumeInterval) {
      clearInterval(resumeInterval);
      resumeInterval = null;
    }
  };

  const isSupported = (): boolean => {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.SpeechSynthesisUtterance !== "undefined"
    );
  };

  const stop = (): void => {
    activeSequenceId += 1;
    clearTimers();
    if (isSupported()) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch {
        // ignore errors on cancel
      }
    }
  };

  const isSpeaking = (): boolean => {
    if (!isSupported()) return false;
    return window.speechSynthesis.speaking;
  };

  const speak = (
    text: string,
    onEnd?: () => void,
    onError?: () => void,
    accent: EnglishAccent = "en-US",
  ): void => {
    speakSequence([{ text }], onEnd, onError, undefined, accent);
  };

  const voiceForGender = (
    gender: SpeechSequenceItem["voiceGender"],
    accent: EnglishAccent = "en-US",
  ): SpeechSynthesisVoice | undefined => {
    if (!isSupported() || !gender) return undefined;
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith("en"),
    );
    if (englishVoices.length === 0) return undefined;

    const accentPrefix = accent.toLowerCase().startsWith("en-gb") ? "en-gb" : "en-us";
    const accentVoices = englishVoices.filter(
      (v) =>
        v.lang.toLowerCase().replace("_", "-").startsWith(accentPrefix) ||
        (accentPrefix === "en-gb" && /\b(uk|british|gb)\b/i.test(v.name)) ||
        (accentPrefix === "en-us" && /\b(us|american)\b/i.test(v.name)),
    );

    const pool = accentVoices.length > 0 ? accentVoices : englishVoices;

    const maleHint =
      accentPrefix === "en-gb"
        ? /\b(daniel|oliver|george|arthur|male|man)\b/i
        : /\b(david|mark|guy|james|alex|male|man)\b/i;
    const femaleHint =
      accentPrefix === "en-gb"
        ? /\b(kate|serena|hazel|victoria|susan|female|woman)\b/i
        : /\b(zira|samantha|aria|jenny|female|woman)\b/i;

    const maleVoice = pool.find((voice) => maleHint.test(voice.name));
    const femaleVoice = pool.find((voice) => femaleHint.test(voice.name));

    if (gender === "male") {
      return (
        maleVoice ??
        pool.find((voice) => voice !== femaleVoice) ??
        englishVoices[0]
      );
    }

    return (
      femaleVoice ??
      pool.find((voice) => voice !== maleVoice) ??
      englishVoices[1] ??
      englishVoices[0]
    );
  };

  const speakSequence = (
    items: SpeechSequenceItem[],
    onEnd?: () => void,
    onError?: () => void,
    onItemStart?: (item: SpeechSequenceItem, index: number) => void,
    accent: EnglishAccent = "en-US",
  ): void => {
    const validItems = items.filter((item) => item.text.trim().length > 0);
    if (!isSupported()) {
      if (validItems.length > 0) {
        onItemStart?.(validItems[validItems.length - 1], validItems.length - 1);
      }
      onEnd?.();
      return;
    }
    if (validItems.length === 0) {
      onEnd?.();
      return;
    }

    try {
      activeSequenceId += 1;
      const sequenceId = activeSequenceId;
      clearTimers();
      window.speechSynthesis.cancel();

      // Split items into smaller sentence chunks to avoid browser synthesis speech dropouts
      interface FlattenedChunk {
        text: string;
        item: SpeechSequenceItem;
        isFirstChunkOfItem: boolean;
        itemIndex: number;
      }

      const chunks: FlattenedChunk[] = [];
      validItems.forEach((item, itemIdx) => {
        const sentences = splitTextIntoSentences(item.text);
        sentences.forEach((sentence, sIdx) => {
          chunks.push({
            text: sentence,
            item,
            isFirstChunkOfItem: sIdx === 0,
            itemIndex: itemIdx,
          });
        });
      });

      if (chunks.length === 0) {
        onEnd?.();
        return;
      }

      // Keep synthesis alive across browsers (prevents Chrome 15s pause bug)
      resumeInterval = setInterval(() => {
        if (sequenceId !== activeSequenceId) {
          if (resumeInterval) clearInterval(resumeInterval);
          return;
        }
        try {
          if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.resume();
          }
        } catch {
          // ignore resume error
        }
      }, 3000);

      let chunkIndex = 0;
      const speakNextChunk = (): void => {
        if (sequenceId !== activeSequenceId) {
          clearTimers();
          return;
        }

        const currentChunk = chunks[chunkIndex];
        if (!currentChunk) {
          clearTimers();
          onEnd?.();
          return;
        }

        if (currentChunk.isFirstChunkOfItem) {
          onItemStart?.(currentChunk.item, currentChunk.itemIndex);
        }

        const utterance = new window.SpeechSynthesisUtterance(currentChunk.text);
        utterance.lang = accent;
        utterance.rate = 1.0;
        const voice = voiceForGender(currentChunk.item.voiceGender, accent);
        if (voice) utterance.voice = voice;

        let finished = false;
        let retrySwallowTimer: ReturnType<typeof setTimeout> | null = null;

        const handleDone = () => {
          if (finished) return;
          finished = true;
          if (retrySwallowTimer) {
            clearTimeout(retrySwallowTimer);
            retrySwallowTimer = null;
          }
          if (watchdogTimer) {
            clearTimeout(watchdogTimer);
            watchdogTimer = null;
          }
          if (sequenceId !== activeSequenceId) return;
          chunkIndex += 1;
          speakNextChunk();
        };

        // Watchdog timeout based on sentence length to prevent synthesis hangs
        const estimatedMs = Math.max(
          3000,
          Math.min(15000, currentChunk.text.length * 90 + 2500),
        );
        watchdogTimer = setTimeout(() => {
          try {
            window.speechSynthesis.resume();
          } catch {
            // ignore
          }
          setTimeout(() => {
            if (!finished && sequenceId === activeSequenceId) {
              handleDone();
            }
          }, 400);
        }, estimatedMs);

        utterance.onend = handleDone;
        utterance.onerror = handleDone;

        // Unpause if synthesis is paused
        try {
          if (
            typeof window !== "undefined" &&
            window.speechSynthesis &&
            window.speechSynthesis.paused
          ) {
            window.speechSynthesis.resume();
          }
        } catch {
          // ignore
        }

        window.speechSynthesis.speak(utterance);

        // Fallback watchdog: If browser swallowed the utterance, resume and re-dispatch speak once
        retrySwallowTimer = setTimeout(() => {
          retrySwallowTimer = null;
          if (finished || sequenceId !== activeSequenceId) return;
          try {
            if (
              typeof window !== "undefined" &&
              window.speechSynthesis &&
              !window.speechSynthesis.speaking &&
              !window.speechSynthesis.pending
            ) {
              window.speechSynthesis.resume();
              window.speechSynthesis.speak(utterance);
            }
          } catch {
            // ignore
          }
        }, 250);
      };

      // Delay 60ms after cancel() to prevent Chromium cancel() from swallowing subsequent speak()
      cancelGraceTimer = setTimeout(() => {
        cancelGraceTimer = null;
        if (sequenceId !== activeSequenceId) return;
        speakNextChunk();
      }, 60);
    } catch {
      clearTimers();
      if (onError) onError();
      else onEnd?.();
    }
  };

  return {
    speak,
    speakSequence,
    stop,
    isSpeaking,
    isSupported,
  };
}
