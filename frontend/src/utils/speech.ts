/**
 * Safe wrapper for browser SpeechSynthesis and SpeechRecognition APIs.
 */

import type { TurnOut } from "../api/client";

export interface SpeechSynthesisController {
  speak: (text: string, onEnd?: () => void, onError?: () => void) => void;
  speakSequence: (
    items: SpeechSequenceItem[],
    onEnd?: () => void,
    onError?: () => void,
    onItemStart?: (item: SpeechSequenceItem, index: number) => void,
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
  results: {
    length?: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
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
   * Called when speech recognition encounters an error.
   * isPermanentDenied is true only for 'not-allowed' or 'service-not-allowed'.
   */
  onError?: (error: string, isPermanentDenied: boolean) => void;
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  abort: () => void;
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
  let currentInstance: BrowserSpeechRecognitionInstance | null = null;

  const initInstance = (): BrowserSpeechRecognitionInstance => {
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
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      isStarting = false;
      isListening = true;
      callbacks.onStart?.();
    };

    recognition.onend = () => {
      isStarting = false;
      isListening = false;
      if (activeRecognitionInstance === recognition) {
        activeRecognitionInstance = null;
      }
      callbacks.onEnd?.();
    };

    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
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
      let fullTranscript = "";
      if (event && event.results) {
        const len = typeof event.results.length === "number" ? event.results.length : 1;
        for (let i = 0; i < len; i++) {
          const item = event.results[i]?.[0]?.transcript;
          if (item) {
            fullTranscript += (fullTranscript ? " " : "") + item.trim();
          }
        }
      }
      if (!fullTranscript && event?.results?.[0]?.[0]?.transcript) {
        fullTranscript = event.results[0][0].transcript;
      }
      if (fullTranscript) {
        callbacks.onResult?.(fullTranscript);
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
          isStarting = false;
          isListening = false;
        }
      } else {
        isStarting = false;
        isListening = false;
        callbacks.onError?.(
          err instanceof Error ? err.message : "recognition-error",
          false,
        );
      }
    }
  };

  const stop = (): void => {
    isStarting = false;
    if (currentInstance) {
      try {
        currentInstance.stop();
      } catch {
        // ignore errors on stop
      }
    }
  };

  const abort = (): void => {
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

  return {
    start,
    stop,
    abort,
    isListening: () => isListening,
    isStarting: () => isStarting,
    isSupported: isSpeechRecognitionSupported,
  };
}

export function createSpeechSynthesisController(): SpeechSynthesisController {
  let activeSequenceId = 0;

  const isSupported = (): boolean => {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.SpeechSynthesisUtterance !== "undefined"
    );
  };

  const stop = (): void => {
    activeSequenceId += 1;
    if (isSupported()) {
      try {
        window.speechSynthesis.cancel();
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
  ): void => {
    speakSequence([{ text }], onEnd, onError);
  };

  const voiceForGender = (
    gender: SpeechSequenceItem["voiceGender"],
  ): SpeechSynthesisVoice | undefined => {
    if (!isSupported() || !gender) return undefined;
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith("en"),
    );
    if (englishVoices.length === 0) return undefined;

    const maleHint = /\b(male|man|david|mark|daniel|james|alex)\b/i;
    const femaleHint = /\b(female|woman|zira|susan|samantha|karen|aria)\b/i;
    const maleVoice = englishVoices.find((voice) => maleHint.test(voice.name));
    const femaleVoice = englishVoices.find((voice) => femaleHint.test(voice.name));

    if (gender === "male") {
      return (
        maleVoice ??
        englishVoices.find((voice) => voice !== femaleVoice) ??
        englishVoices[0]
      );
    }

    return (
      femaleVoice ??
      englishVoices.find((voice) => voice !== maleVoice) ??
      englishVoices[1] ??
      englishVoices[0]
    );
  };

  const speakSequence = (
    items: SpeechSequenceItem[],
    onEnd?: () => void,
    onError?: () => void,
    onItemStart?: (item: SpeechSequenceItem, index: number) => void,
  ): void => {
    const sequence = items.filter((item) => item.text.trim().length > 0);
    if (!isSupported()) {
      if (sequence.length > 0) {
        onItemStart?.(sequence[sequence.length - 1], sequence.length - 1);
      }
      onEnd?.();
      return;
    }
    if (sequence.length === 0) {
      onEnd?.();
      return;
    }

    try {
      activeSequenceId += 1;
      const sequenceId = activeSequenceId;
      window.speechSynthesis.cancel();
      let index = 0;
      const speakNext = (): void => {
        if (sequenceId !== activeSequenceId) return;
        const item = sequence[index];
        if (!item) {
          onEnd?.();
          return;
        }

        onItemStart?.(item, index);

        const utterance = new window.SpeechSynthesisUtterance(item.text);
        utterance.lang = "en-US";
        utterance.rate = 1.0;
        const voice = voiceForGender(item.voiceGender);
        if (voice) utterance.voice = voice;

        utterance.onend = () => {
          if (sequenceId !== activeSequenceId) return;
          index += 1;
          speakNext();
        };
        utterance.onerror = () => {
          if (sequenceId !== activeSequenceId) return;
          index += 1;
          speakNext();
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNext();
    } catch {
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
