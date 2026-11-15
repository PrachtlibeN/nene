import React from "react";
import type { DeliveryMetrics } from "../../api/client";

interface DeliveryMetricsPanelProps {
  metrics: DeliveryMetrics | null;
}

export const DeliveryMetricsPanel: React.FC<DeliveryMetricsPanelProps> = ({
  metrics,
}) => {
  if (!metrics) {
    return (
      <div
        data-testid="delivery-metrics-panel"
        className="rounded-2xl border-2 border-washi-300 bg-white p-6 shadow-md"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-sumi-500">
          Panel 2: Delivery &amp; Speech Metrics
        </h3>
        <p className="mt-4 text-xs text-sumi-400">
          No delivery metrics recorded for this session.
        </p>
      </div>
    );
  }

  const formatSpeakingTime = (ms: number | null): string => {
    if (ms == null) return "N/A (typed)";
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${totalSeconds}s`;
  };

  const fillerEntries = Object.entries(metrics.filler_words.breakdown || {});

  return (
    <div
      data-testid="delivery-metrics-panel"
      className="rounded-2xl border-2 border-washi-300 bg-white p-5 sm:p-7 shadow-md space-y-6"
    >
      <div className="border-b border-washi-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-sumi-600 block">
          Panel 2: Delivery &amp; Speech Metrics
        </span>
        <h2 className="text-xl font-bold text-sumi-900 mt-1 tracking-tight">
          Pacing &amp; Speaking Analysis
        </h2>
        <p className="text-xs text-sumi-500 mt-1 leading-relaxed">
          Objective, deterministic speech metrics. These numbers are purely descriptive and do not affect your qualitative coach score.
        </p>
      </div>

      {/* Grid of Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Candidate Turns */}
        <div className="rounded-xl bg-washi-50 p-4 border border-washi-300">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sumi-500 block">
            Candidate Turns
          </span>
          <span className="text-2xl font-black text-sumi-900 mt-1 block">
            {metrics.candidate_turns}
          </span>
        </div>

        {/* Total Words */}
        <div className="rounded-xl bg-washi-50 p-4 border border-washi-300">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sumi-500 block">
            Total Words
          </span>
          <span className="text-2xl font-black text-sumi-900 mt-1 block">
            {metrics.total_words}
          </span>
        </div>

        {/* Avg Words per Turn */}
        <div className="rounded-xl bg-washi-50 p-4 border border-washi-300">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sumi-500 block">
            Avg Words / Turn
          </span>
          <span className="text-2xl font-black text-sumi-900 mt-1 block">
            {metrics.avg_words_per_turn.toFixed(1)}
          </span>
        </div>

        {/* Words per Minute (WPM) */}
        <div className="rounded-xl bg-ai-50/70 p-4 border border-ai-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ai-700 block">
            Speaking Pace (WPM)
          </span>
          <span className="text-2xl font-black text-ai-800 mt-1 block">
            {metrics.words_per_minute != null
              ? metrics.words_per_minute.toFixed(1)
              : "N/A"}
          </span>
          <span className="text-[10px] text-ai-600 font-medium">Target: 120-150 WPM</span>
        </div>

        {/* Speaking Duration */}
        <div className="rounded-xl bg-washi-50 p-4 border border-washi-300">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sumi-500 block">
            Speaking Time
          </span>
          <span className="text-2xl font-black text-sumi-900 mt-1 block">
            {formatSpeakingTime(metrics.speaking_time_ms)}
          </span>
        </div>

        {/* STT Recognition Confidence */}
        <div className="rounded-xl bg-washi-50 p-4 border border-washi-300">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sumi-500 block">
            STT Confidence
          </span>
          <span className="text-2xl font-black text-sumi-900 mt-1 block">
            {metrics.avg_stt_confidence != null
              ? `${Math.round(metrics.avg_stt_confidence * 100)}%`
              : "N/A"}
          </span>
          <span className="text-[10px] text-sumi-400">Whisper accuracy</span>
        </div>

        {/* Filler Words Summary */}
        <div className="col-span-2 rounded-xl bg-yamabuki-50/70 p-4 border border-yamabuki-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-yamabuki-800 block">
              Filler Words Total
            </span>
            <span className="text-2xl font-black text-yamabuki-900 mt-1 block">
              {metrics.filler_words.total}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-yamabuki-800 block">
              Density
            </span>
            <span className="text-lg font-bold text-sumi-800">
              {metrics.filler_words.per_100_words.toFixed(1)}
              <span className="text-xs text-sumi-500 font-normal"> / 100 words</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filler Words Breakdown Chips */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-sumi-700 mb-2">
          Filler Word Breakdown
        </h4>
        {fillerEntries.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fillerEntries.map(([word, count]) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 rounded-full border border-yamabuki-300 bg-yamabuki-50 px-3 py-1 text-xs font-medium text-yamabuki-900 shadow-2xs"
              >
                <span className="font-semibold">&ldquo;{word}&rdquo;:</span>
                <span className="rounded-full bg-yamabuki-200 px-1.5 py-0.2 text-[10px] font-bold text-yamabuki-950">
                  {count}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-sumi-400">
            No common filler words were detected in your speech.
          </p>
        )}
      </div>
    </div>
  );
};
