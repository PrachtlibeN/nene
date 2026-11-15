import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { ScenariosView } from "./ScenariosView";
import { handlers } from "../../mocks/handlers";
import { scenarioExample } from "../../mocks/examples";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("ScenariosView Text & Compliance Test", () => {
  it("only displays clean functional text and real data (no forbidden aesthetic slogans)", async () => {
    // Return 3 scenarios with difficulty 1, 2, and 3 to verify all kanji badges
    server.use(
      http.get("*/api/v1/scenarios", () => {
        return HttpResponse.json({
          items: [
            { ...scenarioExample, id: "scn_1", difficulty: 1, title: "Customer Escalation" },
            { ...scenarioExample, id: "scn_2", difficulty: 2, title: "Behavioral Job Interview" },
            { ...scenarioExample, id: "scn_3", difficulty: 3, title: "Project Pitch" },
          ],
        });
      }),
    );

    const handleStart = vi.fn();
    const { container } = render(<ScenariosView onSessionStarted={handleStart} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Roleplay Practice Scenarios" }),
      ).toBeInTheDocument();
    });

    const fullText = container.textContent || "";

    // 1. Forbidden styling & promotional words
    const forbiddenWords = [
      "aesthetic",
      "style",
      "theme",
      "redesign",
      "lorem",
      "TODO",
      "impromptu challenge",
      "回想ロール",
      "ECHOROLE AI COACH",
      "AI Coach",
      "成績表",
      "波紋",
    ];

    for (const word of forbiddenWords) {
      const lowerText = fullText.toLowerCase();
      const lowerWord = word.toLowerCase();
      expect(lowerText.includes(lowerWord)).toBe(false);
    }

    // 2. Japanese characters check: only 初級, 中級, 上級 are permitted
    const japaneseMatches = fullText.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
    const uniqueJapaneseChars = Array.from(new Set(japaneseMatches));

    // Permitted characters: '初', '級', '中', '上'
    const allowedChars = new Set(["初", "級", "中", "上"]);
    for (const char of uniqueJapaneseChars) {
      expect(allowedChars.has(char)).toBe(true);
    }

    // Check that 初級, 中級, and 上級 are all present for difficulty 1, 2, and 3
    expect(fullText).toContain("初級");
    expect(fullText).toContain("中級");
    expect(fullText).toContain("上級");
  });

  it("limits hero description to <= 90 characters", async () => {
    const handleStart = vi.fn();
    render(<ScenariosView onSessionStarted={handleStart} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Roleplay Practice Scenarios" }),
      ).toBeInTheDocument();
    });

    const heroDesc = screen.getByText(
      "Practice high-stakes English conversations with dual AI panel interviewers.",
    );
    expect(heroDesc).toBeInTheDocument();
    expect(heroDesc.textContent?.length).toBeLessThanOrEqual(90);
  });
});
