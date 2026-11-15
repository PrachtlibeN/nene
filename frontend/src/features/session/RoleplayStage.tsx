import React, { useMemo } from "react";
import type { ScenarioOut, TurnOut } from "../../api/client";
import { cleanSpeakerTag } from "../../utils/speech";
import { StageBackgrounds } from "./stage/StageBackgrounds";
import { StageCharacter } from "./stage/StageCharacters";
import type { PushToTalkState } from "./types";

interface RoleplayStageProps {
  scenario: ScenarioOut;
  latestTurn: TurnOut | null;
  activeSpeakingTurn: TurnOut | null;
  state: PushToTalkState;
  volume: number;
  onReplayTurn: (text: string, speakerId?: string) => void;
}

export const RoleplayStage: React.FC<RoleplayStageProps> = ({
  scenario,
  latestTurn,
  activeSpeakingTurn,
  state,
  volume,
  onReplayTurn,
}) => {
  const personas = useMemo(() => {
    if (scenario.definition.personas && scenario.definition.personas.length > 0) {
      return scenario.definition.personas;
    }
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

  // The turn currently being displayed:
  // During sequential TTS playback, prioritize the active speaking turn; otherwise latest turn.
  const displayedTurn =
    state === "speaking" && activeSpeakingTurn ? activeSpeakingTurn : latestTurn;

  // Active speaker ID: strictly the persona speaking right now
  const activeSpeakerId = useMemo(() => {
    if (state !== "speaking") return null;
    if (activeSpeakingTurn) return activeSpeakingTurn.speaker_id ?? null;
    if (displayedTurn?.speaker === "interviewer") {
      return displayedTurn.speaker_id ?? personas[0]?.id ?? null;
    }
    return null;
  }, [state, activeSpeakingTurn, displayedTurn, personas]);

  // Speaker name for subtitle
  const speakerDisplayName = useMemo(() => {
    if (!displayedTurn) return "Ready";
    if (displayedTurn.speaker === "candidate") {
      return "You";
    }
    const found = personas.find((p) => p.id === displayedTurn.speaker_id);
    return found ? `${found.name} (${found.role_title})` : scenario.definition.persona.name || "Interviewer";
  }, [displayedTurn, personas, scenario]);

  const isUserSpeaking = state === "recording";

  return (
    <div className="relative w-full flex-1 rounded-2xl border border-washi-300 bg-washi-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[380px] sm:min-h-[480px]">
      {/* Layered SVG Vector Background */}
      <StageBackgrounds scenarioSlug={scenario.slug} />

      {/* Characters Canvas: Takes center stage (~75-80% height) */}
      <div className="relative z-10 flex-1 flex items-end justify-center gap-6 sm:gap-20 px-4 pt-4 pb-2">
        {personas.map((persona, index) => {
          const isThisSpeakerActive =
            state === "speaking" && activeSpeakerId === persona.id;
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

      {/* Minimalist Subtitle Box at Feet of Characters */}
      <div className="relative z-20 px-3 pb-3 sm:px-5 sm:pb-4">
        <div className="rounded-xl border border-washi-300 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 shadow-md">
          {displayedTurn ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-washi-200 pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ai-700">
                  {speakerDisplayName}
                </span>

                {displayedTurn.speaker === "interviewer" && (
                  <button
                    type="button"
                    onClick={() =>
                      onReplayTurn(
                        cleanSpeakerTag(displayedTurn.text),
                        displayedTurn.speaker_id ?? undefined,
                      )
                    }
                    aria-label="Replay speech"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ai-600 hover:text-ai-800 transition-colors focus:outline-none"
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
                    <span>Replay</span>
                  </button>
                )}
              </div>

              {/* Clean Subtitle Text */}
              <p className="text-sm sm:text-base font-semibold text-sumi-900 leading-snug">
                {cleanSpeakerTag(displayedTurn.text)}
              </p>
            </div>
          ) : (
            <div className="py-1 text-center text-xs text-sumi-500 font-medium">
              Simulation ready. Press the microphone below to respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
