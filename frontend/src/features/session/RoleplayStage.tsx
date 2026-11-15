import React, { useMemo } from "react";
import type { ScenarioOut, TurnOut } from "../../api/client";
import { cleanSpeakerTag } from "../../utils/speech";
import { StageBackgrounds } from "./stage/StageBackgrounds";
import { StageCharacter } from "./stage/StageCharacters";
import type { PushToTalkState } from "./types";

interface RoleplayStageProps {
  scenario: ScenarioOut;
  turns: TurnOut[];
  state: PushToTalkState;
  volume: number;
  onReplayTurn: (text: string, speakerId?: string) => void;
  onToggleTranscriptDrawer: () => void;
  isDrawerOpen: boolean;
}

export const RoleplayStage: React.FC<RoleplayStageProps> = ({
  scenario,
  turns,
  state,
  volume,
  onReplayTurn,
  onToggleTranscriptDrawer,
  isDrawerOpen,
}) => {
  const personas = useMemo(() => {
    if (scenario.definition.personas && scenario.definition.personas.length > 0) {
      return scenario.definition.personas;
    }
    // Fallback to single persona representation
    const defaultPersona = scenario.definition.persona;
    return [
      {
        id: "interviewer-1",
        name: defaultPersona.name || "Interviewer",
        role_title: defaultPersona.role || "Interviewer",
        focus_area: defaultPersona.style || "Communication",
        voice_gender: "male" as const,
        persona_prompt: "",
      },
    ];
  }, [scenario]);

  // Determine active turn for visual novel dialogue box
  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const latestInterviewerTurn = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].speaker === "interviewer") {
        return turns[i];
      }
    }
    return null;
  }, [turns]);

  // Determine which character is currently speaking
  const activeSpeakerId = useMemo(() => {
    if (state !== "speaking") return null;
    if (!latestInterviewerTurn) return personas[0]?.id ?? null;
    return latestInterviewerTurn.speaker_id ?? personas[0]?.id ?? null;
  }, [state, latestInterviewerTurn, personas]);

  // Active speaker persona info for dialogue box
  const activeSpeakerPersona = useMemo(() => {
    if (!latestTurn) return null;
    if (latestTurn.speaker === "candidate") {
      return {
        name: "You (Candidate)",
        role_title: "Candidate",
        isCandidate: true,
      };
    }
    const found = personas.find((p) => p.id === latestTurn.speaker_id);
    return {
      name: found?.name ?? scenario.definition.persona.name ?? "Interviewer",
      role_title: found?.role_title ?? scenario.definition.persona.role ?? "Panelist",
      isCandidate: false,
    };
  }, [latestTurn, personas, scenario]);

  const isUserSpeaking = state === "recording";

  return (
    <div className="relative w-full rounded-2xl border-2 border-washi-300 bg-washi-100 shadow-md overflow-hidden flex flex-col justify-between min-h-[360px] sm:min-h-[420px] transition-all">
      {/* Dynamic Thematic SVG Vector Background */}
      <StageBackgrounds scenarioSlug={scenario.slug} />

      {/* Top Floating Stage HUD / Status Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-sumi-900/60 to-transparent text-white">
        <div className="flex items-center gap-2">
          {/* Hanko Emblem */}
          <span className="hanko-stamp-filled flex h-6 w-6 items-center justify-center rounded text-xs font-bold shadow-sm">
            印
          </span>
          <div>
            <h3 className="text-xs font-bold tracking-wide uppercase text-white/90 drop-shadow">
              Live Roleplay Stage
            </h3>
            <p className="text-[10px] text-white/70">
              {personas.length === 2 ? "2-on-1 Interactive AI Panel" : "1-on-1 Roleplay Simulation"}
            </p>
          </div>
        </div>

        {/* Action button to open Full Transcript History Drawer */}
        <button
          type="button"
          onClick={onToggleTranscriptDrawer}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white transition-all shadow-sm focus:outline-none"
          aria-label="Toggle transcript history drawer"
        >
          <span>📜</span>
          <span className="font-semibold">History ({turns.length})</span>
          <span className="text-[10px] opacity-80">{isDrawerOpen ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* Main Vector Character Stage Area */}
      <div className="relative z-10 flex-1 flex items-end justify-center gap-8 sm:gap-16 px-4 pt-6 pb-2">
        {personas.map((persona, index) => {
          const isThisSpeakerActive = state === "speaking" && activeSpeakerId === persona.id;
          return (
            <StageCharacter
              key={persona.id || index}
              persona={persona}
              panelIndex={index}
              isActiveSpeaker={isThisSpeakerActive}
              isUserSpeaking={isUserSpeaking}
              volume={volume}
            />
          );
        })}
      </div>

      {/* Visual Novel Dialogue Box (Pinned Bottom of Stage) */}
      <div className="relative z-20 px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="rounded-xl border border-washi-300 bg-washi-50/95 backdrop-blur-md p-3.5 sm:p-4 shadow-lg">
          {latestTurn ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-washi-200 pb-2">
                {/* Speaker Identity Tag */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      activeSpeakerPersona?.isCandidate
                        ? "bg-ai-700 text-white"
                        : "bg-shu-600 text-white shadow-sm"
                    }`}
                  >
                    【{activeSpeakerPersona?.name}】
                  </span>
                  <span className="text-xs text-sumi-500 font-medium hidden sm:inline">
                    {activeSpeakerPersona?.role_title}
                  </span>
                </div>

                {/* Turn controls: Replay Turn Button */}
                {latestTurn.speaker === "interviewer" && (
                  <button
                    type="button"
                    onClick={() =>
                      onReplayTurn(
                        cleanSpeakerTag(latestTurn.text),
                        latestTurn.speaker_id ?? undefined,
                      )
                    }
                    aria-label="Replay speech"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ai-700 hover:text-ai-800 transition-colors focus:outline-none"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                    <span>Replay Voice</span>
                  </button>
                )}
              </div>

              {/* Dialogue Text */}
              <p className="text-sm sm:text-base text-sumi-900 leading-relaxed font-medium">
                「{cleanSpeakerTag(latestTurn.text)}」
              </p>

              {/* Speech Meta details if present */}
              {latestTurn.speech_meta && (
                <div className="flex items-center gap-3 text-[11px] text-sumi-400 pt-1">
                  <span>{(latestTurn.speech_meta.duration_ms / 1000).toFixed(1)}s</span>
                  <span>&bull;</span>
                  <span>{latestTurn.speech_meta.word_count} words</span>
                  {latestTurn.speech_meta.avg_confidence != null && (
                    <>
                      <span>&bull;</span>
                      <span>
                        {Math.round(latestTurn.speech_meta.avg_confidence * 100)}% accuracy
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-sumi-500">
              Stage ready. Press the microphone below to begin conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
