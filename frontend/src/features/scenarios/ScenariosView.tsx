import React, { useEffect, useMemo, useState } from "react";
import {
  api,
  type ScenarioOut,
  type ScenarioSummary,
  type SessionOut,
  type StartSessionOut,
} from "../../api/client";
import { ErrorAlert } from "../../components/ErrorAlert";
import { loadSessionHistory } from "../../utils/history";
import { unlockSpeechAudio } from "../../utils/speech";
import { ScenarioCard } from "./ScenarioCard";
import { ScenarioDetail } from "./ScenarioDetail";

interface ScenariosViewProps {
  onSessionStarted: (
    session: SessionOut,
    startData: StartSessionOut,
    scenario: ScenarioOut,
  ) => void;
}

type ScenarioCategory = "all" | "career" | "pitch" | "crisis";

interface CategoryTab {
  id: ScenarioCategory;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryTab[] = [
  { id: "all", label: "All Scenarios", icon: "🌸" },
  { id: "career", label: "Career & Interview", icon: "💼" },
  { id: "pitch", label: "Pitch & Leadership", icon: "🚀" },
  { id: "crisis", label: "Client & Crisis", icon: "🛡️" },
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
  const [error, setError] = useState<unknown | null>(null);
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory>("all");
  const [historyStats, setHistoryStats] = useState<{ totalSessions: number; avgScore: number | null }>({
    totalSessions: 0,
    avgScore: null,
  });

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
    unlockSpeechAudio();
    setIsStarting(true);
    setError(null);
    try {
      let fullScenario: ScenarioOut;
      if ("definition" in scenario) {
        fullScenario = scenario;
      } else {
        fullScenario = await api.getScenario(scenario.id);
      }

      const newSession = await api.createSession(fullScenario.id);
      const startData = await api.startSession(newSession.id);
      onSessionStarted(newSession, startData, fullScenario);
    } catch (err) {
      setError(err);
    } finally {
      setIsStarting(false);
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
    if (scenarios.length === 0) return;
    const pool = filteredScenarios.length > 0 ? filteredScenarios : scenarios;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    unlockSpeechAudio();
    handleStartSession(chosen);
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          Warm Japanese Aesthetic Hero Banner with Seigaiha Waves
          ==================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-washi-300 bg-gradient-to-br from-washi-50 via-white to-washi-100 p-5 sm:p-7 shadow-sm">
        {/* Subtle Japanese Seigaiha Wave Pattern */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="seigaiha-hero" width="60" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M 0 30 A 30 30 0 0 1 60 30 A 24 24 0 0 0 6 30 A 18 18 0 0 1 54 30 A 12 12 0 0 0 12 30 A 6 6 0 0 1 48 30 A 0 0 0 0 0 0 30 Z"
                fill="none"
                stroke="#C8423B"
                strokeWidth="1.2"
              />
              <path d="M 30 15 A 30 30 0 0 1 90 15" fill="none" stroke="#C8423B" strokeWidth="1.2" />
              <path d="M -30 15 A 30 30 0 0 1 30 15" fill="none" stroke="#C8423B" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#seigaiha-hero)" />
        </svg>

        {/* Floating Sakura Glow in Top-Right */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-radial from-[#F7C9D4]/40 to-transparent blur-2xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            {/* Japanese Aesthetic Hanko Stamp / Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-shu-200 bg-shu-50/80 px-3 py-0.5 shadow-3xs backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-shu-600 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-shu-800">
                回想ロール &bull; ECHOROLE AI COACH
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-sumi-900 sm:text-3xl">
              Roleplay Practice Scenarios
            </h1>
            <p className="text-xs sm:text-sm text-sumi-600 leading-relaxed">
              Master high-stakes spoken English conversations with dual AI panel interviewers in realistic Japanese aesthetic simulations.
            </p>

            {/* Quick Achievement Stats from History */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-washi-300 bg-white/90 px-2.5 py-1 font-semibold text-sumi-800 shadow-3xs">
                <span>🏆</span>
                <span>
                  {historyStats.totalSessions > 0
                    ? `${historyStats.totalSessions} Sessions Completed`
                    : "No sessions completed yet"}
                </span>
              </span>

              {historyStats.avgScore !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-matcha-200 bg-matcha-50 px-2.5 py-1 font-semibold text-matcha-900 shadow-3xs">
                  <span>⭐</span>
                  <span>Avg Score: {historyStats.avgScore}/10</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-ai-200 bg-ai-50 px-2.5 py-1 font-semibold text-ai-800 shadow-3xs">
                <span>🎙️</span>
                <span>10 Turns Spoken Practice</span>
              </span>
            </div>
          </div>

          {/* Quick Random Practice CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRandomPractice}
              disabled={isStarting || isLoading || scenarios.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-shu-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-shu-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-shu-600 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>Start Random Practice</span>
              <span className="text-base">🎲</span>
            </button>
            <span className="text-[11px] font-medium text-sumi-500">
              Jump into an impromptu challenge
            </span>
          </div>
        </div>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* ====================================================================
          Category Filter Pills
          ==================================================================== */}
      {!selectedScenario && !isLoading && scenarios.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id];
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all focus:outline-none ${
                  isActive
                    ? "bg-ai-700 text-white shadow-xs scale-102"
                    : "bg-white text-sumi-700 border border-washi-300 hover:bg-washi-100 hover:text-sumi-900"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-washi-200 text-sumi-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ====================================================================
          Scenarios Grid or Scenario Detail
          ==================================================================== */}
      {isLoading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex items-center gap-3 text-sumi-600 font-medium">
            <svg
              className="h-6 w-6 animate-spin text-ai-700"
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
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredScenarios.map((scenario, index) => (
            <div
              key={scenario.id}
              className="animate-card-stagger flex flex-col h-full"
              style={{ "--stagger-index": index } as React.CSSProperties}
            >
              <ScenarioCard
                scenario={scenario}
                onSelect={handleSelectScenario}
                onQuickStart={(id) => {
                  const s = scenarios.find((item) => item.id === id);
                  if (s) handleStartSession(s);
                }}
              />
            </div>
          ))}
          {filteredScenarios.length === 0 && (
            <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-washi-300 bg-white p-8">
              <p className="text-sm font-semibold text-sumi-700">
                No scenarios found in this category.
              </p>
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className="mt-3 text-xs font-bold text-ai-700 hover:underline"
              >
                View All Scenarios &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
