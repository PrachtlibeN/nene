import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createSpeechRecognitionController,
  createSpeechSynthesisController,
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
});
