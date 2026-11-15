import React from "react";
import type { ScenarioSummary } from "../../api/client";
import { ScenarioIllustration } from "../../components/HomeIllustrations";

export interface ScenarioCardProps {
  scenario: ScenarioSummary;
  onSelect: (scenarioId: string) => void;
  onQuickStart: (scenarioId: string) => void;
  onHover?: (isHovered: boolean) => void;
  isStarting?: boolean;
}

const getScenarioSkills = (slug: string): string[] => {
  if (slug.includes("customer") || slug.includes("escalation") || slug.includes("client")) {
    return ["De-escalation", "Active Listening", "Crisis Resolution"];
  }
  if (slug.includes("pitch") || slug.includes("project") || slug.includes("leadership")) {
    return ["Executive Presence", "ROI & Vision", "Strategic Clarity"];
  }
  return ["STAR Method", "Decision-making", "Conflict Resolution"];
};

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onSelect,
  onQuickStart,
  onHover,
  isStarting = false,
}) => {
  const difficultyBadge = (level: number) => {
    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF8F1] border border-[#A7E0BA] px-2.5 py-0.5 text-xs font-bold text-[#1E7E45]">
            <span>Easy</span>
            <span aria-hidden="true" className="text-[11px] font-normal opacity-75">
              初級
            </span>
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF7E6] border border-[#FFD591] px-2.5 py-0.5 text-xs font-bold text-[#B26B00]">
            <span>Medium</span>
            <span aria-hidden="true" className="text-[11px] font-normal opacity-75">
              中級
            </span>
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF1F0] border border-[#FFA39E] px-2.5 py-0.5 text-xs font-bold text-[#C82A2A]">
            <span>Hard</span>
            <span aria-hidden="true" className="text-[11px] font-normal opacity-75">
              上級
            </span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#F0F5FA] border border-[#DCEBFB] px-2.5 py-0.5 text-xs font-bold text-[#14304F]">
            <span>Level {level}</span>
          </span>
        );
    }
  };

  const focusSkills = getScenarioSkills(scenario.slug);
  const visibleSkills = focusSkills.slice(0, 3);
  const extraSkillsCount = focusSkills.length - visibleSkills.length;

  return (
    <div
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className="scenario-card-hover group relative flex flex-col justify-between rounded-2xl border border-[#DCEBFB] bg-white p-5 sm:p-6 shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-[#1C57A8] focus-within:ring-offset-2 h-full"
    >
      <div className="flex-1 flex flex-col relative z-10">
        {/* 1. Unified 16/9 Scenario Vector Header with Pill Overlay */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 border border-[#DCEBFB] bg-[#F2F8FF]">
          <div className="scenario-icon-waving w-full h-full">
            <ScenarioIllustration slug={scenario.slug} />
          </div>

          {/* Subtle Corner Sakura Petal appearing on hover */}
          <div
            aria-hidden="true"
            className="scenario-corner-petal absolute top-2.5 right-2.5 z-20 pointer-events-none"
          >
            <svg viewBox="0 0 20 14" className="w-4 h-4 fill-[#F8C8D8] drop-shadow-2xs">
              <path d="M 0 7 C 3 1, 10 0, 16 3 C 20 5, 20 9, 16 11 C 10 14, 3 13, 0 7 Z" />
            </svg>
          </div>

          {/* Difficulty Badge in Bottom-Left */}
          <div className="absolute bottom-2 left-2 z-10">
            {difficultyBadge(scenario.difficulty)}
          </div>

          {/* Turns & Duration Pill in Bottom-Right */}
          <div className="absolute bottom-2 right-2 z-10 bg-[#0F3A73]/85 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-md text-[11px] font-semibold shadow-xs">
            {scenario.max_turns} Turns &bull; {scenario.estimated_minutes}m
          </div>
        </div>

        {/* 2. Title (20-22px, max 2 lines) */}
        <h3 className="text-xl sm:text-[21px] font-bold text-[#14304F] tracking-tight group-hover:text-[#1C57A8] transition-colors line-clamp-2 leading-snug">
          {scenario.title}
        </h3>

        {/* 3. Description (15-16px, clamp 2-3 lines) */}
        <p className="mt-2 text-[15px] text-[#4A607A] line-clamp-2 sm:line-clamp-3 leading-relaxed">
          {scenario.description}
        </p>

        {/* 4. Skills Tags (Max 3 + "+N") */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-md bg-[#F2F8FF] border border-[#DCEBFB] px-2 py-0.5 text-xs font-semibold text-[#1C57A8]"
            >
              {skill}
            </span>
          ))}
          {extraSkillsCount > 0 && (
            <span className="inline-flex items-center rounded-md bg-[#F2F8FF] border border-[#DCEBFB] px-1.5 py-0.5 text-xs font-semibold text-[#4A607A]">
              +{extraSkillsCount}
            </span>
          )}
        </div>

        {/* 5. Concise AI Panel Info */}
        {scenario.personas && scenario.personas.length >= 2 && (
          <div className="mt-4 rounded-xl border border-[#DCEBFB] bg-[#F2F8FF] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1C57A8] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                2-on-1 Panel
              </span>
              <span className="text-[10px] text-[#1C57A8] font-semibold">
                Dual AI Panel
              </span>
            </div>
            <div className="space-y-1.5 pt-0.5">
              {scenario.personas.slice(0, 2).map((persona, index) => (
                <div
                  key={persona.id}
                  className="flex items-center justify-between gap-2 text-xs text-[#14304F]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold bg-[#DCEBFB] text-[#0F3A73] shrink-0">
                      {persona.name.charAt(0)}
                    </span>
                    <span className="font-semibold text-xs text-[#14304F] truncate">
                      AI #{index + 1}: {persona.name}
                    </span>
                  </div>
                  <span
                    className="text-[11px] text-[#4A607A] font-normal truncate hidden sm:inline"
                    title={persona.role_title}
                  >
                    {persona.role_title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Footer Actions: View Details (secondary) & Start Session (primary 44-48px) */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#DCEBFB] pt-4 relative z-10">
        <button
          type="button"
          onClick={() => onSelect(scenario.id)}
          className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-[#4A607A] hover:text-[#0F3A73] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1C57A8]"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onQuickStart(scenario.id)}
          disabled={isStarting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C57A8] hover:bg-[#0F3A73] disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold text-white shadow-xs active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#1C57A8] focus:ring-offset-2 cursor-pointer"
        >
          {isStarting ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Starting...</span>
            </>
          ) : (
            <span>Start Session</span>
          )}
        </button>
      </div>
    </div>
  );
};
