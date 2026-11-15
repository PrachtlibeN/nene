import React, { useEffect, useRef, useState } from "react";
import {
  createSpeechRecognitionController,
  isSpeechRecognitionSupported,
  stopAllSpeech,
  type SpeechRecognitionController,
} from "../../utils/speech";

interface TypedInputFallbackProps {
  isMicDenied: boolean;
  isServerSttUnavailable?: boolean;
  isDisabled: boolean;
  isSending: boolean;
  onSendTyped: (text: string) => void;
  onMicDeniedChange?: (denied: boolean) => void;
}

export const TypedInputFallback: React.FC<TypedInputFallbackProps> = ({
  isMicDenied,
  isServerSttUnavailable,
  isDisabled,
  isSending,
  onSendTyped,
  onMicDeniedChange,
}) => {
  const [text, setText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionControllerRef = useRef<SpeechRecognitionController | null>(null);

  useEffect(() => {
    return () => {
      recognitionControllerRef.current?.abort();
      stopAllSpeech();
    };
  }, []);

  const handleWebSpeech = () => {
    if (isListening || isDisabled || isSending) return;

    if (!recognitionControllerRef.current) {
      recognitionControllerRef.current = createSpeechRecognitionController({
        onStart: () => setIsListening(true),
        onEnd: () => setIsListening(false),
        onResult: (transcript) => {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        onError: (_error, isPermanentDenied) => {
          setIsListening(false);
          if (isPermanentDenied) {
            onMicDeniedChange?.(true);
          }
        },
      });
    }

    recognitionControllerRef.current.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0 || isDisabled || isSending) return;
    onSendTyped(text.trim());
    setText("");
  };

  const supported = isSpeechRecognitionSupported();

  return (
    <div className="rounded-xl border border-washi-300 bg-washi-50 p-4 shadow-sm space-y-3">
      {isMicDenied && (
        <div
          role="status"
          className="rounded-lg border border-shu-200 bg-shu-50 p-3 text-xs text-shu-800 flex items-start gap-2"
        >
          <svg
            className="h-4 w-4 flex-shrink-0 text-shu-600 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <span className="font-semibold">Microphone unavailable: </span>
            Microphone access was denied or is not supported. You can practice by typing your responses below.
          </div>
        </div>
      )}

      {isServerSttUnavailable && !supported && !isMicDenied && (
        <div
          role="status"
          className="rounded-lg border border-ai-200 bg-ai-50 p-3 text-xs text-ai-800 flex items-start gap-2"
        >
          <svg
            className="h-4 w-4 flex-shrink-0 text-ai-600 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <span className="font-semibold">Cloud Free Tier notice: </span>
            Server speech recognition is disabled on this instance. Please practice by typing your response below.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <label
          htmlFor="typed-response-input"
          className="block text-xs font-semibold uppercase tracking-wider text-sumi-600"
        >
          {isMicDenied
            ? "Type Your Response"
            : isServerSttUnavailable
              ? "Type Your Response or Dictate with Web Speech"
              : "Or Type Response (Fallback)"}
        </label>
        <div className="relative">
          <textarea
            id="typed-response-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isDisabled || isSending}
            placeholder={
              isDisabled
                ? "Microphone and typing are locked while interviewer responds..."
                : "Type your answer here and press Send..."
            }
            rows={2}
            maxLength={2000}
            className="w-full rounded-lg border border-washi-300 bg-white p-2.5 text-sm text-sumi-900 shadow-inner focus:border-ai-600 focus:outline-none focus:ring-1 focus:ring-ai-600 disabled:bg-washi-200 disabled:text-sumi-400"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-sumi-400">
            {text.length}/2000 characters
          </span>
          <div className="flex items-center gap-2">
            {supported && (
              <button
                type="button"
                onClick={handleWebSpeech}
                disabled={isDisabled || isSending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-washi-300 bg-washi-100 px-3 py-1.5 text-xs font-semibold text-sumi-700 hover:bg-washi-200 disabled:opacity-50 transition-colors"
                aria-label="Use browser speech recognition"
              >
                {isListening ? "Listening..." : "Dictate (Web Speech)"}
              </button>
            )}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isDisabled || isSending || text.trim().length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ai-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-ai-800 focus:outline-none disabled:opacity-50 transition-all"
            >
              {isSending ? "Sending..." : "Send Typed Answer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
