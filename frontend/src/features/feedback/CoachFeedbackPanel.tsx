import React from "react";
import type { EvaluationResult } from "../../api/client";

interface CoachFeedbackPanelProps {
  result: EvaluationResult;
}

const CRITERION_LABELS: Record<string, string> = {
  relevance: "Relevance & Goal Alignment",
  structure: "Structure & Organization (STAR)",
  clarity: "Clarity & Precision",
  composure: "Composure Under Pressure",
  conciseness: "Conciseness & Efficiency",
  language_accuracy: "Language Accuracy & Register",
};

export const CoachFeedbackPanel: React.FC<CoachFeedbackPanelProps> = ({
  result,
}) => {
  const outcomeBadge = () => {
    switch (result.task_outcome.achieved) {
      case "yes":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-matcha-100 px-3 py-1 text-xs font-bold text-matcha-800 border border-matcha-300">
            <span>達成</span>
            <span>Task Achieved</span>
          </span>
        );
      case "partially":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yamabuki-100 px-3 py-1 text-xs font-bold text-yamabuki-800 border border-yamabuki-300">
            <span>一部達成</span>
            <span>Partially Achieved</span>
          </span>
        );
      case "no":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-shu-100 px-3 py-1 text-xs font-bold text-shu-800 border border-shu-300">
            <span>未達成</span>
            <span>Not Achieved</span>
          </span>
        );
    }
  };

  // SVG circular gauge calculation for overall score
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, result.overall_score)) / 100) * circumference;

  return (
    <div
      data-testid="coach-feedback-panel"
      className="rounded-2xl border-2 border-washi-300 bg-white p-5 sm:p-7 shadow-md space-y-6"
    >
      {/* Panel 1 Header: Overall Score & Summary */}
      <div className="border-b border-washi-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="hanko-stamp-filled flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold">
                評
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-ai-700">
                Panel 1: Coach Assessment &amp; Scores
              </span>
            </div>
            <h2 className="text-2xl font-black text-sumi-900 mt-1 tracking-tight">
              Communication Feedback
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {outcomeBadge()}

            {/* Circular SVG Gauge for Overall Score (Zero UI arithmetic on raw value) */}
            <div className="flex items-center gap-3 rounded-2xl bg-washi-100 px-4 py-2.5 border border-washi-300 shadow-xs">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
                  <circle
                    cx="45"
                    cy="45"
                    r={radius}
                    className="text-washi-300"
                    strokeWidth="7"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="45"
                    cy="45"
                    r={radius}
                    className="text-ai-700 transition-all duration-1000 ease-out"
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-ai-900">SCORE</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sumi-500">
                  Overall Score
                </span>
                <span
                  data-testid="overall-score-display"
                  className="text-3xl font-black text-sumi-900 leading-none"
                >
                  {result.overall_score}
                  <span className="text-sm font-medium text-sumi-400">/100</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Task Outcome */}
        <p className="mt-4 text-sm sm:text-base font-medium text-sumi-800 bg-washi-100 p-4 rounded-xl border border-washi-200 leading-relaxed">
          &ldquo;{result.summary}&rdquo;
        </p>
        <p className="mt-2 text-xs text-sumi-600">
          <span className="font-semibold text-sumi-800">Goal Assessment: </span>
          {result.task_outcome.explanation}
        </p>
      </div>

      {/* Rubric Criteria: 6 Criteria with Raw Scores & Weighted Points */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-sumi-700 mb-3 flex items-center gap-1.5">
          <span>基準</span>
          <span>Rubric Criteria Scores</span>
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.criteria.map((item) => {
            const displayName =
              CRITERION_LABELS[item.criterion] ?? item.criterion.replace("_", " ");
            return (
              <div
                key={item.criterion}
                data-testid={`criterion-${item.criterion}`}
                className="rounded-xl border border-washi-300 bg-washi-50/70 p-4 space-y-2 hover:bg-white hover:border-ai-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-sumi-900">
                    {displayName}
                  </h4>
                  {/* Raw score and raw weighted_points from API */}
                  <div className="text-right">
                    <span className="text-sm font-black text-ai-700">
                      {item.score}/10
                    </span>
                    <span
                      data-testid={`weighted-points-${item.criterion}`}
                      className="block text-[11px] font-semibold text-sumi-500"
                    >
                      {item.weighted_points} pts ({item.weight_percent}%)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-sumi-600 leading-relaxed">
                  {item.rationale}
                </p>

                {item.evidence_turn_ids.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-sumi-400">
                    <span>Evidence:</span>
                    {item.evidence_turn_ids.map((id) => (
                      <span
                        key={id}
                        className="rounded bg-washi-200 px-1.5 py-0.5 font-mono text-[10px] text-sumi-700 border border-washi-300"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-washi-200">
        {/* Strengths (Matcha Accent) */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-matcha-800">
            <span className="hanko-stamp flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-matcha-700 border-matcha-600">
              強
            </span>
            Key Strengths
          </h3>
          <ul className="space-y-2">
            {result.strengths.map((strength, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-matcha-200 bg-matcha-50/70 p-3.5 text-xs text-sumi-900"
              >
                <p className="font-medium leading-relaxed">{strength.text}</p>
                {strength.evidence_turn_ids.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-matcha-700">
                    <span>Turns:</span>
                    {strength.evidence_turn_ids.map((id) => (
                      <span key={id} className="font-mono underline">
                        {id}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements (Yamabuki/Amber Accent) */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yamabuki-800">
            <span className="hanko-stamp flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-yamabuki-700 border-yamabuki-600">
              改
            </span>
            Areas for Growth
          </h3>
          <ul className="space-y-2">
            {result.improvements.map((improvement, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-yamabuki-200 bg-yamabuki-50/60 p-3.5 text-xs text-sumi-900 space-y-2"
              >
                <p className="font-medium leading-relaxed">{improvement.text}</p>
                {improvement.example_rewrite && (
                  <div className="rounded-lg bg-white p-2.5 border border-yamabuki-200 text-sumi-800 shadow-2xs">
                    <span className="font-bold text-[10px] uppercase text-yamabuki-700 block">
                      Suggested Phrasing:
                    </span>
                    <span className="italic">
                      &ldquo;{improvement.example_rewrite}&rdquo;
                    </span>
                  </div>
                )}
                {improvement.evidence_turn_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[10px] text-yamabuki-700">
                    <span>Turns:</span>
                    {improvement.evidence_turn_ids.map((id) => (
                      <span key={id} className="font-mono underline">
                        {id}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Next Task (TBLT Mission Scroll) */}
      <div className="rounded-2xl border border-ai-200 bg-gradient-to-r from-ai-50 via-washi-100 to-ai-50 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="hanko-stamp-filled flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold">
            令
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ai-700">
            Recommended Follow-Up Task (TBLT)
          </span>
        </div>
        <h4 className="text-base font-bold text-ai-900 mt-1">
          {result.next_task.title}
        </h4>
        <p className="mt-1 text-xs text-sumi-700 leading-relaxed">
          {result.next_task.instructions}
        </p>
      </div>
    </div>
  );
};
