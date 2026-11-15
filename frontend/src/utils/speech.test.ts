import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanSpeakerTag,
  createSpeechRecognitionController,
  createSpeechSynthesisController,
  getSupportedAudioMimeType,
  splitTextIntoSentences,
  stopAllSpeech,
  type BrowserSpeechRecognitionErrorEvent,
  type BrowserSpeechRecognitionEvent,
  type BrowserSpeechRecognitionInstance,
} from "./speech";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SpeechSynthesisController", () => {
  it("queues panel turns and selects distinct gender-matched voices", () => {
    const maleVoice = {
      name: "Microsoft David",
      lang: "en-US",
    } as SpeechSynthesisVoice;
    const femaleVoice = {
      name: "Microsoft Zira",
      lang: "en-US",
    } as SpeechSynthesisVoice;
    const utterances: SpeechSynthesisUtterance[] = [];
    vi.spyOn(window.speechSynthesis, "getVoices").mockReturnValue([
      maleVoice,
      femaleVoice,
    ]);
    vi.spyOn(window.speechSynthesis, "speak").mockImplementation((utterance) => {
      utterances.push(utterance);
    });
    const onEnd = vi.fn();

    createSpeechSynthesisController().speakSequence(
      [
        { text: "First panel turn", voiceGender: "male" },
        { text: "Second panel turn", voiceGender: "female" },
      ],
      onEnd,
    );

    expect(utterances).toHaveLength(1);
    expect(utterances[0]?.text).toBe("First panel turn");
    expect(utterances[0]?.voice).toBe(maleVoice);

    utterances[0]?.onend?.(new Event("end") as SpeechSynthesisEvent);

    expect(utterances).toHaveLength(2);
    expect(utterances[1]?.text).toBe("Second panel turn");
    expect(utterances[1]?.voice).toBe(femaleVoice);

    utterances[1]?.onend?.(new Event("end") as SpeechSynthesisEvent);
    expect(onEnd).toHaveBeenCalledOnce();
  });
});

describe("cleanSpeakerTag", () => {
  it("strips bracketed speaker tags, persona titles, and colons", () => {
    expect(
      cleanSpeakerTag(
        "[Sarah - People Partner]: I hear you're a club manager, but your answer didn't show.",
      ),
    ).toBe("I hear you're a club manager, but your answer didn't show.");

    expect(
      cleanSpeakerTag("[sarah-people partner] I hear you're a club manager."),
    ).toBe("I hear you're a club manager.");

    expect(
      cleanSpeakerTag("[Alex - Engineering Manager]: Your response is very brief."),
    ).toBe("Your response is very brief.");

    expect(cleanSpeakerTag("Sarah: What was the measurable outcome?")).toBe(
      "What was the measurable outcome?",
    );

    expect(
      cleanSpeakerTag("Alex - Engineering Manager: How did you prioritize?"),
    ).toBe("How did you prioritize?");

    expect(cleanSpeakerTag("Regular dialogue without prefix.")).toBe(
      "Regular dialogue without prefix.",
    );
  });
});

describe("splitTextIntoSentences", () => {
  it("splits multi-sentence text into individual trimmed sentences", () => {
    const input = "Hello world! How are you doing today? I am doing great. Let's start.";
    expect(splitTextIntoSentences(input)).toEqual([
      "Hello world!",
      "How are you doing today?",
      "I am doing great.",
      "Let's start.",
    ]);
  });

  it("handles text with newlines and single sentences", () => {
    expect(splitTextIntoSentences("First line.\nSecond line.")).toEqual([
      "First line.",
      "Second line.",
    ]);
    expect(splitTextIntoSentences("Just one sentence without end punctuation")).toEqual([
      "Just one sentence without end punctuation",
    ]);
    expect(splitTextIntoSentences("")).toEqual([]);
  });
});

describe("SpeechRecognitionController & stopAllSpeech", () => {
  class BaseMockRecognition implements BrowserSpeechRecognitionInstance {
    lang = "en-US";
    interimResults = false;
    maxAlternatives = 1;
    continuous = false;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null = null;
    onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null = null;
    start = vi.fn();
    stop = vi.fn();
    abort = vi.fn();
  }

  it("stopAllSpeech aborts active recognition and cancels speech synthesis", () => {
    const cancelSpy = vi.spyOn(window.speechSynthesis, "cancel");
    const active = new BaseMockRecognition();

    class TestRecognition {
      constructor() {
        return active;
      }
    }
    vi.stubGlobal("SpeechRecognition", TestRecognition);

    const controller = createSpeechRecognitionController({});
    controller.start();

    stopAllSpeech();

    expect(active.abort).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("guards against overlapping start calls", () => {
    const active = new BaseMockRecognition();

    class TestRecognition {
      constructor() {
        return active;
      }
    }
    vi.stubGlobal("SpeechRecognition", TestRecognition);

    const controller = createSpeechRecognitionController({});
    controller.start();
    controller.start(); // second call while starting

    expect(active.start).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("retries with a fresh instance on InvalidStateError without reporting error", () => {
    let callCount = 0;
    const instances: BaseMockRecognition[] = [];

    class TestRecognition {
      constructor() {
        const inst = new BaseMockRecognition();
        instances.push(inst);
        inst.start = vi.fn(() => {
          callCount += 1;
          if (callCount === 1) {
            const err = new Error("recognition has already started");
            err.name = "InvalidStateError";
            throw err;
          }
        });
        return inst;
      }
    }
    vi.stubGlobal("SpeechRecognition", TestRecognition);

    const onError = vi.fn();
    const controller = createSpeechRecognitionController({ onError });
    controller.start();

    expect(instances).toHaveLength(2);
    expect(instances[0]?.abort).toHaveBeenCalled();
    expect(instances[1]?.start).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("distinguishes permanent mic denial from temporary errors", () => {
    const target = new BaseMockRecognition();

    class TestRecognition {
      constructor() {
        return target;
      }
    }
    vi.stubGlobal("SpeechRecognition", TestRecognition);

    const onError = vi.fn();
    const controller = createSpeechRecognitionController({ onError });

    // Temporary error like 'no-speech'
    controller.start();
    target.onerror?.({ error: "no-speech" });
    expect(onError).toHaveBeenLastCalledWith("no-speech", false);
    expect(controller.isListening()).toBe(false);

    // Permanent denial like 'not-allowed'
    controller.start();
    target.onerror?.({ error: "not-allowed" });
    expect(onError).toHaveBeenLastCalledWith("not-allowed", true);
    expect(controller.isListening()).toBe(false);

    vi.unstubAllGlobals();
  });

  it("enables continuous listening and interim results, streaming live updates", () => {
    const target = new BaseMockRecognition();

    class TestRecognition {
      constructor() {
        return target;
      }
    }
    vi.stubGlobal("SpeechRecognition", TestRecognition);

    const onResult = vi.fn();
    const onInterimTranscript = vi.fn();
    const controller = createSpeechRecognitionController({ onResult, onInterimTranscript });
    controller.start();

    expect(target.continuous).toBe(true);
    expect(target.interimResults).toBe(true);

    // Interim speech chunk
    target.onresult?.({
      results: [
        { isFinal: false, 0: { transcript: "I optimized" } },
      ],
    } as unknown as BrowserSpeechRecognitionEvent);

    expect(onInterimTranscript).toHaveBeenLastCalledWith("I optimized");
    expect(onResult).toHaveBeenLastCalledWith("I optimized");

    // Final speech chunk + next interim chunk
    target.onresult?.({
      results: [
        { isFinal: true, 0: { transcript: "I optimized" } },
        { isFinal: false, 0: { transcript: "our database query latencies" } },
      ],
    } as unknown as BrowserSpeechRecognitionEvent);

    expect(onInterimTranscript).toHaveBeenLastCalledWith("our database query latencies");
    expect(onResult).toHaveBeenLastCalledWith("I optimized our database query latencies");

    vi.unstubAllGlobals();
  });

  it("applies 400ms flush buffer on stop unless immediate is specified", () => {
    vi.useFakeTimers();
    const target = new BaseMockRecognition();

    class TestRecognition {
      constructor() {
        return target;
      }
    }
    vi.stubGlobal("SpeechRecognition", TestRecognition);

    const controller = createSpeechRecognitionController({});
    controller.start();

    controller.stop();
    expect(target.stop).not.toHaveBeenCalled();

    vi.advanceTimersByTime(399);
    expect(target.stop).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(target.stop).toHaveBeenCalledTimes(1);

    // Immediate stop
    controller.start();
    controller.stop({ immediate: true });
    expect(target.stop).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});

describe("getSupportedAudioMimeType", () => {
  it("prioritizes webm and mp4 formats based on MediaRecorder support", () => {
    const originalMediaRecorder = window.MediaRecorder;

    // Simulate Safari supporting audio/mp4 but not webm
    const mockIsTypeSupported = vi.fn((type: string) => type === "audio/mp4");
    window.MediaRecorder = {
      isTypeSupported: mockIsTypeSupported,
    } as unknown as typeof MediaRecorder;

    expect(getSupportedAudioMimeType()).toBe("audio/mp4");

    // Simulate Chrome supporting webm opus
    window.MediaRecorder.isTypeSupported = vi.fn((type: string) =>
      type.includes("webm"),
    );
    expect(getSupportedAudioMimeType()).toBe("audio/webm;codecs=opus");

    window.MediaRecorder = originalMediaRecorder;
  });
});
