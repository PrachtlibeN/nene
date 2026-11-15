import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HistoryView } from "./HistoryView";
import { clearSessionHistory, saveSessionHistoryItem } from "../../utils/history";

describe("HistoryView", () => {
  beforeEach(() => {
    clearSessionHistory();
  });

  it("renders empty state when no history is saved", () => {
    const onBackToHome = vi.fn();
    render(<HistoryView onBackToHome={onBackToHome} />);

    expect(
      screen.getByText(/no practice sessions recorded yet/i),
    ).toBeInTheDocument();

    const startBtn = screen.getByRole("button", {
      name: /browse scenarios & start/i,
    });
    fireEvent.click(startBtn);
    expect(onBackToHome).toHaveBeenCalledOnce();
  });

  it("renders saved history item and details", () => {
    saveSessionHistoryItem({
      id: "eval-1",
      sessionId: "session-1",
      scenarioTitle: "System Architecture Deep Dive",
      completedAt: "2026-11-15T08:00:00.000Z",
      overallScore: 85,
      summary: "Clear technical depth and structured thinking.",
      deliveryMetrics: {
        candidate_turns: 4,
        total_words: 320,
        avg_words_per_turn: 80,
        speaking_time_ms: 120000,
        words_per_minute: 140,
        filler_words: { total: 2, per_100_words: 0.6, breakdown: { like: 2 } },
        avg_stt_confidence: 0.94,
      },
      result: null,
      strengths: [
        {
          text: "Strong architectural tradeoffs articulation.",
          evidence_turn_ids: ["turn-1"],
        },
      ],
      improvements: [
        {
          text: "Quantify latency targets earlier in the response.",
          example_rewrite: "We targeted sub-50ms p99 latency.",
          evidence_turn_ids: ["turn-2"],
        },
      ],
    });

    const onBackToHome = vi.fn();
    render(<HistoryView onBackToHome={onBackToHome} />);

    expect(
      screen.getAllByText("System Architecture Deep Dive").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("85").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/Clear technical depth and structured thinking./i),
    ).toBeInTheDocument();
    expect(screen.getByText("140 wpm")).toBeInTheDocument();
    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(
      screen.getByText("Strong architectural tradeoffs articulation."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We targeted sub-50ms p99 latency./i),
    ).toBeInTheDocument();
  });

  it("navigates back to home via top toolbar button", () => {
    const onBackToHome = vi.fn();
    render(<HistoryView onBackToHome={onBackToHome} />);

    const backBtn = screen.getByRole("button", { name: /back to home/i });
    fireEvent.click(backBtn);
    expect(onBackToHome).toHaveBeenCalledOnce();
  });
});
