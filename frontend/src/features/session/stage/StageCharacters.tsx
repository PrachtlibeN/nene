/* eslint-disable react-refresh/only-export-components */
import React, { useMemo } from "react";
import type { ScenarioPanelPersona } from "../../../api/client";
import type { PushToTalkState } from "../types";

export type Expression = "speaking" | "listening" | "thinking" | "encouraging" | "idle";

export interface StageCharacterProps {
  persona: ScenarioPanelPersona;
  panelIndex: number; // 0 for AI #1, 1 for AI #2
  isActiveSpeaker: boolean;
  isUserSpeaking: boolean;
  volume: number; // 0..1
  state?: PushToTalkState;
  expression?: Expression;
  isEncouraging?: boolean;
}

/**
 * Pure mapping function from session states & props to character Expression.
 * Deterministic and easily testable.
 */
export function getCharacterExpression(options: {
  isActiveSpeaker: boolean;
  isUserSpeaking: boolean;
  state?: PushToTalkState;
  isEncouraging?: boolean;
  customExpression?: Expression;
}): Expression {
  if (options.customExpression) return options.customExpression;
  if (options.isEncouraging) return "encouraging";
  if (options.isActiveSpeaker) return "speaking";
  if (options.isUserSpeaking) return "listening";

  if (options.state) {
    if (
      options.state === "transcribing" ||
      options.state === "waiting_reply" ||
      options.state === "sending"
    ) {
      return "thinking";
    }
    if (options.state === "review") {
      return "encouraging";
    }
    if (options.state === "recording") {
      return "listening";
    }
  }

  return "idle";
}

const StageCharacterComponent: React.FC<StageCharacterProps> = ({
  persona,
  panelIndex,
  isActiveSpeaker,
  isUserSpeaking,
  volume,
  state,
  expression: customExpression,
  isEncouraging,
}) => {
  const isFemale =
    persona.voice_gender === "female" ||
    persona.name.toLowerCase().includes("sarah") ||
    persona.name.toLowerCase().includes("priya") ||
    persona.name.toLowerCase().includes("nina");

  // Derive the current expression using the pure mapping function
  const expression = useMemo(
    () =>
      getCharacterExpression({
        isActiveSpeaker,
        isUserSpeaking,
        state,
        isEncouraging,
        customExpression,
      }),
    [isActiveSpeaker, isUserSpeaking, state, isEncouraging, customExpression],
  );

  // Lip-sync: calculate mouth opening scale based on speech volume (smoothed 0..1)
  const mouthOpenAmount = isActiveSpeaker ? Math.min(1, Math.max(0, volume * 1.6)) : 0;

  // Eyebrows transformation per expression
  const leftEyebrowTransform = useMemo(() => {
    switch (expression) {
      case "speaking":
        return "translate(0px, -2px) rotate(2deg)";
      case "thinking":
        return "translate(1px, 1.5px) rotate(-3.5deg)";
      case "encouraging":
        return "translate(0px, -1px) rotate(1deg)";
      default:
        return "translate(0px, 0px) rotate(0deg)";
    }
  }, [expression]);

  const rightEyebrowTransform = useMemo(() => {
    switch (expression) {
      case "speaking":
        return "translate(0px, -2px) rotate(-2deg)";
      case "thinking":
        return "translate(-1px, 1.5px) rotate(3.5deg)";
      case "encouraging":
        return "translate(0px, -1px) rotate(-1deg)";
      default:
        return "translate(0px, 0px) rotate(0deg)";
    }
  }, [expression]);

  // Head tilt and posture based on speaker index & expression
  const headTransform = useMemo(() => {
    const partnerDirection = panelIndex === 0 ? 1 : -1;
    switch (expression) {
      case "speaking":
        return `rotate(${partnerDirection * 2.2}deg) translateY(-1px)`;
      case "thinking":
        return "rotate(-1deg) translateY(-1.5px)";
      case "encouraging":
        return `rotate(${partnerDirection * 1.2}deg) translateY(0.5px)`;
      case "listening":
        return `rotate(${partnerDirection * 0.8}deg)`;
      default:
        return "rotate(0deg) translateY(0px)";
    }
  }, [expression, panelIndex]);

  // Pupil offset during contemplation / thinking
  const pupilTransform = expression === "thinking" ? "translate(-1.5px, -2.2px)" : "translate(0px, 0px)";

  return (
    <div
      data-expression={expression}
      data-panel-index={panelIndex}
      className={`relative flex flex-col items-center transition-transform duration-300 ${
        isActiveSpeaker
          ? "scale-105 z-20"
          : isUserSpeaking
            ? "scale-100 z-10 opacity-95"
            : "scale-95 z-10 opacity-85 hover:opacity-100"
      }`}
    >
      {/* Active Speaker Hanko Badge */}
      <div
        className={`mb-1 transition-all duration-300 ${
          isActiveSpeaker ? "opacity-100 -translate-y-1" : "opacity-75 translate-y-0"
        }`}
      >
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs border ${
            isActiveSpeaker
              ? "bg-ai-700 text-white border-ai-500 shadow-ai-200/50"
              : "bg-white/90 text-sumi-800 border-washi-300"
          }`}
        >
          {isActiveSpeaker ? (
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-sumi-400" />
          )}
          <span>{persona.name}</span>
          <span className="text-[10px] opacity-80 font-normal hidden sm:inline">
            &bull; {persona.role_title}
          </span>
        </div>
      </div>

      {/* SVG Character Model with Animated Layers */}
      <div className="relative w-36 h-48 sm:w-48 sm:h-64 md:w-56 md:h-72 flex items-end justify-center">
        {/* Soft Thinking Bubble indicator */}
        {expression === "thinking" && (
          <div
            aria-hidden="true"
            className="absolute -top-3 sm:-top-4 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border border-washi-300 shadow-xs animate-thinking-dots pointer-events-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ai-600 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-ai-600 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-ai-600 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}

        {/* Ripple Waves expanding from base when speaking (subtle, non-distracting) */}
        {isActiveSpeaker && (
          <div
            aria-hidden="true"
            className="absolute -bottom-4 w-48 sm:w-60 h-16 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-[100%] border-2 border-ai-500 animate-hamon-1 opacity-60" />
            <div className="absolute inset-0 rounded-[100%] border border-ai-400 animate-hamon-2 opacity-40" />
            <div className="absolute inset-0 rounded-[100%] border border-shu-500 animate-hamon-3 opacity-25" />
          </div>
        )}

        {/* Character Base SVG */}
        <svg
          viewBox="0 0 200 260"
          className={`w-full h-full overflow-visible ${
            panelIndex === 0 ? "animate-breath-a" : "animate-breath-b"
          }`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`suitGrad-${panelIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {isFemale ? (
                <>
                  <stop offset="0%" stopColor="#2B4C7E" />
                  <stop offset="100%" stopColor="#1A2F50" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#2D3748" />
                  <stop offset="100%" stopColor="#1A202C" />
                </>
              )}
            </linearGradient>
            <linearGradient id={`skinGrad-${panelIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF2E8" />
              <stop offset="100%" stopColor="#F9DFD2" />
            </linearGradient>
            <linearGradient id={`hairGrad-${panelIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
              {isFemale ? (
                <>
                  <stop offset="0%" stopColor="#4A3428" />
                  <stop offset="100%" stopColor="#2E2018" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#2D3748" />
                  <stop offset="100%" stopColor="#171923" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Body and Shoulders */}
          <g id="body" style={{ transformOrigin: "bottom center" }}>
            {/* Torso/Blazer */}
            <path
              d="M 40 260 L 50 170 Q 100 160 150 170 L 160 260 Z"
              fill={`url(#suitGrad-${panelIndex})`}
            />
            {/* Shirt/Collar */}
            <polygon points="85,165 115,165 108,205 92,205" fill="#FFFFFF" />
            {/* Lapels */}
            <path
              d="M 70 170 L 95 220 L 78 220 Z"
              fill={isFemale ? "#38619E" : "#3F4E5E"}
            />
            <path
              d="M 130 170 L 105 220 L 122 220 Z"
              fill={isFemale ? "#38619E" : "#3F4E5E"}
            />

            {/* Red Lapel Pin / Hanko Badge */}
            <circle cx="76" cy="190" r="3" fill="#C8423B" />
          </g>

          {/* Neck */}
          <rect
            x="90"
            y="140"
            width="20"
            height="28"
            rx="4"
            fill={`url(#skinGrad-${panelIndex})`}
          />

          {/* Head & Face Group with Expression Transitions */}
          <g
            id="head"
            className={expression === "listening" ? "animate-gentle-nod" : undefined}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: headTransform,
              transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Head Base Silhouette */}
            <ellipse cx="100" cy="115" rx="36" ry="42" fill={`url(#skinGrad-${panelIndex})`} />

            {/* Soft Sakura Cheek Blush (Encouraging expression) */}
            <g id="cheeks">
              <ellipse
                cx="75"
                cy="124"
                rx="7"
                ry="4"
                fill="#F7C9D4"
                opacity={expression === "encouraging" ? 0.4 : 0}
                style={{ transition: "opacity 300ms ease-in-out" }}
              />
              <ellipse
                cx="125"
                cy="124"
                rx="7"
                ry="4"
                fill="#F7C9D4"
                opacity={expression === "encouraging" ? 0.4 : 0}
                style={{ transition: "opacity 300ms ease-in-out" }}
              />
            </g>

            {/* Hairstyles */}
            {isFemale ? (
              <g id="female-hair">
                <path
                  d="M 60 115 Q 60 70 100 68 Q 140 70 140 115 Q 146 145 138 160 Q 128 135 125 115 Q 100 78 72 115 Q 62 145 58 155 Q 54 135 60 115 Z"
                  fill={`url(#hairGrad-${panelIndex})`}
                />
                <path
                  d="M 68 85 Q 100 90 128 100 Q 118 85 96 78 Z"
                  fill="#3A281E"
                  opacity="0.85"
                />
                {/* Pearl Earring */}
                <circle cx="62" cy="120" r="2.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
                <circle cx="138" cy="120" r="2.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
              </g>
            ) : (
              <g id="male-hair">
                <path
                  d="M 62 110 Q 60 70 100 66 Q 140 70 138 110 Q 130 82 100 80 Q 70 82 62 110 Z"
                  fill={`url(#hairGrad-${panelIndex})`}
                />
              </g>
            )}

            {/* Eyebrows (Dynamic Angle & Elevation) */}
            <g id="eyebrows">
              {/* Left Eyebrow */}
              <path
                d="M 76 98 Q 88 95 94 98"
                stroke="#1A202C"
                strokeWidth={isFemale ? "2.2" : "2.6"}
                strokeLinecap="round"
                fill="none"
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transform: leftEyebrowTransform,
                  transition: "transform 250ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              {/* Right Eyebrow */}
              <path
                d="M 106 98 Q 112 95 124 98"
                stroke="#1A202C"
                strokeWidth={isFemale ? "2.2" : "2.6"}
                strokeLinecap="round"
                fill="none"
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transform: rightEyebrowTransform,
                  transition: "transform 250ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </g>

            {/* Eyes with Natural Blinking & Pupil Shifts */}
            <g
              id="eyes"
              className={panelIndex === 0 ? "animate-blink-a" : "animate-blink-b"}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              {/* Normal Eyes (Round Pupils) */}
              <g
                id="normal-eyes"
                style={{
                  opacity: expression === "encouraging" ? 0 : 1,
                  transition: "opacity 200ms ease-in-out",
                }}
              >
                {/* Left Eye */}
                <ellipse cx="85" cy="108" rx="6.5" ry="4" fill="#FFFFFF" />
                <g style={{ transform: pupilTransform, transition: "transform 250ms ease-out" }}>
                  <circle cx="86" cy="108" r="3" fill="#1E2022" />
                  <circle cx="87.2" cy="106.8" r="1.1" fill="#FFFFFF" />
                </g>

                {/* Right Eye */}
                <ellipse cx="115" cy="108" rx="6.5" ry="4" fill="#FFFFFF" />
                <g style={{ transform: pupilTransform, transition: "transform 250ms ease-out" }}>
                  <circle cx="114" cy="108" r="3" fill="#1E2022" />
                  <circle cx="115.2" cy="106.8" r="1.1" fill="#FFFFFF" />
                </g>
              </g>

              {/* Encouraging Smiling Eyes (^ ^ Crescent Arcs) */}
              <g
                id="smiling-eyes"
                stroke="#1E2022"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
                style={{
                  opacity: expression === "encouraging" ? 1 : 0,
                  transition: "opacity 200ms ease-in-out",
                }}
              >
                <path d="M 79 110 Q 85 104 91 110" />
                <path d="M 109 110 Q 115 104 121 110" />
              </g>
            </g>

            {/* Glasses for Male Engineer or Female Executive */}
            {(!isFemale || persona.name.toLowerCase().includes("nina")) && (
              <g id="glasses" stroke="#2B4C7E" strokeWidth="1.6" fill="none">
                <rect x="74" y="100" width="22" height="15" rx="3" fill="rgba(255,255,255,0.2)" />
                <rect x="104" y="100" width="22" height="15" rx="3" fill="rgba(255,255,255,0.2)" />
                <line x1="96" y1="107" x2="104" y2="107" />
              </g>
            )}

            {/* Nose */}
            <path
              d="M 99 116 L 100 125 L 97 126"
              stroke="#D4A792"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
            />

            {/* Dynamic Mouth Group */}
            <g id="mouth" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              {mouthOpenAmount > 0.08 ? (
                /* Speaking open mouth (Volume-reactive with smooth scaleY transition, bounded 0.25..1.15) */
                <ellipse
                  cx="100"
                  cy="138"
                  rx={4 + mouthOpenAmount * 3.5}
                  ry={2 + mouthOpenAmount * 3.5}
                  fill="#9B2C2C"
                  stroke="#742A2A"
                  strokeWidth="1"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    transform: `scaleY(${Math.max(0.25, Math.min(1.15, 0.65 + mouthOpenAmount * 0.45))})`,
                    transition: "transform 100ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              ) : expression === "thinking" ? (
                /* Flat thoughtful/composed line */
                <path
                  d="M 94 138 L 106 138"
                  stroke="#8C5C50"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              ) : expression === "encouraging" ? (
                /* Warm open smile */
                <path
                  d="M 91 137 Q 100 145 109 137"
                  stroke="#8C5C50"
                  strokeWidth="2"
                  fill="#9B2C2C"
                  strokeLinecap="round"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              ) : expression === "listening" ? (
                /* Gentle friendly listening smile */
                <path
                  d="M 92 137 Q 100 143 108 137"
                  stroke="#8C5C50"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              ) : (
                /* Idle resting smile */
                <path
                  d="M 93 138 Q 100 142 107 138"
                  stroke="#8C5C50"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              )}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export const StageCharacter = React.memo(StageCharacterComponent);
