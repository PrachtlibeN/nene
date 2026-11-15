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

  const isSessionView = activeTab === "session" && currentSession && currentScenario;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-washi-100 bg-seigaiha text-sumi-900 flex flex-col antialiased selection:bg-ai-100 selection:text-ai-900">
      {/* Hide heavy Header/Nav when in Session View for full-screen immersive mobile experience */}
      {!isSessionView && (
        <header className="border-b border-washi-300 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2.5 sm:px-6">
            {/* Brand Logo with Red Hanko Stamp */}
            <div className="flex items-center gap-2.5">
              <div className="hanko-stamp-filled flex h-9 w-9 items-center justify-center rounded-md text-white font-serif font-black text-xl tracking-wider select-none shadow-sm">
                E
              </div>
              <div>
                <h1 className="text-base font-black text-sumi-900 leading-none tracking-tight">
                  EchoRole
                </h1>
                <p className="text-[11px] text-sumi-500 font-medium leading-none mt-1">
                  AI Spoken Roleplay &amp; Communication Coach
                </p>
              </div>
            </div>

            {/* 3-Step Progress Stepper */}
            <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
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

              <span className="text-washi-400 text-xs select-none">&bull;&mdash;&bull;</span>

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

              <span className="text-washi-400 text-xs select-none">&bull;&mdash;&bull;</span>

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
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full ${
          isSessionView
            ? "p-0 h-screen h-[100dvh] max-h-[100dvh]"
            : "mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-6"
        }`}
      >
        {activeTab === "scenarios" && (
          <ScenariosView onSessionStarted={handleSessionStarted} />
        )}

        {isSessionView && (
          <SessionView
            initialSession={currentSession}
            scenario={currentScenario}
            initialTurns={initialTurns}
            onViewFeedback={handleViewFeedback}
            onBackToScenarios={handleBackToScenarios}
          />
        )}

        {activeTab === "feedback" && evaluationSessionId && (
          <FeedbackView
            sessionId={evaluationSessionId}
            onBackToScenarios={handleBackToScenarios}
          />
        )}
      </main>

      {/* Footer in Washi & Sumi Style (Hidden on Session for full-screen immersive view) */}
      {!isSessionView && (
        <footer className="border-t border-washi-300 bg-white/80 py-4 text-center text-xs text-sumi-400 backdrop-blur-xs">
          <span>EchoRole &bull; AI Roleplay Simulation &bull; Local Speech &amp; LLM</span>
        </footer>
      )}
    </div>
  );
}
