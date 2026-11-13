/**
 * Safe wrapper for browser SpeechSynthesis API.
 */

export interface SpeechSynthesisController {
  speak: (text: string, onEnd?: () => void, onError?: () => void) => void;
  stop: () => void;
  isSpeaking: () => boolean;
  isSupported: () => boolean;
}

export function createSpeechSynthesisController(): SpeechSynthesisController {
  const isSupported = (): boolean => {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.SpeechSynthesisUtterance !== "undefined"
    );
  };

  const stop = (): void => {
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
    if (!isSupported()) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1.0;

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = () => {
        if (onError) {
          onError();
        } else {
          onEnd?.();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  };

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}
