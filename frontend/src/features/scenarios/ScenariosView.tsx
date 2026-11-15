import React, { useEffect, useState } from "react";
import {
  api,
  type ScenarioOut,
  type ScenarioSummary,
  type SessionOut,
  type StartSessionOut,
} from "../../api/client";
import { ErrorAlert } from "../../components/ErrorAlert";
import { ScenarioCard } from "./ScenarioCard";
import { ScenarioDetail } from "./ScenarioDetail";

interface ScenariosViewProps {
  onSessionStarted: (
    session: SessionOut,
    startData: StartSessionOut,
    scenario: ScenarioOut,
  ) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  onSessionStarted,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioOut | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [error, setError] = useState<unknown | null>(null);

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
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSelectScenario(scenarioId: string) {
    setError(null);
    try {
      const scenario = await api.getScenario(scenarioId);
      setSelectedScenario(scenario);
    } catch (err) {
      setError(err);
    }
  }

  async function handleStartSession(scenario: ScenarioOut | ScenarioSummary) {
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

  return (
    <div className="space-y-6">
      <div className="border-b border-washi-300 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sumi-900 sm:text-3xl">
            Roleplay Practice Scenarios
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-sumi-600">
            Choose a workplace simulation scenario to practice spoken communication with an AI interviewer.
          </p>
        </div>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

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
          {scenarios.map((scenario, index) => (
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
          {scenarios.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-sumi-500">
              No scenarios found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
