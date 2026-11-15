import React from "react";
import type { ScenarioSummary } from "../../api/client";

interface ScenarioCardProps {
  scenario: ScenarioSummary;
  onSelect: (scenarioId: string) => void;
  onQuickStart: (scenarioId: string) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onSelect,
  onQuickStart,
}) => {
  const difficultyBadge = (level: number) => {
    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center rounded-md bg-matcha-100 border border-matcha-300 px-2 py-0.5 text-xs font-bold text-matcha-800">
            Easy
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center rounded-md bg-yamabuki-100 border border-yamabuki-300 px-2 py-0.5 text-xs font-bold text-yamabuki-800">
            Medium
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center rounded-md bg-shu-100 border border-shu-300 px-2 py-0.5 text-xs font-bold text-shu-800">
            Hard
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-washi-200 border border-washi-300 px-2 py-0.5 text-xs font-bold text-sumi-800">
            Level {level}
          </span>
        );
    }
  };

  return (
    <div className="scenario-card-hover group relative flex flex-col justify-between rounded-2xl border-2 border-washi-300 bg-washi-50 p-5 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-ai-600 focus-within:ring-offset-2">
      <div>
        {/* Scenario Vector Thumbnail Header */}
        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4 border border-washi-300 bg-washi-200/50">
          <div className="scenario-icon-waving w-full h-full">
            <ScenarioThumbnail slug={scenario.slug} />
          </div>
          {/* Subtle Corner Sakura Petal appearing on hover */}
          <div
            aria-hidden="true"
            className="scenario-corner-petal absolute top-2 right-2 z-20 pointer-events-none"
          >
            <svg viewBox="0 0 20 14" className="w-4 h-4 fill-[#F7C9D4] drop-shadow-2xs">
              <path d="M 0 7 C 3 1, 10 0, 16 3 C 20 5, 20 9, 16 11 C 10 14, 3 13, 0 7 Z" />
            </svg>
          </div>
          {/* Floating Pill on Thumbnail */}
          <div className="absolute bottom-2 left-2 z-10">
            {difficultyBadge(scenario.difficulty)}
          </div>
          <div className="absolute bottom-2 right-2 z-10 bg-sumi-900/75 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[11px] font-medium shadow-sm">
            {scenario.estimated_minutes}m &bull; {scenario.max_turns} turns
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-sumi-900 tracking-tight group-hover:text-ai-700 transition-colors line-clamp-1">
          {scenario.title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-sumi-600 line-clamp-3 leading-relaxed">
          {scenario.description}
        </p>

        {/* AI Panel Information */}
        {scenario.personas?.length === 2 && (
          <div className="mt-4 rounded-xl border border-ai-100 bg-ai-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-ai-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                2-on-1 Panel
              </span>
              <span className="text-[10px] text-ai-700 font-semibold">
                Dual AI Interviewers
              </span>
            </div>
            <div className="space-y-1 pt-1">
              {scenario.personas.map((persona, index) => (
                <div key={persona.id} className="text-xs text-sumi-700 flex items-center justify-between">
                  <span className="font-semibold text-sumi-900">
                    AI #{index + 1}: {persona.name}
                  </span>
                  <span className="text-[11px] text-sumi-500 font-normal truncate max-w-[140px]">
                    {persona.role_title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: View Details & Start Session */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-washi-200 pt-4">
        <button
          type="button"
          onClick={() => onSelect(scenario.id)}
          className="text-xs sm:text-sm font-semibold text-sumi-600 hover:text-ai-700 transition-colors focus:outline-none"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onQuickStart(scenario.id)}
          className="rounded-xl bg-ai-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-ai-800 active:scale-95 focus:outline-none transition-all"
        >
          Start Session
        </button>
      </div>
    </div>
  );
};

const ScenarioThumbnail: React.FC<{ slug: string }> = ({ slug }) => {
  if (slug.includes("customer")) {
    return (
      <svg className="w-full h-full object-cover" viewBox="0 0 320 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="128" fill="#F8F3EA" />
        {/* Shoji Lattice Grid */}
        <line x1="0" y1="32" x2="320" y2="32" stroke="#D1BEA8" strokeWidth="1" />
        <line x1="0" y1="64" x2="320" y2="64" stroke="#D1BEA8" strokeWidth="1" />
        <line x1="0" y1="96" x2="320" y2="96" stroke="#D1BEA8" strokeWidth="1" />
        <line x1="80" y1="0" x2="80" y2="128" stroke="#D1BEA8" strokeWidth="1.5" />
        <line x1="160" y1="0" x2="160" y2="128" strokeWidth="2" stroke="#A88C6F" />
        <line x1="240" y1="0" x2="240" y2="128" stroke="#D1BEA8" strokeWidth="1.5" />
        {/* Warm Japanese Ceramic Teacup */}
        <ellipse cx="160" cy="80" rx="36" ry="12" fill="#5B8A72" />
        <path d="M 124 80 Q 130 115 160 118 Q 190 115 196 80 Z" fill="#466C58" />
        {/* Steam Waves */}
        <path d="M 152 65 Q 150 50 156 40" stroke="#C98A2C" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 166 65 Q 168 48 162 38" stroke="#C98A2C" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }

  if (slug.includes("project") || slug.includes("pitch")) {
    return (
      <svg className="w-full h-full object-cover" viewBox="0 0 320 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="128" fill="#1E2630" />
        {/* Skyline Blueprint Lines */}
        <g stroke="#39629E" strokeWidth="1" opacity="0.4">
          <rect x="30" y="30" width="40" height="98" />
          <rect x="80" y="15" width="55" height="113" />
          <rect x="145" y="45" width="50" height="83" />
          <rect x="205" y="20" width="60" height="108" />
          <rect x="275" y="40" width="35" height="88" />
        </g>
        {/* Glowing Geometric Growth Trend Line */}
        <path d="M 40 95 L 105 75 L 175 82 L 235 45 L 290 28" stroke="#E04F3E" strokeWidth="3" strokeLinecap="round" />
        <circle cx="290" cy="28" r="4" fill="#E04F3E" />
      </svg>
    );
  }

  // Behavioral Interview: Tokyo Skyline & Sakura Blossom
  return (
    <svg className="w-full h-full object-cover" viewBox="0 0 320 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="thumbTokyoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2ECF6" />
          <stop offset="100%" stopColor="#F9F5EC" />
        </linearGradient>
      </defs>
      <rect width="320" height="128" fill="url(#thumbTokyoGrad)" />
      {/* Cityscape Silhouette */}
      <rect x="40" y="55" width="45" height="73" fill="#BAC7D5" opacity="0.7" />
      <rect x="95" y="35" width="50" height="93" fill="#A5B5C5" opacity="0.7" />
      {/* Tokyo Tower Silhouette */}
      <polygon points="180,128 185,25 187,25 192,128" fill="#E04F3E" opacity="0.8" />
      <line x1="178" y1="90" x2="194" y2="90" stroke="#E04F3E" strokeWidth="2" />
      <line x1="181" y1="60" x2="191" y2="60" stroke="#E04F3E" strokeWidth="1.5" />
      <rect x="210" y="45" width="55" height="83" fill="#BAC7D5" opacity="0.7" />
      <rect x="275" y="60" width="40" height="68" fill="#A5B5C5" opacity="0.7" />
      {/* Sakura Branch & Petals */}
      <path d="M 320 15 Q 280 20 250 40" stroke="#5C4033" strokeWidth="2" strokeLinecap="round" />
      <circle cx="250" cy="40" r="5" fill="#F8B4C0" />
      <circle cx="270" cy="28" r="4" fill="#FAD1D8" />
      <circle cx="295" cy="22" r="5" fill="#F8B4C0" />
    </svg>
  );
};
