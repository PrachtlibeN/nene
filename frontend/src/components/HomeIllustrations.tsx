import React from "react";

/**
 * Seigaiha Japanese Wave Pattern Definition
 * Uses subtle ULIS blue strokes (opacity 0.05)
 */
export const SeigaihaHeroBackground: React.FC = () => {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="ulis-seigaiha" width="60" height="30" patternUnits="userSpaceOnUse">
          <path
            d="M 0 30 A 30 30 0 0 1 60 30 A 24 24 0 0 0 6 30 A 18 18 0 0 1 54 30 A 12 12 0 0 0 12 30 A 6 6 0 0 1 48 30 Z"
            fill="none"
            stroke="#1C57A8"
            strokeWidth="1.2"
          />
          <path d="M 30 15 A 30 30 0 0 1 90 15" fill="none" stroke="#1C57A8" strokeWidth="1.2" />
          <path d="M -30 15 A 30 30 0 0 1 30 15" fill="none" stroke="#1C57A8" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ulis-seigaiha)" />
    </svg>
  );
};

/**
 * Hero Ambient Learning Decorative Icons
 * Max 2 continuous moving elements (translateY ±4px, 6-8s); others static.
 * On < 640px, 2 elements are dropped for performance.
 */
export const HeroBackgroundDecorations: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
    >
      {/* 1. Open Book (Floating slowly 1) */}
      <div className="absolute top-4 left-6 opacity-35 animate-decor-float-1">
        <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
          <path
            d="M 17 6 C 21 3, 28 3, 33 5 L 33 22 C 28 20, 21 20, 17 23 C 13 20, 6 20, 1 22 L 1 5 C 6 3, 13 3, 17 6 Z"
            fill="#BFE0FA"
            stroke="#1C57A8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <line x1="17" y1="6" x2="17" y2="23" stroke="#1C57A8" strokeWidth="1.5" />
          <path d="M 5 10 Q 10 9 14 11" stroke="#1C57A8" strokeWidth="1" strokeLinecap="round" />
          <path d="M 20 11 Q 24 9 29 10" stroke="#1C57A8" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>

      {/* 2. Idea Lightbulb (Floating slowly 2 with warm gold accent) */}
      <div className="absolute top-12 left-1/3 opacity-30 animate-decor-float-2 hidden sm:block">
        <svg width="26" height="32" viewBox="0 0 26 32" fill="none">
          <path
            d="M 13 2 C 7 2, 3 6, 3 12 C 3 16, 6 18, 8 21 L 18 21 C 20 18, 23 16, 23 12 C 23 6, 19 2, 13 2 Z"
            fill="#FFC857"
            opacity="0.75"
          />
          <path
            d="M 13 2 C 7 2, 3 6, 3 12 C 3 16, 6 18, 8 21 L 18 21 C 20 18, 23 16, 23 12 C 23 6, 19 2, 13 2 Z"
            stroke="#1C57A8"
            strokeWidth="1.5"
          />
          <rect x="9" y="22" width="8" height="5" rx="1.5" fill="#1C57A8" />
          <line x1="11" y1="29" x2="15" y2="29" stroke="#1C57A8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* 3. Speaking Bubble (Static, visual only - no text) */}
      <div className="absolute bottom-6 left-12 opacity-25">
        <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
          <path
            d="M 4 4 C 4 2, 6 0, 9 0 L 23 0 C 26 0, 28 2, 28 4 L 28 16 C 28 18, 26 20, 23 20 L 12 20 L 6 26 L 6 20 L 4 20 C 2 20, 0 18, 0 16 L 0 4 Z"
            fill="#DCEBFB"
            stroke="#1C57A8"
            strokeWidth="1.4"
          />
          <circle cx="8" cy="10" r="1.8" fill="#1C57A8" />
          <circle cx="14" cy="10" r="1.8" fill="#1C57A8" />
          <circle cx="20" cy="10" r="1.8" fill="#1C57A8" />
        </svg>
      </div>

      {/* 4. Academic Star (Static) */}
      <div className="absolute top-6 right-1/4 opacity-35 hidden sm:block">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <polygon
            points="11,1 14,8 21,9 16,14 17,21 11,17 5,21 6,14 1,9 8,8"
            fill="#FFC857"
            stroke="#1C57A8"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* 5. Pencil / Milestone Roadmap Icon (Static) */}
      <div className="absolute bottom-4 right-1/3 opacity-25 hidden md:block">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M 4 24 L 8 23 L 23 8 L 19 4 L 4 19 Z"
            fill="#DCEBFB"
            stroke="#1C57A8"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <polygon points="4,24 2,26 8,23" fill="#D64545" />
          <line x1="16" y1="7" x2="20" y2="11" stroke="#1C57A8" strokeWidth="1.4" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Unified 16/9 Vector Illustrations for Scenario Cards
 * Clean foreign language academy aesthetic, pastel blue base with Sun Gold or Vermilion accent.
 */
export const ScenarioIllustration: React.FC<{ slug: string }> = ({ slug }) => {
  const isCustomer = slug.includes("customer") || slug.includes("escalation") || slug.includes("client");
  const isPitch = slug.includes("pitch") || slug.includes("project") || slug.includes("leadership");

  // 1. Customer Escalation & Client Crisis: Headset + Phone + Calming Heart
  if (isCustomer) {
    return (
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full object-cover"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cardGradCustomer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EBF5FF" />
            <stop offset="100%" stopColor="#D4E8FC" />
          </linearGradient>
        </defs>
        {/* Background Canvas */}
        <rect width="320" height="180" fill="url(#cardGradCustomer)" />

        {/* Geometric desk platform */}
        <path d="M 0 145 L 320 145" stroke="#BFE0FA" strokeWidth="2" />
        <rect x="30" y="146" width="260" height="34" fill="#BFE0FA" opacity="0.3" />

        {/* Customer Support Desk Phone */}
        <rect x="75" y="95" width="55" height="42" rx="6" fill="#FFFFFF" stroke="#1C57A8" strokeWidth="2" />
        <rect x="83" y="103" width="39" height="18" rx="3" fill="#EBF5FF" />
        <circle cx="90" cy="128" r="2.5" fill="#3B82D6" />
        <circle cx="102" cy="128" r="2.5" fill="#3B82D6" />
        <circle cx="114" cy="128" r="2.5" fill="#3B82D6" />

        {/* Professional Headset */}
        <g transform="translate(145, 45)">
          {/* Headband Arc */}
          <path
            d="M 15 65 C 10 18, 80 18, 75 65"
            fill="none"
            stroke="#0F3A73"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Ear Cushion Left */}
          <rect x="6" y="55" width="16" height="28" rx="8" fill="#1C57A8" />
          <rect x="9" y="60" width="10" height="18" rx="5" fill="#FFC857" />

          {/* Ear Cushion Right */}
          <rect x="68" y="55" width="16" height="28" rx="8" fill="#1C57A8" />
          <rect x="71" y="60" width="10" height="18" rx="5" fill="#FFC857" />

          {/* Microphone Arm */}
          <path
            d="M 14 74 Q 22 96 46 95"
            fill="none"
            stroke="#0F3A73"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse cx="49" cy="95" rx="5" ry="3.5" fill="#D64545" />
        </g>

        {/* Soothing Heart Symbol with Sun-Gold / Vermilion Glow */}
        <g transform="translate(230, 60)">
          <circle cx="20" cy="20" r="26" fill="#FFFFFF" stroke="#BFE0FA" strokeWidth="1.5" />
          <path
            d="M 20 14 Q 20 8 14 8 Q 8 8 8 14 Q 8 20 20 28 Q 32 20 32 14 Q 32 8 26 8 Q 20 8 20 14 Z"
            fill="#D64545"
          />
          {/* Audio Wave ripple */}
          <path d="M 38 12 Q 44 20 38 28" stroke="#3B82D6" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M 43 7 Q 52 20 43 33" stroke="#3B82D6" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
        </g>
      </svg>
    );
  }

  // 2. Executive Project Pitch: Easel / Whiteboard + Rising Growth Chart + Idea Bulb
  if (isPitch) {
    return (
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full object-cover"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cardGradPitch" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0F7FF" />
            <stop offset="100%" stopColor="#DBEDFE" />
          </linearGradient>
        </defs>
        {/* Background Canvas */}
        <rect width="320" height="180" fill="url(#cardGradPitch)" />

        {/* Floor Line */}
        <path d="M 0 150 L 320 150" stroke="#BFE0FA" strokeWidth="2" />

        {/* Whiteboard / Easel Stand */}
        <g transform="translate(60, 30)">
          {/* Wooden Easel Legs */}
          <line x1="45" y1="20" x2="10" y2="125" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="95" y1="20" x2="130" y2="125" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="70" y1="15" x2="70" y2="125" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />

          {/* Whiteboard Board */}
          <rect x="15" y="15" width="110" height="75" rx="6" fill="#FFFFFF" stroke="#0F3A73" strokeWidth="2.5" />

          {/* Growth Grid Lines */}
          <line x1="28" y1="35" x2="112" y2="35" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="28" y1="52" x2="112" y2="52" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="28" y1="69" x2="112" y2="69" stroke="#E2E8F0" strokeWidth="1" />

          {/* Rising Growth Chart with Sun-Gold Bars & Red Trend Line */}
          <rect x="35" y="58" width="12" height="22" rx="2" fill="#BFE0FA" />
          <rect x="55" y="46" width="12" height="34" rx="2" fill="#3B82D6" />
          <rect x="75" y="36" width="12" height="44" rx="2" fill="#1C57A8" />
          <rect x="95" y="24" width="12" height="56" rx="2" fill="#FFC857" />

          {/* Dynamic Trend Line */}
          <path
            d="M 40 60 L 60 48 L 80 38 L 102 22"
            fill="none"
            stroke="#D64545"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="102" cy="22" r="3.5" fill="#D64545" />
        </g>

        {/* Glowing Idea Lightbulb with Sunlight Accent */}
        <g transform="translate(225, 45)">
          <circle cx="28" cy="28" r="28" fill="#FFFFFF" stroke="#BFE0FA" strokeWidth="1.5" />
          {/* Bulb Dome */}
          <path
            d="M 28 14 C 20 14, 16 19, 16 26 C 16 31, 20 33, 22 37 L 34 37 C 36 33, 40 31, 40 26 C 40 19, 36 14, 28 14 Z"
            fill="#FFC857"
            stroke="#0F3A73"
            strokeWidth="2"
          />
          {/* Filament Spark */}
          <path d="M 26 26 L 30 26" stroke="#0F3A73" strokeWidth="2" strokeLinecap="round" />
          {/* Bulb Base */}
          <rect x="23" y="38" width="10" height="5" rx="1.5" fill="#0F3A73" />
          <line x1="25" y1="45" x2="31" y2="45" stroke="#0F3A73" strokeWidth="2" strokeLinecap="round" />

          {/* Radiating Sparkles */}
          <line x1="28" y1="6" x2="28" y2="9" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" />
          <line x1="43" y1="14" x2="40" y2="17" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" />
          <line x1="13" y1="14" x2="16" y2="17" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 3. Behavioral Job Interview (Default): Two Chairs + Clipboard Notes + Speech Bubble with Hanko
  return (
    <svg
      viewBox="0 0 320 180"
      className="w-full h-full object-cover"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cardGradInterview" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5FAFF" />
          <stop offset="100%" stopColor="#DCEBFB" />
        </linearGradient>
      </defs>
      {/* Background Canvas */}
      <rect width="320" height="180" fill="url(#cardGradInterview)" />

      {/* Modern Studio Floor */}
      <path d="M 0 148 L 320 148" stroke="#BFE0FA" strokeWidth="2" />
      <rect x="20" y="149" width="280" height="31" fill="#BFE0FA" opacity="0.3" />

      {/* Left Interviewer Chair */}
      <g transform="translate(45, 68)">
        <rect x="8" y="10" width="34" height="42" rx="6" fill="#1C57A8" />
        <rect x="4" y="44" width="42" height="14" rx="4" fill="#0F3A73" />
        <line x1="12" y1="58" x2="10" y2="80" stroke="#0F3A73" strokeWidth="3" strokeLinecap="round" />
        <line x1="38" y1="58" x2="40" y2="80" stroke="#0F3A73" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Right Candidate Chair */}
      <g transform="translate(225, 68)">
        <rect x="8" y="10" width="34" height="42" rx="6" fill="#3B82D6" />
        <rect x="4" y="44" width="42" height="14" rx="4" fill="#1C57A8" />
        <line x1="12" y1="58" x2="10" y2="80" stroke="#1C57A8" strokeWidth="3" strokeLinecap="round" />
        <line x1="38" y1="58" x2="40" y2="80" stroke="#1C57A8" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Center Table & Evaluation Clipboard */}
      <g transform="translate(125, 52)">
        {/* Clipboard Body */}
        <rect x="15" y="15" width="44" height="65" rx="5" fill="#FFFFFF" stroke="#0F3A73" strokeWidth="2" />
        {/* Metal Clip with Gold Accent */}
        <rect x="27" y="10" width="20" height="9" rx="2" fill="#FFC857" stroke="#0F3A73" strokeWidth="1.5" />

        {/* STAR Checklist lines */}
        <circle cx="24" cy="30" r="2.5" fill="#1C57A8" />
        <line x1="31" y1="30" x2="51" y2="30" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />

        <circle cx="24" cy="42" r="2.5" fill="#1C57A8" />
        <line x1="31" y1="42" x2="51" y2="42" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />

        <circle cx="24" cy="54" r="2.5" fill="#1C57A8" />
        <line x1="31" y1="54" x2="51" y2="54" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />

        {/* Small Red Hanko Stamp Shape (Geometric square seal, no text) */}
        <rect x="40" y="62" width="10" height="10" rx="1.5" fill="#D64545" />
        <rect x="42" y="64" width="6" height="6" fill="#FFFFFF" opacity="0.3" />
      </g>

      {/* Dialogue Bubble Floating Above */}
      <g transform="translate(110, 16)">
        <path
          d="M 6 4 C 6 2, 8 0, 12 0 L 46 0 C 50 0, 52 2, 52 4 L 52 18 C 52 20, 50 22, 46 22 L 28 22 L 20 28 L 22 22 L 12 22 C 8 22, 6 20, 6 18 Z"
          fill="#FFFFFF"
          stroke="#1C57A8"
          strokeWidth="1.6"
        />
        {/* Dialogue visual wave line inside bubble (no text) */}
        <path
          d="M 16 11 Q 22 7 28 11 T 40 11"
          fill="none"
          stroke="#3B82D6"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
