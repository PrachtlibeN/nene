import React, { useEffect } from "react";
import { stopAllSpeech } from "../../utils/speech";
import type { InteractionMode, PushToTalkState } from "./types";

interface PushToTalkButtonProps {
  state: PushToTalkState;
  mode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordingSeconds: number;
  maxAudioSeconds: number;
  isMicDenied: boolean;
  isServerSttUnavailable?: boolean;
  isBrowserSpeechSupported?: boolean;
  onMuteSpeaker?: () => void;
  volume?: number;
}

export const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  state,
  mode,
  onModeChange,
  onStartRecording,
  onStopRecording,
  recordingSeconds,
  maxAudioSeconds,
  isMicDenied,
  isServerSttUnavailable,
  isBrowserSpeechSupported,
  onMuteSpeaker,
  volume = 0,
}) => {
  const isRecording = state === "recording";
  const isMicLocked =
    state === "waiting_reply" ||
    state === "speaking" ||
    state === "transcribing" ||
    state === "sending";
  const isButtonDisabled =
    isMicLocked ||
    isMicDenied ||
    (Boolean(isServerSttUnavailable) && !isBrowserSpeechSupported);

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isButtonDisabled) return;
    if (mode === "hold" && state === "idle") {
      e.preventDefault();
      onStartRecording();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (mode === "hold" && isRecording) {
      e.preventDefault();
      onStopRecording();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isButtonDisabled) return;
    if (mode === "toggle") {
      e.preventDefault();
      if (isRecording) {
        onStopRecording();
      } else if (state === "idle") {
        onStartRecording();
      }
    }
  };

  // Wave ripple scale based on real-time voice volume
  const waveScale = 1 + Math.min(1.2, volume * 1.5);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Interaction Mode Switch (Press & Hold vs Click to Toggle) */}
      <div className="flex items-center gap-2 text-xs text-sumi-600">
        <span className="font-medium text-[11px] uppercase tracking-wider text-sumi-400">
          Input Mode:
        </span>
        <div className="inline-flex rounded-lg border border-washi-300 bg-washi-200/80 p-0.5 shadow-inner">
          <button
            type="button"
            onClick={() => onModeChange("hold")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              mode === "hold"
                ? "bg-white text-ai-700 shadow-sm"
                : "text-sumi-600 hover:text-sumi-900"
            }`}
          >
            Press &amp; Hold
          </button>
          <button
            type="button"
            onClick={() => onModeChange("toggle")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              mode === "toggle"
                ? "bg-white text-ai-700 shadow-sm"
                : "text-sumi-600 hover:text-sumi-900"
            }`}
          >
            Click to Toggle
          </button>
        </div>
      </div>

      {/* Main Push-To-Talk Button with Concentric Hamon Ripples */}
      <div className="relative flex flex-col items-center justify-center my-1">
        {/* Dynamic Hamon Waves when Recording */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer dynamic volume wave */}
            <div
              className="absolute h-24 w-24 rounded-full border-2 border-shu-500 opacity-60 transition-transform duration-75 ease-out"
              style={{ transform: `scale(${waveScale * 1.35})` }}
            />
            {/* Middle pulsating wave */}
            <div
              className="absolute h-24 w-24 rounded-full bg-shu-400 opacity-25 animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
            {/* Inner dynamic volume wave */}
            <div
              className="absolute h-22 w-22 rounded-full border border-yamabuki-500 opacity-50 transition-transform duration-100 ease-out"
              style={{ transform: `scale(${waveScale * 1.15})` }}
            />
          </div>
        )}

        <button
          type="button"
          disabled={isButtonDisabled}
          aria-label={
            isRecording
              ? "Stop recording"
              : isMicLocked
                ? "Microphone locked"
                : "Push to talk"
          }
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          className={`relative z-10 flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-full shadow-lg transition-all transform focus:outline-none select-none ${
            isButtonDisabled
              ? "bg-washi-300 text-sumi-400 cursor-not-allowed opacity-60 border border-washi-400"
              : isRecording
                ? "bg-gradient-to-tr from-shu-700 to-shu-500 text-white scale-105 shadow-shu-600/40 ring-4 ring-shu-200"
                : "bg-gradient-to-tr from-ai-800 to-ai-600 text-white hover:from-ai-700 hover:to-ai-500 active:scale-95 shadow-ai-700/30 hover:shadow-xl ring-2 ring-white"
          }`}
        >
          {isRecording ? (
            /* Recording active stop square */
            <svg
              className="h-8 w-8 text-white animate-pulse"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : isMicLocked ? (
            /* Microphone Locked */
            <svg
              className="h-8 w-8 text-sumi-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          ) : (
            /* Microphone Ready Icon */
            <svg
              className="h-9 w-9 text-white drop-shadow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        {/* State Status Text */}
        <div className="mt-2 text-center text-xs">
          {isRecording ? (
            <div className="flex flex-col items-center text-shu-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-shu-600 animate-ping" />
                Recording ({recordingSeconds}s / {maxAudioSeconds}s)
              </span>
              <span className="text-[11px] font-normal text-shu-700 mt-0.5">
                {mode === "hold" ? "Release to transcribe" : "Click to stop & transcribe"}
              </span>
            </div>
          ) : state === "waiting_reply" ? (
            <span className="font-semibold text-yamabuki-700 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Interviewer is thinking... (Mic locked)
            </span>
          ) : state === "speaking" ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ai-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ai-600 animate-pulse" />
                Interviewer is speaking... (Mic locked)
              </span>
              {onMuteSpeaker && (
                <button
                  type="button"
                  onClick={onMuteSpeaker}
                  className="rounded bg-ai-100 px-2 py-0.5 text-[11px] font-bold text-ai-800 hover:bg-ai-200 transition-colors"
                >
                  Mute
                </button>
              )}
            </div>
          ) : isMicDenied ? (
            <span className="font-medium text-shu-600">
              Mic unavailable &bull; Use typed response below
            </span>
          ) : isServerSttUnavailable && !isBrowserSpeechSupported ? (
            <span className="font-medium text-yamabuki-700">
              Speech recognition unavailable &bull; Type your response below
            </span>
          ) : isServerSttUnavailable ? (
            <div className="flex flex-col items-center">
              <span className="text-sumi-600 font-medium">
                {mode === "hold"
                  ? "Hold button to speak (Browser Speech)"
                  : "Click button to speak (Browser Speech)"}
              </span>
              <span className="text-[10px] font-bold text-ai-700 bg-ai-100 px-2 py-0.5 rounded-full mt-0.5 border border-ai-200">
                Web Speech API
              </span>
            </div>
          ) : (
            <span className="text-sumi-500 font-medium">
              {mode === "hold" ? "Hold button to speak" : "Click button to start recording"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
