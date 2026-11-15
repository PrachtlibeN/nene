import React from "react";
import type { NeneActivity } from "./useNeneBehavior";

export interface NeneProps {
  activity: NeneActivity;
  pupilOffset?: { x: number; y: number };
  isBlinking?: boolean;
  onClick?: () => void;
  className?: string;
}

const NeneComponent: React.FC<NeneProps> = ({
  activity,
  pupilOffset = { x: 0, y: 0 },
  isBlinking = false,
  onClick,
  className = "",
}) => {
  return (
    <div
      data-activity={activity}
      className={`nene-container relative inline-flex items-center justify-center select-none ${className}`}
    >
      {/* Accessible transparent interactive button overlay */}
      <button
        type="button"
        onClick={onClick}
        aria-label="Nene"
        className="absolute inset-0 z-30 w-full h-full cursor-pointer rounded-2xl bg-transparent border-0 p-0 focus:outline-none focus:ring-2 focus:ring-[#3B82D6] focus:ring-offset-2"
        title="Nene"
      />

      {/* SVG Mascot Graphic */}
      <svg
        aria-hidden="true"
        viewBox="0 0 160 170"
        className="nene-svg w-36 h-40 sm:w-44 sm:h-48 overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Feather body gradient */}
          <linearGradient id="neneBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FCFAF2" />
            <stop offset="100%" stopColor="#F5EFE0" />
          </linearGradient>

          {/* Graduation cap gradient */}
          <linearGradient id="neneCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1C57A8" />
            <stop offset="100%" stopColor="#0F3A73" />
          </linearGradient>

          {/* Headphones band gradient */}
          <linearGradient id="neneHpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F3A73" />
            <stop offset="50%" stopColor="#3B82D6" />
            <stop offset="100%" stopColor="#0F3A73" />
          </linearGradient>
        </defs>

        {/* Emotion Icons Floating Above Nene */}
        <g id="nene-emojis" className="nene-emojis">
          {/* Heart on Click */}
          {activity === "clicked" && (
            <g className="nene-emoji-heart" transform="translate(100, 15)">
              <path
                d="M 12 4 Q 12 0 8 0 Q 4 0 4 4 Q 4 8 12 14 Q 20 8 20 4 Q 20 0 16 0 Q 12 0 12 4 Z"
                fill="#D64545"
              />
            </g>
          )}

          {/* Music Notes on Humming */}
          {activity === "humming" && (
            <g className="nene-emoji-humming" transform="translate(105, 12)">
              <path
                d="M 6 12 L 6 3 L 14 1 L 14 10 M 6 6 L 14 4"
                stroke="#1C57A8"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="4" cy="12" r="2.5" fill="#1C57A8" />
              <circle cx="12" cy="10" r="2.5" fill="#1C57A8" />
            </g>
          )}

          {/* Sparkles on Excited */}
          {activity === "excited" && (
            <g className="nene-emoji-excited" transform="translate(105, 10)">
              <polygon points="8,0 10,6 16,8 10,10 8,16 6,10 0,8 6,6" fill="#FFC857" />
            </g>
          )}

          {/* Three Dots (...) on Sleepy */}
          {activity === "sleepy" && (
            <g className="nene-emoji-sleepy" transform="translate(100, 18)">
              <circle cx="3" cy="8" r="2" fill="#4A607A" opacity="0.6" />
              <circle cx="9" cy="5" r="2.2" fill="#4A607A" opacity="0.8" />
              <circle cx="16" cy="2" r="2.5" fill="#4A607A" opacity="0.9" />
            </g>
          )}
        </g>

        {/* Books Stack Base */}
        <g id="nene-books" className="nene-books" transform="translate(20, 138)">
          {/* Bottom Book: ULIS Deep Blue */}
          <rect x="10" y="14" width="100" height="12" rx="3" fill="#0F3A73" />
          <path d="M 12 17 L 108 17" stroke="#FFC857" strokeWidth="1.5" opacity="0.8" />
          <rect x="15" y="18" width="90" height="2" fill="#E2E8F0" opacity="0.6" />

          {/* Middle Book: Sunlight Amber Gold */}
          <rect x="18" y="4" width="86" height="11" rx="2.5" fill="#FFC857" />
          <rect x="22" y="7" width="76" height="1.8" fill="#FFFFFF" opacity="0.75" />

          {/* Top Open / Closed Book: Sakura Pastel */}
          <rect x="24" y="-4" width="74" height="9" rx="2" fill="#3B82D6" />
        </g>

        {/* Orange Feet */}
        <g id="nene-feet" className="nene-feet" fill="#F2994A">
          <ellipse cx="62" cy="134" rx="7" ry="3.5" />
          <ellipse cx="86" cy="134" rx="7" ry="3.5" />
        </g>

        {/* Mascot Body & Breathing Group */}
        <g id="nene-body-group" className="nene-breathing" style={{ transformOrigin: "74px 130px" }}>
          {/* Tail Feathers */}
          <path d="M 40 100 Q 30 105 32 115 Q 40 112 45 106 Z" fill="#EADFC9" />

          {/* Plump Round Body */}
          <ellipse cx="74" cy="98" rx="36" ry="35" fill="url(#neneBodyGrad)" stroke="#E5DAC5" strokeWidth="1" />

          {/* Soft Cream Belly Highlight */}
          <ellipse cx="74" cy="104" rx="26" ry="24" fill="#FFFFFF" opacity="0.85" />

          {/* Left Wing */}
          <g id="nene-wing-left" className="nene-wing-l" style={{ transformOrigin: "42px 90px" }}>
            <path
              d="M 42 86 C 36 94 36 108 44 116 C 48 112 50 100 48 90 Z"
              fill="#F5EFE0"
              stroke="#DECDB0"
              strokeWidth="0.8"
            />
          </g>

          {/* Right Wing */}
          <g id="nene-wing-right" className="nene-wing-r" style={{ transformOrigin: "106px 90px" }}>
            <path
              d="M 106 86 C 112 94 112 108 104 116 C 100 112 98 100 100 90 Z"
              fill="#F5EFE0"
              stroke="#DECDB0"
              strokeWidth="0.8"
            />
          </g>

          {/* Head & Face Group */}
          <g id="nene-head" className="nene-head" style={{ transformOrigin: "74px 75px" }}>
            {/* Round Head */}
            <circle cx="74" cy="74" r="28" fill="url(#neneBodyGrad)" />

            {/* Rosy Sakura Cheeks */}
            <ellipse cx="55" cy="80" rx="4.5" ry="3" fill="#F8C8D8" opacity="0.75" />
            <ellipse cx="93" cy="80" rx="4.5" ry="3" fill="#F8C8D8" opacity="0.75" />

            {/* Beak (Cute Orange Cone) */}
            <polygon points="74,75 79,83 69,83" fill="#F2994A" />

            {/* Eyes Group with Blinking and Pupil Tracking */}
            <g id="nene-eyes">
              {/* Sleeping Eyes (Happy Curved Arcs) */}
              {activity === "sleepy" ? (
                <g stroke="#14304F" strokeWidth="2" strokeLinecap="round" fill="none">
                  <path d="M 58 74 Q 63 70 68 74" />
                  <path d="M 80 74 Q 85 70 90 74" />
                </g>
              ) : isBlinking ? (
                /* Blinking Closed Slits */
                <g stroke="#14304F" strokeWidth="2" strokeLinecap="round">
                  <line x1="59" y1="73" x2="67" y2="73" />
                  <line x1="81" y1="73" x2="89" y2="73" />
                </g>
              ) : (
                /* Wide Open Cute Eyes */
                <g>
                  {/* Left Eye White & Pupil */}
                  <ellipse cx="63" cy="72" rx="5" ry="6" fill="#FFFFFF" />
                  <g style={{ transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)` }}>
                    <circle cx="63" cy="72" r="3.6" fill="#14304F" />
                    {/* Catchlight sparkle */}
                    <circle cx="64.5" cy="70.5" r="1.3" fill="#FFFFFF" />
                  </g>

                  {/* Right Eye White & Pupil */}
                  <ellipse cx="85" cy="72" rx="5" ry="6" fill="#FFFFFF" />
                  <g style={{ transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)` }}>
                    <circle cx="85" cy="72" r="3.6" fill="#14304F" />
                    {/* Catchlight sparkle */}
                    <circle cx="86.5" cy="70.5" r="1.3" fill="#FFFFFF" />
                  </g>
                </g>
              )}
            </g>

            {/* Headphones (Over-Ear) */}
            <g id="nene-headphones">
              {/* Arch Band */}
              <path
                d="M 45 74 C 44 48 104 48 103 74"
                fill="none"
                stroke="url(#neneHpGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Left Cup */}
              <rect x="42" y="68" width="6" height="13" rx="3" fill="#0F3A73" />
              <rect x="44" y="70" width="2" height="9" rx="1" fill="#FFC857" />
              {/* Right Cup */}
              <rect x="100" y="68" width="6" height="13" rx="3" fill="#0F3A73" />
              <rect x="102" y="70" width="2" height="9" rx="1" fill="#FFC857" />
            </g>

            {/* Academic Graduation Cap (Mortarboard) */}
            <g id="nene-mortarboard" transform="translate(0, -2)">
              {/* Cap Base */}
              <ellipse cx="74" cy="51" rx="14" ry="4.5" fill="#0F3A73" />
              {/* Top Rhombus Diamond */}
              <polygon points="74,38 102,46 74,54 46,46" fill="url(#neneCapGrad)" />
              {/* Cap Center Button */}
              <circle cx="74" cy="46" r="2" fill="#FFC857" />
              {/* Golden Hanging Tassel */}
              <g id="nene-tassel" className="nene-tassel" style={{ transformOrigin: "74px 46px" }}>
                <path d="M 74 46 Q 84 50 88 60" fill="none" stroke="#FFC857" strokeWidth="1.6" />
                <polygon points="88,60 91,66 85,66" fill="#FFC857" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export const Nene = React.memo(NeneComponent);
