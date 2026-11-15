import { useState } from "react";
import type { ScenarioOut, SessionOut, StartSessionOut, TurnOut } from "./api/client";
import { ScenariosView } from "./features/scenarios/ScenariosView";
import { SessionView } from "./features/session/SessionView";
import { FeedbackView } from "./features/feedback/FeedbackView";

type ActiveTab = "scenarios" | "session" | "feedback";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("scenarios");
  const [currentScenario, setCurrentScenario] = useState<ScenarioOut | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionOut | null>(null);
  const [initialTurns, setInitialTurns] = useState<TurnOut[]>([]);
  const [evaluationSessionId, setEvaluationSessionId] = useState<string | null>(null);

  const handleSessionStarted = (
    session: SessionOut,
    startData: StartSessionOut,
    scenario: ScenarioOut,
  ) => {
    setCurrentSession(startData.session ?? session);
    setCurrentScenario(scenario);
    setInitialTurns(
      startData.interviewer_turns?.length
        ? startData.interviewer_turns
        : [startData.interviewer_turn],
    );
    setEvaluationSessionId(session.id);
    setActiveTab("session");
  };

  const handleViewFeedback = (sessionId: string) => {
    setEvaluationSessionId(sessionId);
    setActiveTab("feedback");
  };

  const handleBackToScenarios = () => {
    setActiveTab("scenarios");
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-washi-100 bg-seigaiha text-sumi-900 flex flex-col antialiased selection:bg-ai-100 selection:text-ai-900">
      {/* Top Navigation Bar: Minimalist Japanese App Bar */}
      <header className="border-b border-washi-300 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2.5 sm:px-6">
          {/* Brand Logo with Red Hanko Stamp */}
          <div className="flex items-center gap-2.5">
            <div className="hanko-stamp-filled flex h-9 w-9 items-center justify-center rounded-md text-white font-serif font-black text-xl tracking-wider select-none shadow-sm">
              E
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-sumi-900 leading-none tracking-tight">
                  EchoRole
                </h1>
                <span className="text-[10px] font-bold text-shu-600 bg-shu-50 px-1.5 py-0.2 rounded border border-shu-200 uppercase">
                  エコー
                </span>
              </div>
              <p className="text-[11px] text-sumi-500 font-medium leading-none mt-1">
                Japanese VN &bull; AI Spoken Roleplay
              </p>
            </div>
          </div>

          {/* 3-Step Bamboo Knot / Pearl Progress Stepper */}
          <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
            {/* Step 1: Scenarios */}
            <button
              type="button"
              onClick={() => setActiveTab("scenarios")}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "scenarios"
                  ? "bg-ai-700 text-white shadow-sm ring-2 ring-ai-200"
                  : "text-sumi-600 hover:bg-washi-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  activeTab === "scenarios" ? "bg-white" : "bg-ai-500"
                }`}
              />
              <span>1. Scenarios</span>
            </button>

            {/* Bamboo Link Divider */}
            <span className="text-washi-400 text-xs select-none">&bull;&mdash;&bull;</span>

            {/* Step 2: Session */}
            <button
              type="button"
              disabled={!currentSession || !currentScenario}
              onClick={() => setActiveTab("session")}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "session"
                  ? "bg-ai-700 text-white shadow-sm ring-2 ring-ai-200"
                  : "text-sumi-600 hover:bg-washi-200 disabled:opacity-40 disabled:hover:bg-transparent"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  activeTab === "session" ? "bg-white" : "bg-ai-500"
                }`}
              />
              <span>2. Session</span>
            </button>

            {/* Bamboo Link Divider */}
            <span className="text-washi-400 text-xs select-none">&bull;&mdash;&bull;</span>

            {/* Step 3: Feedback */}
            <button
              type="button"
              disabled={!evaluationSessionId}
              onClick={() => setActiveTab("feedback")}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "feedback"
                  ? "bg-ai-700 text-white shadow-sm ring-2 ring-ai-200"
                  : "text-sumi-600 hover:bg-washi-200 disabled:opacity-40 disabled:hover:bg-transparent"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  activeTab === "feedback" ? "bg-white" : "bg-ai-500"
                }`}
              />
              <span>3. Feedback</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex-1 w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-6">
        {activeTab === "scenarios" && (
          <ScenariosView onSessionStarted={handleSessionStarted} />
        )}

        {activeTab === "session" && currentSession && currentScenario && (
          <SessionView
            initialSession={currentSession}
            scenario={currentScenario}
            initialTurns={initialTurns}
            onViewFeedback={handleViewFeedback}
          />
        )}

        {activeTab === "feedback" && evaluationSessionId && (
          <FeedbackView
            sessionId={evaluationSessionId}
            onBackToScenarios={handleBackToScenarios}
          />
        )}
      </main>

      {/* Footer in Washi & Sumi Style */}
      <footer className="border-t border-washi-300 bg-white/80 py-4 text-center text-xs text-sumi-400 backdrop-blur-xs">
        <div className="flex items-center justify-center gap-2">
          <span className="hanko-stamp flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-shu-600 border-shu-500">
            響
          </span>
          <span>EchoRole &bull; 和風 Visual Novel &amp; Washi Aesthetic &bull; Vector Stage &bull; Local Speech &amp; LLM</span>
        </div>
      </footer>
    </div>
  );
}
