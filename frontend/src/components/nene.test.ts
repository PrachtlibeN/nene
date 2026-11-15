import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  IDLE_ACTIVITIES,
  selectNextIdleActivity,
  useNeneBehavior,
} from "./useNeneBehavior";

describe("selectNextIdleActivity", () => {
  it("never returns the previous activity consecutively", () => {
    for (const prev of IDLE_ACTIVITIES) {
      // Test across multiple RNG seeds
      for (let r = 0; r < 1; r += 0.1) {
        const next = selectNextIdleActivity(prev, 10, () => r);
        expect(next).not.toBe(prev);
        expect(IDLE_ACTIVITIES).toContain(next);
      }
    }
  });

  it("returns 'sleepy' when idleSeconds is >= 45", () => {
    expect(selectNextIdleActivity("look_around", 45)).toBe("sleepy");
    expect(selectNextIdleActivity("tilt_head", 60)).toBe("sleepy");
    expect(selectNextIdleActivity(null, 90)).toBe("sleepy");
  });

  it("does not return 'sleepy' when idleSeconds is < 45", () => {
    for (let sec = 0; sec < 45; sec += 10) {
      const next = selectNextIdleActivity("idle", sec);
      expect(next).not.toBe("sleepy");
    }
  });

  it("supports deterministic RNG mock", () => {
    // If candidates length is 7 (8 total minus 1 prev), index = Math.floor(0 * 7) = 0
    const mockRngMin = () => 0.0;
    const firstCandidate = selectNextIdleActivity("look_around", 10, mockRngMin);
    expect(firstCandidate).toBe(IDLE_ACTIVITIES.filter((a) => a !== "look_around")[0]);

    // index = Math.floor(0.999 * 7) = 6 (last candidate)
    const mockRngMax = () => 0.999;
    const candidates = IDLE_ACTIVITIES.filter((a) => a !== "look_around");
    const lastCandidate = selectNextIdleActivity("look_around", 10, mockRngMax);
    expect(lastCandidate).toBe(candidates[candidates.length - 1]);
  });
});

describe("useNeneBehavior hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("initializes with wave_hello by default and reverts to idle", () => {
    const { result } = renderHook(() => useNeneBehavior());
    expect(result.current.activity).toBe("wave_hello");

    // After wave_hello duration (2600ms), transitions to idle
    act(() => {
      vi.advanceTimersByTime(2700);
    });

    expect(result.current.activity).toBe("idle");
  });

  it("cycles to an idle activity after idle interval", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { result } = renderHook(() =>
      useNeneBehavior({ initialActivity: "idle" }),
    );
    expect(result.current.activity).toBe("idle");

    // waitMs = 6000 + 0.1 * 6000 = 6600ms. Advance 6700ms.
    act(() => {
      vi.advanceTimersByTime(6700);
    });

    // Should have transitioned to one of IDLE_ACTIVITIES
    expect(IDLE_ACTIVITIES).toContain(result.current.activity);
    randomSpy.mockRestore();
  });

  it("handles click with 1200ms cooldown", () => {
    const { result } = renderHook(() =>
      useNeneBehavior({ initialActivity: "idle" }),
    );

    // Click 1
    act(() => {
      result.current.handleClick();
    });
    expect(result.current.activity).toBe("clicked");

    // Rapid click within 1200ms should be ignored (cooldown)
    act(() => {
      vi.advanceTimersByTime(300);
      result.current.handleClick();
    });
    expect(result.current.activity).toBe("clicked");

    // After click animation finishes (1400ms), reverts to idle
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(result.current.activity).toBe("idle");

    // Subsequent click after cooldown succeeds
    act(() => {
      vi.advanceTimersByTime(500);
      result.current.handleClick();
    });
    expect(result.current.activity).toBe("clicked");
  });

  it("handles CTA hover interaction (excited)", () => {
    const { result } = renderHook(() =>
      useNeneBehavior({ initialActivity: "idle" }),
    );

    // Hover CTA -> excited
    act(() => {
      result.current.handleCtaHover(true);
    });
    expect(result.current.activity).toBe("excited");

    // Leave CTA -> returns to idle
    act(() => {
      result.current.handleCtaHover(false);
    });
    expect(result.current.activity).toBe("idle");
  });

  it("handles card column hover interactions", () => {
    const { result } = renderHook(() =>
      useNeneBehavior({ initialActivity: "idle" }),
    );

    act(() => {
      result.current.handleCardHover("left");
    });
    expect(result.current.activity).toBe("look_card_left");

    act(() => {
      result.current.handleCardHover("right");
    });
    expect(result.current.activity).toBe("look_card_right");

    act(() => {
      result.current.handleCardHover(null);
    });
    expect(result.current.activity).toBe("idle");
  });

  it("handles filter tab change with nod reaction", () => {
    const { result } = renderHook(() =>
      useNeneBehavior({ initialActivity: "idle" }),
    );

    act(() => {
      result.current.handleFilterChange();
    });
    expect(result.current.activity).toBe("nod_filter");

    // Reverts after 1000ms
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.activity).toBe("idle");
  });

  it("wakes up with startle when sleepy and user clicks", () => {
    const { result } = renderHook(() =>
      useNeneBehavior({ initialActivity: "sleepy" }),
    );
    expect(result.current.activity).toBe("sleepy");

    act(() => {
      result.current.handleClick();
    });
    expect(result.current.activity).toBe("wake_up");

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.activity).toBe("idle");
  });

  it("clears timers cleanly on unmount", () => {
    const { unmount } = renderHook(() => useNeneBehavior());
    // Should not throw any errors when unmounting with active timers
    expect(() => unmount()).not.toThrow();
  });
});
