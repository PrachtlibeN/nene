/* eslint-disable react-refresh/only-export-components */
import React, { useMemo } from "react";
import type { ScenarioOut, TurnOut } from "../../api/client";
import { cleanSpeakerTag } from "../../utils/speech";
import { StageCharacter } from "./stage/StageCharacters";
import type { PushToTalkState } from "./types";

export type StageTheme = "morning" | "golden-hour" | "gentle-day";

/**
 * Pure mapping function for scenario theme based on slug or title.
 * Defaults to "morning" for unknown/empty data.
 */
export function getScenarioTheme(
  scenario?: { slug?: string; title?: string } | null,
): StageTheme {
  if (!scenario) return "morning";
  const slug = (scenario.slug || "").toLowerCase();
  const title = (scenario.title || "").toLowerCase();

  if (
    slug.includes("project") ||
    slug.includes("pitch") ||
    title.includes("pitch") ||
    title.includes("project")
  ) {
    return "golden-hour";
  }
  if (
    slug.includes("customer") ||
    slug.includes("escalation") ||
    title.includes("customer")
  ) {
    return "gentle-day";
  }
  return "morning";
}

interface SakuraPetalConfig {
  id: number;
  leftPercent: number;
  topPercent: number;
  size: number;
  duration: number;
  delay: number;
}

export const SAKURA_PETALS: SakuraPetalConfig[] = [
  { id: 1, leftPercent: 14, topPercent: 6, size: 14, duration: 13, delay: -4.5 },
  { id: 2, leftPercent: 30, topPercent: 3, size: 13, duration: 16, delay: -11.2 },
  { id: 3, leftPercent: 48, topPercent: 10, size: 10, duration: 12, delay: -1.8 },
  { id: 4, leftPercent: 66, topPercent: 5, size: 11, duration: 17, delay: -9.0 },
  { id: 5, leftPercent: 82, topPercent: 8, size: 9, duration: 14, delay: -6.2 },
  { id: 6, leftPercent: 92, topPercent: 12, size: 8, duration: 15, delay: -13.5 },
];

export interface RoleplayStageProps {
  scenario: ScenarioOut;
  latestTurn: TurnOut | null;
  activeSpeakingTurn: TurnOut | null;
  state: PushToTalkState;
  volume: number;
  onReplayTurn: (text: string, speakerId?: string) => void;
  interimTranscript?: string;
  isEncouraging?: boolean;
}

export const RoleplayStage: React.FC<RoleplayStageProps> = ({
  scenario,
  latestTurn,
  activeSpeakingTurn,
  state,
  volume,
  onReplayTurn,
  interimTranscript = "",
  isEncouraging,
}) => {
  const theme = useMemo(() => getScenarioTheme(scenario), [scenario]);

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
  // During sequential TTS playback, prioritize active speaking turn; otherwise latest turn.
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

  // Speaker name for subtitle box
  const speakerDisplayName = useMemo(() => {
    if (!displayedTurn) return "Ready";
    if (displayedTurn.speaker === "candidate") {
      return "You";
    }
    const found = personas.find((p) => p.id === displayedTurn.speaker_id);
    return found
      ? `${found.name} (${found.role_title})`
      : scenario.definition.persona.name || "Interviewer";
  }, [displayedTurn, personas, scenario]);

  const isUserSpeaking = state === "recording";

  return (
    <div
      className={`relative w-full max-w-5xl mx-auto flex-1 rounded-2xl border border-washi-300 bg-washi-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[320px] sm:min-h-[400px] stage-theme-${theme}`}
    >
      {/* ====================================================================
          Layered Japanese Visual Novel Studio Background (From back to front)
          ==================================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      >
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Sky Gradient customized per scenario theme */}
            <linearGradient id="studioSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--sky-top, #cfe6f2)" />
              <stop offset="55%" stopColor="var(--sky-mid, #f0f7fb)" />
              <stop offset="100%" stopColor="var(--sky-bottom, #faf8f5)" />
            </linearGradient>

            {/* Static Radial Halo for Sun (Opacity-only animated) */}
            <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--sun-fill, #e8635a)" stopOpacity="0.85" />
              <stop offset="45%" stopColor="var(--sun-fill, #e8635a)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--sun-halo, rgba(247,201,212,0.3))" stopOpacity="0" />
            </radialGradient>

            {/* Glass window subtle reflection */}
            <linearGradient id="windowGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#2b4c7e" stopOpacity="0.06" />
            </linearGradient>

            {/* Wood floor */}
            <linearGradient id="studioFloor" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ece5db" />
              <stop offset="100%" stopColor="#dfd6c8" />
            </linearGradient>
          </defs>

          {/* Layer 1: Sky Backdrop */}
          <rect width="1000" height="420" fill="url(#studioSky)" />

          {/* Layer 2: Morning / Sunset Sun with Soft Breathing Halo */}
          <g className="animate-sun-breathe" style={{ transformOrigin: "740px 250px" }}>
            {/* Ambient Halo Ring */}
            <circle cx="740" cy="250" r="130" fill="url(#sunHalo)" />
            {/* Soft Sun Disc (diameter ~15% of width) */}
            <circle cx="740" cy="250" r="68" fill="var(--sun-fill, #e8635a)" opacity="0.92" />
          </g>

          {/* Layer 3: Distant Minimalist Mt. Fuji with Snow Cap */}
          <g opacity="0.82">
            {/* Mountain Body */}
            <path
              d="M 620 420 L 715 210 Q 740 205 765 210 L 860 420 Z"
              fill="var(--fuji-mountain, #5a6b8c)"
            />
            {/* Snow Cap with Soft Scalloped Edge */}
            <path
              d="M 715 210 Q 740 205 765 210 L 780 238 Q 765 252 755 240 Q 745 255 735 242 Q 725 252 710 235 Z"
              fill="var(--fuji-snow, #ffffff)"
              opacity="0.95"
            />
            {/* Low Rolling Foothills in Front (Layering Depth) */}
            <path
              d="M 540 420 Q 670 365 790 420 Z"
              fill="var(--fuji-hills, #869abf)"
              opacity="0.6"
            />
            <path
              d="M 720 420 Q 820 375 920 420 Z"
              fill="var(--fuji-hills, #869abf)"
              opacity="0.5"
            />
          </g>

          {/* Layer 4: Distant City Skyline Silhouettes */}
          <g fill="#cbd5e1" opacity="0.45">
            <rect x="80" y="240" width="55" height="180" />
            <rect x="150" y="210" width="70" height="210" />
            <rect x="235" y="260" width="50" height="160" />
            <rect x="360" y="195" width="75" height="225" />
            <rect x="450" y="235" width="60" height="185" />
          </g>

          {/* Layer 5: Layered Vector Pill Clouds (Linear slow drift) */}
          {/* Cloud 1 */}
          <g className="animate-cloud-1" opacity="0.75">
            <rect x="50" y="70" width="120" height="32" rx="16" fill="#ffffff" />
            <circle cx="90" cy="65" r="24" fill="#ffffff" />
            <circle cx="125" cy="72" r="18" fill="#ffffff" />
          </g>

          {/* Cloud 2 */}
          <g className="animate-cloud-2" opacity="0.7">
            <rect x="520" y="115" width="140" height="36" rx="18" fill="#ffffff" />
            <circle cx="565" cy="110" r="26" fill="#ffffff" />
            <circle cx="615" cy="116" r="20" fill="#ffffff" />
          </g>

          {/* Cloud 3 (Hidden on mobile < 640px to preserve GPU) */}
          <g className="animate-cloud-3 hidden sm:block" opacity="0.65">
            <rect x="800" y="45" width="105" height="28" rx="14" fill="#ffffff" />
            <circle cx="835" cy="40" r="20" fill="#ffffff" />
            <circle cx="870" cy="46" r="15" fill="#ffffff" />
          </g>

          {/* Layer 6: Panoramic Studio Window Mullions */}
          <g stroke="#94a3b8" strokeWidth="3" opacity="0.45">
            <line x1="250" y1="0" x2="250" y2="420" />
            <line x1="500" y1="0" x2="500" y2="420" />
            <line x1="750" y1="0" x2="750" y2="420" />
            <line x1="0" y1="420" x2="1000" y2="420" strokeWidth="5" stroke="#64748b" />
          </g>

          {/* Glass Highlight Sheen */}
          <rect width="1000" height="420" fill="url(#windowGlass)" />

          {/* Layer 7: Modern Hinoki Wood Floor */}
          <rect x="0" y="420" width="1000" height="180" fill="url(#studioFloor)" />
          <g stroke="#d0c6b8" strokeWidth="1" opacity="0.5">
            <line x1="0" y1="470" x2="1000" y2="470" />
            <line x1="0" y1="530" x2="1000" y2="530" />
          </g>
        </svg>

        {/* Drifting Sakura Petals (Configured array with depth variations) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {SAKURA_PETALS.map((petal, index) => (
            <div
              key={petal.id}
              className={`absolute animate-sakura-petal pointer-events-none select-none ${
                index >= 3 ? "hidden sm:block" : ""
              }`}
              style={
                {
                  left: `${petal.leftPercent}%`,
                  top: `${petal.topPercent}%`,
                  width: `${petal.size}px`,
                  height: `${petal.size * 0.72}px`,
                  "--sakura-duration": `${petal.duration}s`,
                  "--sakura-delay": `${petal.delay}s`,
                } as React.CSSProperties
              }
            >
              <svg viewBox="0 0 20 14" className="w-full h-full fill-[#F7C9D4] opacity-80">
                <path d="M 0 7 C 3 1, 10 0, 16 3 C 20 5, 20 9, 16 11 C 10 14, 3 13, 0 7 Z" />
              </svg>
            </div>
          ))}
        </div>

        {/* Bottom Scrim Gradient for Guaranteed Subtitle Contrast */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#FAF8F5]/90 via-[#FAF8F5]/40 to-transparent pointer-events-none z-10" />
      </div>

      {/* ====================================================================
          Characters Canvas: Takes center stage (~75-80% height)
          ==================================================================== */}
      <div className="relative z-10 flex-1 flex items-end justify-center gap-6 sm:gap-16 md:gap-24 px-4 pt-2 pb-2">
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
              state={state}
              isEncouraging={isEncouraging}
            />
          );
        })}
      </div>

      {/* ====================================================================
          Minimalist Subtitle Box at Feet of Characters
          High Contrast & Clean Typography
          ==================================================================== */}
      <div className="relative z-20 px-3 pb-3 sm:px-5 sm:pb-4 w-full">
        <div className="max-w-2xl mx-auto rounded-xl border border-washi-300 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 shadow-md">
          {isUserSpeaking ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-washi-200 pb-1">
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-shu-700">
                  <span className="h-2 w-2 rounded-full bg-shu-600 animate-ping inline-block" />
                  You (Speaking...)
                </span>
                <span className="text-[10px] font-semibold text-sumi-400">Live Transcript</span>
              </div>
              <div className="max-h-24 sm:max-h-28 overflow-y-auto pr-1">
                {interimTranscript ? (
                  <p className="text-xs sm:text-sm md:text-base font-medium text-ai-800 italic leading-relaxed">
                    &ldquo;{interimTranscript}&rdquo;
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-ai-600 animate-pulse align-middle" />
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm md:text-base text-sumi-500 italic leading-relaxed">
                    Listening to your voice... Speak your response clearly.
                  </p>
                )}
              </div>
            </div>
          ) : displayedTurn ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-washi-200 pb-1">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-ai-700">
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
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-ai-600 hover:text-ai-800 transition-colors focus:outline-none"
                  >
                    <svg
                      className="h-3 w-3"
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

              {/* Clean Subtitle Text with smooth scroll and refined typography */}
              <div className="max-h-24 sm:max-h-28 overflow-y-auto pr-1">
                <p className="text-xs sm:text-sm md:text-base font-medium text-sumi-800 leading-relaxed">
                  {cleanSpeakerTag(displayedTurn.text)}
                </p>
              </div>
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
