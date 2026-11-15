import React, { useEffect, useMemo, useState } from "react";
import {
  api,
  type ScenarioOut,
  type ScenarioSummary,
  type SessionOut,
  type StartSessionOut,
} from "../../api/client";
import { ErrorAlert } from "../../components/ErrorAlert";
import {
  HeroBackgroundDecorations,
  SeigaihaHeroBackground,
} from "../../components/HomeIllustrations";
import { Nene } from "../../components/Nene";
import { useNeneBehavior } from "../../components/useNeneBehavior";
import { loadSessionHistory } from "../../utils/history";
import { unlockSpeechAudio } from "../../utils/speech";
import { ScenarioCard } from "./ScenarioCard";
import { ScenarioDetail } from "./ScenarioDetail";

export interface ScenariosViewProps {
  onSessionStarted: (
    session: SessionOut,
    startData: StartSessionOut,
    scenario: ScenarioOut,
  ) => void;
}

export type ScenarioCategory = "all" | "career" | "pitch" | "crisis";

interface CategoryTab {
  id: ScenarioCategory;
  label: string;
}

const CATEGORIES: CategoryTab[] = [
  { id: "all", label: "All" },
  { id: "career", label: "Career & Interview" },
  { id: "pitch", label: "Pitch & Leadership" },
  { id: "crisis", label: "Client & Crisis" },
];

function matchesCategory(scenario: ScenarioSummary, cat: ScenarioCategory): boolean {
  if (cat === "all") return true;
  const text = `${scenario.slug} ${scenario.title} ${scenario.description}`.toLowerCase();
  if (cat === "career") {
    return (
      text.includes("interview") ||
      text.includes("behavioral") ||
      text.includes("job") ||
      text.includes("career")
    );
  }
  if (cat === "pitch") {
    return (
      text.includes("pitch") ||
      text.includes("project") ||
      text.includes("leadership") ||
      text.includes("executive")
    );
  }
  if (cat === "crisis") {
    return (
      text.includes("customer") ||
      text.includes("escalation") ||
      text.includes("client") ||
      text.includes("crisis")
    );
  }
  return true;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  onSessionStarted,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioOut | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startingScenarioId, setStartingScenarioId] = useState<string | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory>("all");
  const [historyStats, setHistoryStats] = useState<{ totalSessions: number; avgScore: number | null }>({
    totalSessions: 0,
    avgScore: null,
  });

  // Mascot Nene controller hook
  const nene = useNeneBehavior();

  useEffect(() => {
    let isMounted = true;
    async function loadScenarios() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.listScenarios();
        if (isMounted) {
          setScenarios(response.items);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadScenarios();

    // Load user practice history stats
    const history = loadSessionHistory();
    if (history.length > 0) {
      const avg = history.reduce((sum, item) => sum + item.overallScore, 0) / history.length;
      setHistoryStats({
        totalSessions: history.length,
        avgScore: Math.round(avg * 10) / 10,
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSelectScenario(scenarioId: string) {
    unlockSpeechAudio();
    setError(null);
    try {
      const scenario = await api.getScenario(scenarioId);
      setSelectedScenario(scenario);
    } catch (err) {
      setError(err);
    }
  }

  async function handleStartSession(scenario: ScenarioOut | ScenarioSummary) {
    unlockSpeechAudio(true);
    setIsStarting(true);
    setStartingScenarioId(scenario.id);
    setError(null);
    try {
      const [fullScenario, newSession] = await Promise.all([
        "definition" in scenario
          ? Promise.resolve(scenario as ScenarioOut)
          : api.getScenario(scenario.id),
        api.createSession(scenario.id),
      ]);

      const startData = await api.startSession(newSession.id);
      onSessionStarted(newSession, startData, fullScenario);
    } catch (err) {
      setError(err);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setIsStarting(false);
      setStartingScenarioId(null);
    }
  }

  const categoryCounts = useMemo(() => {
    return {
      all: scenarios.length,
      career: scenarios.filter((s) => matchesCategory(s, "career")).length,
      pitch: scenarios.filter((s) => matchesCategory(s, "pitch")).length,
      crisis: scenarios.filter((s) => matchesCategory(s, "crisis")).length,
    };
  }, [scenarios]);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter((s) => matchesCategory(s, activeCategory));
  }, [scenarios, activeCategory]);

  const handleRandomPractice = () => {
    if (scenarios.length === 0 || isStarting) return;
    const pool = filteredScenarios.length > 0 ? filteredScenarios : scenarios;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    unlockSpeechAudio(true);
    handleStartSession(chosen);
  };

  const handleCategorySelect = (catId: ScenarioCategory) => {
    setActiveCategory(catId);
    nene.handleFilterChange();
  };

  return (
    <div className="theme-ulis w-full pb-12">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-7 sm:space-y-9">
        {/* ====================================================================
            Hero Section: Title + Single Functional Sentence + Nene & CTA
            ==================================================================== */}
        <div className="relative overflow-hidden rounded-3xl border border-[#DCEBFB] bg-gradient-to-br from-[#F2F8FF] via-white to-[#EBF5FF] p-6 sm:p-8 lg:p-10 shadow-xs">
          {/* Subtle Seigaiha Waves Background */}
          <SeigaihaHeroBackground />

          {/* Minimal Floating Learning Icons (max 2 moving elements) */}
          <HeroBackgroundDecorations />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left: Heading, Functional Description (<= 90 chars), Real Stats */}
            <div className="md:col-span-7 lg:col-span-8 space-y-3.5 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#0F3A73] leading-tight">
                Roleplay Practice Scenarios
              </h1>
              <p className="text-[15px] sm:text-base text-[#4A607A] leading-relaxed max-w-2xl font-normal">
                Practice high-stakes English conversations with dual AI panel interviewers.
              </p>

              {/* Real Metrics Only: Sessions completed & Avg Score */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#DCEBFB] bg-white px-3 py-1.5 font-semibold text-[#14304F] shadow-xs">
                  <span>🏆</span>
                  <span>{historyStats.totalSessions} Sessions Completed</span>
                </span>

                {historyStats.avgScore !== null && (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-[#BFE0FA] bg-[#F2F8FF] px-3 py-1.5 font-semibold text-[#1C57A8] shadow-xs">
                    <span>⭐</span>
                    <span>Avg Score: {historyStats.avgScore}/10</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-2 rounded-xl border border-[#DCEBFB] bg-white px-3 py-1.5 font-semibold text-[#4A607A] shadow-xs">
                  <span>📚</span>
                  <span>{scenarios.length} Scenarios</span>
                </span>
              </div>
            </div>

            {/* Right: Nene Mascot + Start Random Practice Button */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center sm:items-end justify-center gap-3.5">
              <Nene
                activity={nene.activity}
                pupilOffset={nene.pupilOffset}
                isBlinking={nene.isBlinking}
                onClick={nene.handleClick}
              />

              <button
                type="button"
                onClick={handleRandomPractice}
                onMouseEnter={() => nene.handleCtaHover(true)}
                onMouseLeave={() => nene.handleCtaHover(false)}
                disabled={isStarting || isLoading || scenarios.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#FFC857] hover:bg-[#F5B83D] active:scale-95 px-6 py-3 min-h-[46px] text-sm font-bold text-[#0F3A73] shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#FFC857] focus:ring-offset-2 cursor-pointer disabled:opacity-50"
              >
                <span>Start Random Practice</span>
                <span aria-hidden="true" className="text-base">🎲</span>
              </button>
            </div>
          </div>
        </div>

        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        {/* ====================================================================
            Filter Category Chips (Min height 40-44px, Font >= 14px)
            ==================================================================== */}
        {!selectedScenario && !isLoading && scenarios.length > 0 && (
          <div className="w-full overflow-x-auto pb-1 pt-1 no-scrollbar">
            <div className="flex items-center gap-2.5 min-w-max">
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.id];
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 min-h-[42px] text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#1C57A8] cursor-pointer ${
                      isActive
                        ? "bg-[#1C57A8] text-white shadow-xs"
                        : "bg-white text-[#4A607A] border border-[#DCEBFB] hover:bg-[#F2F8FF] hover:text-[#0F3A73]"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#F2F8FF] text-[#1C57A8]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ====================================================================
            Scenarios Responsive Grid (1, 2, or 3 columns) or Detail
            ==================================================================== */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-[#1C57A8] font-semibold text-sm">
              <svg
                className="h-6 w-6 animate-spin text-[#1C57A8]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span>Loading scenarios...</span>
            </div>
          </div>
        ) : selectedScenario ? (
          <ScenarioDetail
            scenario={selectedScenario}
            onStartSession={handleStartSession}
            onBack={() => setSelectedScenario(null)}
            isStarting={isStarting}
          />
        ) : (
          <div className="grid gap-6 sm:gap-7 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch">
            {filteredScenarios.map((scenario, index) => {
              const columnPos: "left" | "center" | "right" =
                index % 3 === 0 ? "left" : index % 3 === 1 ? "center" : "right";

              return (
                <div
                  key={scenario.id}
                  className="animate-card-stagger flex flex-col h-full"
                  style={{ "--stagger-index": index } as React.CSSProperties}
                >
                  <ScenarioCard
                    scenario={scenario}
                    isStarting={isStarting && startingScenarioId === scenario.id}
                    onSelect={handleSelectScenario}
                    onQuickStart={(id) => {
                      const s = scenarios.find((item) => item.id === id);
                      if (s) handleStartSession(s);
                    }}
                    onHover={(hovering) => {
                      nene.handleCardHover(hovering ? columnPos : null);
                    }}
                  />
                </div>
              );
            })}

            {filteredScenarios.length === 0 && (
              <div className="col-span-full py-14 text-center rounded-2xl border border-dashed border-[#DCEBFB] bg-white p-8">
                <p className="text-base font-semibold text-[#14304F]">
                  No scenarios found in this category.
                </p>
                <button
                  type="button"
                  onClick={() => handleCategorySelect("all")}
                  className="mt-3 text-xs sm:text-sm font-bold text-[#1C57A8] hover:underline cursor-pointer"
                >
                  View All Scenarios &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating session start loading banner for mobile & desktop */}
      {isStarting && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-6 z-50 mx-auto max-w-sm px-4 pointer-events-none"
        >
          <div className="flex items-center gap-3 rounded-2xl border-2 border-[#1C57A8] bg-[#14304F] text-white p-3.5 shadow-2xl backdrop-blur-md animate-fade-in pointer-events-auto">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-white">
                Starting practice session...
              </p>
              <p className="text-[11px] text-[#BFE0FA] truncate">
                Dual AI interviewers are preparing opening remarks.
              </p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
