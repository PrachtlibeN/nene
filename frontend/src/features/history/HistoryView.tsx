import React, { useState, useEffect } from "react";
import {
  clearSessionHistory,
  loadSessionHistory,
  type SessionHistoryItem,
} from "../../utils/history";

interface HistoryViewProps {
  onBackToHome: () => void;
  onSelectScenarioSlug?: (slug: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBackToHome }) => {
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SessionHistoryItem | null>(null);

  useEffect(() => {
    const items = loadSessionHistory();
    setHistory(items);
    if (items.length > 0) {
      setSelectedItem(items[0]);
    }
  }, []);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your practice history?")) {
      clearSessionHistory();
      setHistory([]);
      setSelectedItem(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-washi-300 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-ai-600" />
            <h2 className="text-xl sm:text-2xl font-black text-sumi-900 tracking-tight">
              Practice History &amp; Progress
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-sumi-600">
            Review detailed feedback, speaking pace, and improvement tips from your completed sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="rounded-lg border border-shu-200 bg-shu-50 px-3 py-1.5 text-xs font-semibold text-shu-700 hover:bg-shu-100 transition-colors focus:outline-none"
            >
              Clear History
            </button>
          )}
          <button
            type="button"
            onClick={onBackToHome}
            className="rounded-lg bg-ai-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-ai-800 transition-colors focus:outline-none"
          >
            &larr; Back to Home
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-washi-300 bg-white/90 p-8 sm:p-12 text-center shadow-xs backdrop-blur-sm max-w-xl mx-auto my-8 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ai-50 text-ai-600 border border-ai-200 text-2xl font-serif">
            歴
          </div>
          <h3 className="text-base sm:text-lg font-bold text-sumi-900">
            No Practice Sessions Recorded Yet
          </h3>
          <p className="text-xs sm:text-sm text-sumi-600 leading-relaxed">
            Complete your first roleplay interview session to automatically save your delivery metrics,
            scores, and personalized coach guidance here.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="rounded-xl bg-ai-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow hover:bg-ai-800 transition-all focus:outline-none"
            >
              Browse Scenarios &amp; Start &rarr;
            </button>
          </div>
        </div>
      ) : (
        /* History Layout: Master-Detail on Desktop */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Session List */}
          <div className="md:col-span-4 space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sumi-500 px-1">
              Sessions ({history.length})
            </span>
            {history.map((item) => {
              const isSelected = selectedItem?.sessionId === item.sessionId;
              return (
                <div
                  key={item.sessionId}
                  onClick={() => setSelectedItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedItem(item);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-ai-600 bg-white shadow-md ring-2 ring-ai-200"
                      : "border-washi-300 bg-white/80 hover:bg-white hover:border-washi-400 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-sumi-900 truncate">
                      {item.scenarioTitle}
                    </h4>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${
                        item.overallScore >= 70
                          ? "bg-matcha-100 text-matcha-800"
                          : item.overallScore >= 50
                            ? "bg-yamabuki-100 text-yamabuki-800"
                            : "bg-shu-100 text-shu-800"
                      }`}
                    >
                      {item.overallScore}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-sumi-500">
                    {formatDate(item.completedAt)}
                  </p>

                  {item.deliveryMetrics && (
                    <div className="mt-2 pt-2 border-t border-washi-200 flex items-center gap-3 text-[10px] text-sumi-600 font-medium">
                      <span>
                        Pace:{" "}
                        <strong className="text-sumi-800">
                          {item.deliveryMetrics.words_per_minute ?? "--"} wpm
                        </strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Words:{" "}
                        <strong className="text-sumi-800">
                          {item.deliveryMetrics.total_words}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Selected Session Details */}
          <div className="md:col-span-8">
            {selectedItem ? (
              <div className="rounded-2xl border border-washi-300 bg-white p-4 sm:p-6 shadow-sm space-y-5">
                {/* Header of details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-washi-200 pb-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ai-700">
                      Session Evaluation
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-sumi-900">
                      {selectedItem.scenarioTitle}
                    </h3>
                    <p className="text-xs text-sumi-500 mt-0.5">
                      Completed: {formatDate(selectedItem.completedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-sumi-500 block">
                        Overall Score
                      </span>
                      <span className="text-2xl font-black text-ai-800">
                        {selectedItem.overallScore}
                        <span className="text-xs font-normal text-sumi-500">/100</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coach Summary */}
                {selectedItem.summary && (
                  <div className="rounded-xl bg-ai-50/70 border border-ai-200 p-3.5 text-xs sm:text-sm text-sumi-800 leading-relaxed">
                    <strong className="text-ai-800 font-bold block mb-1">
                      Coach Summary:
                    </strong>
                    {selectedItem.summary}
                  </div>
                )}

                {/* Delivery Metrics Overview */}
                {selectedItem.deliveryMetrics && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sumi-600">
                      Speech Delivery Metrics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-washi-100 border border-washi-300 text-center">
                        <span className="text-[11px] text-sumi-500 block">Pace</span>
                        <span className="text-sm sm:text-base font-bold text-sumi-900">
                          {selectedItem.deliveryMetrics.words_per_minute ?? "--"}{" "}
                          <span className="text-[10px] font-normal">wpm</span>
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-washi-100 border border-washi-300 text-center">
                        <span className="text-[11px] text-sumi-500 block">Total Words</span>
                        <span className="text-sm sm:text-base font-bold text-sumi-900">
                          {selectedItem.deliveryMetrics.total_words}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-washi-100 border border-washi-300 text-center">
                        <span className="text-[11px] text-sumi-500 block">Confidence</span>
                        <span className="text-sm sm:text-base font-bold text-sumi-900">
                          {selectedItem.deliveryMetrics.avg_stt_confidence !== null
                            ? `${Math.round(selectedItem.deliveryMetrics.avg_stt_confidence * 100)}%`
                            : "--"}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-washi-100 border border-washi-300 text-center">
                        <span className="text-[11px] text-sumi-500 block">Fillers</span>
                        <span className="text-sm sm:text-base font-bold text-sumi-900">
                          {selectedItem.deliveryMetrics.filler_words?.total ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {selectedItem.strengths && selectedItem.strengths.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-matcha-800 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-matcha-600" />
                      Key Strengths
                    </h4>
                    <div className="space-y-1.5">
                      {selectedItem.strengths.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-matcha-50/70 border border-matcha-200 text-xs sm:text-sm text-matcha-900"
                        >
                          {s.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {selectedItem.improvements && selectedItem.improvements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-shu-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-shu-600" />
                      Actionable Improvements
                    </h4>
                    <div className="space-y-2">
                      {selectedItem.improvements.map((imp, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-shu-50/60 border border-shu-200 text-xs sm:text-sm text-sumi-800 space-y-1.5"
                        >
                          <p className="font-semibold text-shu-900">{imp.text}</p>
                          {imp.example_rewrite && (
                            <div className="mt-1.5 p-2 rounded-lg bg-white/90 border border-shu-200 text-xs text-sumi-700 italic">
                              <span className="font-bold not-italic text-shu-800 block text-[10px] uppercase">
                                Recommended Rewrite:
                              </span>
                              &ldquo;{imp.example_rewrite}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-sumi-500 border border-washi-300 rounded-2xl bg-white">
                Select a session from the list to view its complete report.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
