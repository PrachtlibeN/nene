import { useCallback, useEffect, useRef, useState } from "react";

export type NeneActivity =
  | "idle"
  | "look_around"
  | "tilt_head"
  | "stretch_wings"
  | "small_hop"
  | "preen"
  | "humming"
  | "read_book"
  | "tap_foot"
  | "sleepy"
  | "wake_up"
  | "wave_hello"
  | "excited"
  | "look_card_left"
  | "look_card_center"
  | "look_card_right"
  | "nod_filter"
  | "clicked";

export const IDLE_ACTIVITIES: NeneActivity[] = [
  "look_around",
  "tilt_head",
  "stretch_wings",
  "small_hop",
  "preen",
  "humming",
  "read_book",
  "tap_foot",
];

/**
 * Pure function to select the next idle activity.
 * Guarantees:
 * 1. Never repeats the same activity consecutively.
 * 2. Triggers 'sleepy' ONLY when idleSeconds >= 45.
 * 3. Supports injected RNG for deterministic unit tests.
 */
export function selectNextIdleActivity(
  prevActivity: NeneActivity | null,
  idleSeconds: number,
  rng: () => number = Math.random,
): NeneActivity {
  if (idleSeconds >= 45) {
    return "sleepy";
  }

  const candidates = IDLE_ACTIVITIES.filter((act) => act !== prevActivity);
  const index = Math.floor(rng() * candidates.length);
  return candidates[index] || "look_around";
}

export interface UseNeneBehaviorOptions {
  containerRef?: React.RefObject<HTMLElement | null>;
  initialActivity?: NeneActivity;
  disableTimersForTest?: boolean;
}

export interface UseNeneBehaviorResult {
  activity: NeneActivity;
  pupilOffset: { x: number; y: number };
  isBlinking: boolean;
  handleClick: () => void;
  handleCtaHover: (hovering: boolean) => void;
  handleCardHover: (column: "left" | "center" | "right" | null) => void;
  handleFilterChange: () => void;
}

export function useNeneBehavior(options: UseNeneBehaviorOptions = {}): UseNeneBehaviorResult {
  const { initialActivity = "wave_hello", disableTimersForTest = false } = options;
  const [activity, setActivity] = useState<NeneActivity>(initialActivity);
  const [pupilOffset, setPupilOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  // Activity tracking refs
  const activityRef = useRef<NeneActivity>(initialActivity);
  activityRef.current = activity;

  const prevActivityRef = useRef<NeneActivity | null>(null);
  const idleSecondsRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const isDocumentHiddenRef = useRef<boolean>(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Clear any single scheduled activity timer
  const clearActiveTimer = useCallback(() => {
    if (activeTimerRef.current !== null) {
      clearTimeout(activeTimerRef.current);
      activeTimerRef.current = null;
    }
  }, []);

  // Schedule returning to idle or next idle action
  const scheduleReturnToIdle = useCallback((durationMs: number) => {
    clearActiveTimer();
    activeTimerRef.current = setTimeout(() => {
      prevActivityRef.current = activityRef.current;
      setActivity("idle");
    }, durationMs);
  }, [clearActiveTimer]);

  // Handle clicking Nene with 1.2s cooldown
  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 1200) {
      return; // cooldown active
    }
    lastClickTimeRef.current = now;
    idleSecondsRef.current = 0;
    clearActiveTimer();

    if (activityRef.current === "sleepy") {
      setActivity("wake_up");
      if (!prefersReducedMotion) {
        scheduleReturnToIdle(800);
      }
      return;
    }

    setActivity("clicked");
    if (!prefersReducedMotion) {
      scheduleReturnToIdle(1100);
    }
  }, [clearActiveTimer, prefersReducedMotion, scheduleReturnToIdle]);

  // Context: CTA Button Hover
  const handleCtaHover = useCallback((hovering: boolean) => {
    idleSecondsRef.current = 0;
    if (prefersReducedMotion) return;

    if (hovering) {
      clearActiveTimer();
      setActivity("excited");
    } else {
      setActivity("idle");
    }
  }, [clearActiveTimer, prefersReducedMotion]);

  // Context: Card Hover (look towards card column)
  const handleCardHover = useCallback((column: "left" | "center" | "right" | null) => {
    idleSecondsRef.current = 0;
    if (prefersReducedMotion) return;

    if (column === "left") {
      setActivity("look_card_left");
    } else if (column === "center") {
      setActivity("look_card_center");
    } else if (column === "right") {
      setActivity("look_card_right");
    } else {
      if (
        activityRef.current === "look_card_left" ||
        activityRef.current === "look_card_center" ||
        activityRef.current === "look_card_right"
      ) {
        setActivity("idle");
      }
    }
  }, [prefersReducedMotion]);

  // Context: Filter pill changed
  const handleFilterChange = useCallback(() => {
    idleSecondsRef.current = 0;
    if (prefersReducedMotion) return;

    clearActiveTimer();
    setActivity("nod_filter");
    scheduleReturnToIdle(850);
  }, [clearActiveTimer, prefersReducedMotion, scheduleReturnToIdle]);

  // Reset idle timer on any user interaction; wake up if sleepy
  const handleUserActivity = useCallback(() => {
    if (activityRef.current === "sleepy") {
      clearActiveTimer();
      setActivity("wake_up");
      scheduleReturnToIdle(700);
    }
    idleSecondsRef.current = 0;
  }, [clearActiveTimer, scheduleReturnToIdle]);

  // Lifecycle & timers
  useEffect(() => {
    if (disableTimersForTest || prefersReducedMotion) {
      return;
    }

    // 1. Initial page load wave (~1.5s)
    if (initialActivity === "wave_hello") {
      scheduleReturnToIdle(1500);
    }

    // 2. Track document visibility
    const onVisibilityChange = () => {
      isDocumentHiddenRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 3. User activity listeners (to reset idle seconds)
    const interactionEvents = ["mousemove", "keydown", "pointerdown", "touchstart"];
    interactionEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // 4. Track idle seconds every 1s
    idleIntervalRef.current = setInterval(() => {
      if (isDocumentHiddenRef.current) return;
      idleSecondsRef.current += 1;

      // If already idle for >= 45s and in idle state, become sleepy
      if (idleSecondsRef.current >= 45 && activityRef.current === "idle") {
        setActivity("sleepy");
      }
    }, 1000);

    // 5. Idle activities scheduler: runs every 6-12s
    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleNextIdleAction = () => {
      const waitMs = 6000 + Math.random() * 6000; // 6s to 12s
      idleTimeout = setTimeout(() => {
        if (
          !isDocumentHiddenRef.current &&
          activityRef.current === "idle" &&
          idleSecondsRef.current < 45
        ) {
          const nextAct = selectNextIdleActivity(prevActivityRef.current, idleSecondsRef.current);
          prevActivityRef.current = nextAct;
          setActivity(nextAct);

          // Action duration: 1.5s to 3s (read_book is 3s)
          const duration = nextAct === "read_book" ? 3000 : 1800 + Math.random() * 800;
          scheduleReturnToIdle(duration);
        }
        scheduleNextIdleAction();
      }, waitMs);
    };
    scheduleNextIdleAction();

    // 6. Natural Eye Blinking scheduler (every 3-5s, blinks for 150ms)
    const scheduleBlink = () => {
      const blinkWait = 3000 + Math.random() * 2000;
      blinkTimerRef.current = setTimeout(() => {
        if (!isDocumentHiddenRef.current && activityRef.current !== "sleepy") {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 150);
        }
        scheduleBlink();
      }, blinkWait);
    };
    scheduleBlink();

    // Cleanup
    return () => {
      clearActiveTimer();
      if (idleTimeout) clearTimeout(idleTimeout);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      interactionEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
    };
  }, [clearActiveTimer, disableTimersForTest, handleUserActivity, initialActivity, prefersReducedMotion, scheduleReturnToIdle]);

  // Pupil cursor tracking (throttled with rAF, max ±3px)
  useEffect(() => {
    if (disableTimersForTest || prefersReducedMotion) return;
    if (typeof window === "undefined") return;

    // Skip on touch-only devices
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      if (activityRef.current === "sleepy") return;
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const dx = (e.clientX - centerX) / (window.innerWidth / 2);
        const dy = (e.clientY - centerY) / (window.innerHeight / 2);

        // Clamp to ±3px
        const clampedX = Math.max(-3, Math.min(3, Math.round(dx * 3)));
        const clampedY = Math.max(-2, Math.min(2.5, Math.round(dy * 2.5)));
        setPupilOffset({ x: clampedX, y: clampedY });
      });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [disableTimersForTest, prefersReducedMotion]);

  return {
    activity,
    pupilOffset,
    isBlinking,
    handleClick,
    handleCtaHover,
    handleCardHover,
    handleFilterChange,
  };
}
