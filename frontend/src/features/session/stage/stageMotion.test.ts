import { describe, expect, it } from "vitest";
import { getScenarioTheme } from "../RoleplayStage";
import { getCharacterExpression } from "./StageCharacters";

describe("Stage Aesthetics & Motion Utilities", () => {
  describe("getScenarioTheme - Ambient Light Mapping", () => {
    it("returns 'morning' for job interview scenario", () => {
      expect(
        getScenarioTheme({ slug: "job-interview-behavioral", title: "Behavioral Job Interview" }),
      ).toBe("morning");
    });

    it("returns 'golden-hour' for project pitch scenario", () => {
      expect(
        getScenarioTheme({ slug: "project-pitch", title: "Executive Project Pitch" }),
      ).toBe("golden-hour");
    });

    it("returns 'gentle-day' for customer escalation scenario", () => {
      expect(
        getScenarioTheme({ slug: "customer-escalation", title: "Customer Escalation Handling" }),
      ).toBe("gentle-day");
    });

    it("falls back to 'morning' when scenario is null, undefined, or has unknown data", () => {
      expect(getScenarioTheme(null)).toBe("morning");
      expect(getScenarioTheme(undefined)).toBe("morning");
      expect(getScenarioTheme({})).toBe("morning");
      expect(getScenarioTheme({ slug: "unknown-slug-xyz", title: "Mystery Simulation" })).toBe(
        "morning",
      );
    });
  });

  describe("getCharacterExpression - Pure Expression Mapping", () => {
    it("returns 'speaking' when isActiveSpeaker is true", () => {
      expect(
        getCharacterExpression({
          isActiveSpeaker: true,
          isUserSpeaking: false,
          state: "speaking",
        }),
      ).toBe("speaking");
    });

    it("returns 'listening' when user is actively speaking", () => {
      expect(
        getCharacterExpression({
          isActiveSpeaker: false,
          isUserSpeaking: true,
          state: "recording",
        }),
      ).toBe("listening");
    });

    it("returns 'thinking' during transcribing, waiting_reply, and sending states", () => {
      expect(
        getCharacterExpression({
          isActiveSpeaker: false,
          isUserSpeaking: false,
          state: "transcribing",
        }),
      ).toBe("thinking");

      expect(
        getCharacterExpression({
          isActiveSpeaker: false,
          isUserSpeaking: false,
          state: "waiting_reply",
        }),
      ).toBe("thinking");

      expect(
        getCharacterExpression({
          isActiveSpeaker: false,
          isUserSpeaking: false,
          state: "sending",
        }),
      ).toBe("thinking");
    });

    it("returns 'encouraging' when isEncouraging is true or during review state", () => {
      expect(
        getCharacterExpression({
          isActiveSpeaker: false,
          isUserSpeaking: false,
          isEncouraging: true,
        }),
      ).toBe("encouraging");

      expect(
        getCharacterExpression({
          isActiveSpeaker: false,
          isUserSpeaking: false,
          state: "review",
        }),
      ).toBe("encouraging");
    });

    it("returns 'idle' when idle and neither speaker nor user is speaking", () => {
      expect(
        getCharacterExpression({
          isActiveSpeaker: false,
          isUserSpeaking: false,
          state: "idle",
        }),
      ).toBe("idle");
    });

    it("respects customExpression override when provided", () => {
      expect(
        getCharacterExpression({
          isActiveSpeaker: true,
          isUserSpeaking: false,
          customExpression: "encouraging",
        }),
      ).toBe("encouraging");
    });
  });
});
