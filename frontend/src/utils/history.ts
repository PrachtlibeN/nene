import type {
  DeliveryMetrics,
  EvaluationResult,
  Improvement,
  Strength,
} from "../api/client";

export interface SessionHistoryItem {
  id: string;
  sessionId: string;
  scenarioTitle: string;
  scenarioSlug?: string;
  completedAt: string;
  overallScore: number;
  summary: string;
  deliveryMetrics: DeliveryMetrics | null;
  result: EvaluationResult | null;
  strengths: Strength[];
  improvements: Improvement[];
}

const STORAGE_KEY = "echorole_session_history_v1";

let memoryFallback: Record<string, string> = {};

function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.getItem("__test__");
      return window.localStorage;
    }
  } catch {
    // Fall back to in-memory store
  }
  return {
    getItem: (key: string): string | null => memoryFallback[key] ?? null,
    setItem: (key: string, value: string): void => {
      memoryFallback[key] = value;
    },
    removeItem: (key: string): void => {
      delete memoryFallback[key];
    },
    clear: (): void => {
      memoryFallback = {};
    },
  };
}

export function loadSessionHistory(): SessionHistoryItem[] {
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveSessionHistoryItem(item: SessionHistoryItem): void {
  try {
    const history = loadSessionHistory();
    // Replace if existing for same session, otherwise prepend
    const filtered = history.filter((h) => h.sessionId !== item.sessionId);
    const updated = [item, ...filtered];
    getStorage().setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota/permission exceptions
  }
}

export function clearSessionHistory(): void {
  try {
    getStorage().removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
