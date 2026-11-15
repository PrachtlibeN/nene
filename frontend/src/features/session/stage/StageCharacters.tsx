import React from "react";
import type { ScenarioPanelPersona } from "../../../api/client";

interface StageCharacterProps {
  persona: ScenarioPanelPersona;
  panelIndex: number; // 0 for AI #1, 1 for AI #2
  isActiveSpeaker: boolean;
  isUserSpeaking: boolean;
  volume: number; // 0..1
}

export const StageCharacter: React.FC<StageCharacterProps> = ({
  persona,
  panelIndex,
  isActiveSpeaker,
  isUserSpeaking,
  volume,
}) => {
  const isFemale =
    persona.voice_gender === "female" ||
    persona.name.toLowerCase().includes("sarah") ||
    persona.name.toLowerCase().includes("priya") ||
    persona.name.toLowerCase().includes("nina");

  // Lip-sync: calculate mouth opening scale based on speech volume
  const mouthOpenAmount = isActiveSpeaker ? Math.min(1, Math.max(0, volume * 1.6)) : 0;

  return (
    <div
      className={`relative flex flex-col items-center transition-all duration-300 ${
        isActiveSpeaker
          ? "scale-105 z-20 filter drop-shadow-[0_10px_20px_rgba(43,76,126,0.25)]"
          : isUserSpeaking
            ? "scale-100 z-10 opacity-95"
            : "scale-95 z-10 opacity-85 hover:opacity-100"
      }`}
    >
      {/* Active Speaker Hanko Badge */}
      <div
        className={`mb-1 transition-all duration-300 ${
          isActiveSpeaker ? "opacity-100 -translate-y-1" : "opacity-70 translate-y-0"
        }`}
      >
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border ${
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
      <div className="relative w-44 h-56 sm:w-56 sm:h-72 md:w-64 md:h-80 flex items-end justify-center">
        {/* Ripple Waves expanding from base when speaking */}
        {isActiveSpeaker && (
          <div className="absolute -bottom-4 w-48 sm:w-60 h-16 pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 rounded-[100%] border-2 border-ai-500 animate-hamon-1 opacity-70" />
            <div className="absolute inset-0 rounded-[100%] border border-ai-400 animate-hamon-2 opacity-50" />
            <div className="absolute inset-0 rounded-[100%] border border-shu-500 animate-hamon-3 opacity-30" />
          </div>
        )}

        {/* Character Base SVG */}
        <svg
          viewBox="0 0 200 260"
          className="w-full h-full overflow-visible transition-transform duration-500"
          style={{
            transform: isUserSpeaking
              ? "rotate(-0.8deg) translateY(-2px)"
              : isActiveSpeaker
                ? `translateY(${Math.sin(volume * 10) * 2}px)`
                : undefined,
          }}
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

          {/* Idle Swaying Group */}
          <g className="animate-idle-sway" style={{ transformOrigin: "bottom center" }}>
            {/* Shoulders & Business Attire */}
            <g id="body">
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
              <circle cx="76" cy="190" r="3" fill="#E04F3E" />
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

            {/* Head & Face Group */}
            <g id="head" style={{ transformOrigin: "100px 120px" }}>
              {/* Head Shadow */}
              <ellipse cx="100" cy="115" rx="36" ry="42" fill={`url(#skinGrad-${panelIndex})`} />

              {/* Character Hairstyles */}
              {isFemale ? (
                /* Female Bob / Chic Hair */
                <g id="female-hair">
                  <path
                    d="M 60 115 Q 60 70 100 68 Q 140 70 140 115 Q 146 145 138 160 Q 128 135 125 115 Q 100 78 72 115 Q 62 145 58 155 Q 54 135 60 115 Z"
                    fill={`url(#hairGrad-${panelIndex})`}
                  />
                  {/* Soft side bangs */}
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
                /* Male Neat Professional Haircut */
                <g id="male-hair">
                  <path
                    d="M 62 110 Q 60 70 100 66 Q 140 70 138 110 Q 130 82 100 80 Q 70 82 62 110 Z"
                    fill={`url(#hairGrad-${panelIndex})`}
                  />
                  {/* Eyebrows */}
                  <path
                    d="M 76 98 Q 88 95 94 98"
                    stroke="#1A202C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 106 98 Q 112 95 124 98"
                    stroke="#1A202C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              )}

              {/* Eyes with Natural Blinking Keyframes */}
              <g id="eyes" className="animate-blink" style={{ transformOrigin: "100px 108px" }}>
                {/* Left Eye */}
                <ellipse cx="85" cy="108" rx="6.5" ry="4" fill="#FFFFFF" />
                <circle cx="86" cy="108" r="3" fill="#1E2022" />
                <circle cx="87.2" cy="106.8" r="1.1" fill="#FFFFFF" />

                {/* Right Eye */}
                <ellipse cx="115" cy="108" rx="6.5" ry="4" fill="#FFFFFF" />
                <circle cx="114" cy="108" r="3" fill="#1E2022" />
                <circle cx="115.2" cy="106.8" r="1.1" fill="#FFFFFF" />
              </g>

              {/* Glasses for Male Engineer or Female Executive */}
              {(!isFemale || persona.name.toLowerCase().includes("nina")) && (
                <g id="glasses" stroke="#2B4C7E" strokeWidth="1.6" fill="none">
                  {/* Left Rim */}
                  <rect x="74" y="100" width="22" height="15" rx="3" fill="rgba(255,255,255,0.2)" />
                  {/* Right Rim */}
                  <rect x="104" y="100" width="22" height="15" rx="3" fill="rgba(255,255,255,0.2)" />
                  {/* Bridge */}
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

              {/* Dynamic Animated Mouth (Lip-sync & Volume reactive) */}
              <g id="mouth" style={{ transformOrigin: "100px 138px" }}>
                {mouthOpenAmount > 0.1 ? (
                  /* Open speaking mouth */
                  <ellipse
                    cx="100"
                    cy="138"
                    rx={4 + mouthOpenAmount * 4}
                    ry={2 + mouthOpenAmount * 5}
                    fill="#9B2C2C"
                    stroke="#742A2A"
                    strokeWidth="1"
                  />
                ) : (
                  /* Gentle smile / resting line */
                  <path
                    d="M 93 138 Q 100 142 107 138"
                    stroke="#8C5C50"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
