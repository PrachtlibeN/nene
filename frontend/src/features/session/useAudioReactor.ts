import { useEffect, useRef, useState } from "react";
import type { PushToTalkState } from "./types";

interface AudioReactorOptions {
  state: PushToTalkState;
  activeSpeakerId?: string | null;
}

export interface AudioReactorState {
  volume: number; // 0.0 to 1.0 normalized
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  activeSpeakerId: string | null;
}

/**
 * Hook to provide simulated audio reactivity without accessing hardware media streams.
 * Prevents audio hardware session conflicts on mobile and Windows that can freeze TTS/STT.
 * 1. For AI speaking: produces natural speech cadence modulation (syllables, pauses)
 *    to drive realistic lip-sync and Hamon ripple waves.
 * 2. For user recording: produces smooth, gentle wave oscillations.
 */
export function useAudioReactor({
  state,
  activeSpeakerId = null,
}: AudioReactorOptions): AudioReactorState {
  const [volume, setVolume] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    if (state === "speaking") {
      // Natural speech rhythm generator for AI TTS lip-sync
      const updateSpeechCadence = () => {
        if (!isMounted) return;
        timeRef.current += 0.08;
        const t = timeRef.current;
        // Harmonic sum with random syllable pause envelope
        const base = Math.sin(t * 3.5) * 0.4 + Math.sin(t * 7.2) * 0.25;
        const syllablePause = Math.sin(t * 1.1) > -0.6 ? 1 : 0.1;
        const normalized = Math.max(0.05, Math.min(0.95, (base + 0.5) * syllablePause));
        setVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateSpeechCadence);
      };
      animFrameRef.current = requestAnimationFrame(updateSpeechCadence);
    } else if (state === "recording") {
      // Gentle, stable wave oscillation during user recording without touching mic hardware
      const updateRecordingCadence = () => {
        if (!isMounted) return;
        timeRef.current += 0.06;
        const t = timeRef.current;
        const simulated = Math.sin(t * 3.2) * 0.2 + Math.cos(t * 1.8) * 0.15 + 0.45;
        const normalized = Math.max(0.15, Math.min(0.85, simulated));
        setVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateRecordingCadence);
      };
      animFrameRef.current = requestAnimationFrame(updateRecordingCadence);
    } else {
      setVolume(0);
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state]);

  return {
    volume,
    isAiSpeaking: state === "speaking",
    isUserSpeaking: state === "recording",
    activeSpeakerId: state === "speaking" ? activeSpeakerId : null,
  };
}
