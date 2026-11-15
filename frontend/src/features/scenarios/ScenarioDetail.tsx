import React from "react";
import type { ScenarioOut } from "../../api/client";

interface ScenarioDetailProps {
  scenario: ScenarioOut;
  onStartSession: (scenario: ScenarioOut) => void;
  onBack: () => void;
  isStarting: boolean;
}

export const ScenarioDetail: React.FC<ScenarioDetailProps> = ({
  scenario,
  onStartSession,
  onBack,
  isStarting,
}) => {
  const { persona, personas, task, evaluation_focus } = scenario.definition;
  const panelPersonas = personas ?? [];

  const difficultyLabels: Record<number, { text: string; color: string }> = {
    1: { text: "初級 Level 1: Beginner", color: "bg-matcha-100 text-matcha-800 border-matcha-300" },
    2: { text: "中級 Level 2: Intermediate", color: "bg-yamabuki-100 text-yamabuki-800 border-yamabuki-300" },
    3: { text: "上級 Level 3: Advanced", color: "bg-shu-100 text-shu-800 border-shu-300" },
  };

  const difficultyInfo = difficultyLabels[scenario.difficulty] ?? {
    text: `Level ${scenario.difficulty}`,
    color: "bg-washi-200 text-sumi-800 border-washi-300",
  };

  return (
    <div className="rounded-2xl border-2 border-washi-300 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-sumi-600 hover:text-ai-700 transition-colors focus:outline-none"
        >
          &larr; Back to all scenarios
        </button>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${difficultyInfo.color}`}
        >
          {difficultyInfo.text}
        </span>
      </div>

      <div className="border-b border-washi-200 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-sumi-900">
          {scenario.title}
        </h2>
        <p className="mt-2 text-base text-sumi-700 leading-relaxed">{scenario.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-sumi-500">
          <span className="flex items-center gap-1">
            <span className="text-sumi-400">Estimated:</span> {scenario.estimated_minutes} mins
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sumi-400">Max turns:</span> {scenario.max_turns} turns
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sumi-400">Language:</span> {scenario.language.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid gap-6 py-6 md:grid-cols-2">
        {panelPersonas.length === 2 ? (
          <section className="rounded-xl border border-ai-200 bg-ai-50/60 p-5 md:col-span-2 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="hanko-stamp-filled flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold">
                  団
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ai-900">
                  2-on-1 Panel
                </h3>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ai-700 border border-ai-200 shadow-2xs">
                Two AI interviewers
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {panelPersonas.map((panelPersona, index) => (
                <div
                  key={panelPersona.id}
                  className={`rounded-xl border bg-white p-4 shadow-sm ${
                    index === 0 ? "border-yamabuki-300" : "border-ai-300"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wide text-sumi-500">
                    AI #{index + 1} &middot; {panelPersona.focus_area}
                  </div>
                  <p className="mt-2 text-lg font-bold text-sumi-900">
                    {panelPersona.name}
                  </p>
                  <p className="text-sm font-semibold text-ai-700">
                    {panelPersona.role_title}
                  </p>
                  <p className="mt-2 text-xs text-sumi-600 leading-relaxed italic">
                    &ldquo;{panelPersona.persona_prompt}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-washi-300 bg-washi-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-sumi-500">
                Interviewer Persona
              </h3>
              <span className="rounded bg-shu-50 px-2 py-0.5 text-xs font-semibold text-shu-700 border border-shu-200">
                Pressure Level: {persona.pressure_level}/3
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-sumi-900">{persona.name}</p>
            <p className="text-sm font-semibold text-ai-700">{persona.role}</p>
            <div className="mt-3 text-sm text-sumi-700">
              <span className="font-semibold text-sumi-900">Style: </span>
              {persona.style}
            </div>
          </div>
        )}

        {/* Task & Goal Panel */}
        <div className="rounded-xl border border-washi-300 bg-washi-50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sumi-600">
            Your Objective
          </h3>
          <p className="mt-2 text-sm font-medium text-sumi-900 leading-relaxed">{task.goal}</p>

          <h4 className="mt-3 text-xs font-bold text-sumi-700">Success Criteria:</h4>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-sumi-600">
            {task.success_criteria.map((criteria, index) => (
              <li key={index}>{criteria}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Evaluation Focus */}
      <div className="rounded-xl border border-ai-200 bg-ai-50/50 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ai-900">
          Coach Evaluation Focus
        </h3>
        <p className="mt-1 text-xs text-ai-700">
          The coach will specifically analyze your answers across these criteria:
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {evaluation_focus.map((focus) => (
            <span
              key={focus}
              className="rounded-lg bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-ai-800 shadow-2xs border border-ai-200"
            >
              {focus.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-washi-200">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-washi-300 px-4 py-2 text-sm font-semibold text-sumi-700 hover:bg-washi-100 focus:outline-none transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isStarting}
          onClick={() => onStartSession(scenario)}
          className="inline-flex items-center gap-2 rounded-xl bg-ai-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-ai-800 active:scale-95 focus:outline-none disabled:opacity-50 transition-all"
        >
          {isStarting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-white"
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
              Starting Session...
            </>
          ) : (
            "Start Practice Session"
          )}
        </button>
      </div>
    </div>
  );
};
