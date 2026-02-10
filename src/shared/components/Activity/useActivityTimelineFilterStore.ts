import { create } from "zustand";

const ACTIVITY_TIMELINE_FILTER_STORAGE_KEY = "activity-timeline-hidden-actions";

const readInitialHiddenActions = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACTIVITY_TIMELINE_FILTER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
};

const persistHiddenActions = (hiddenActions: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ACTIVITY_TIMELINE_FILTER_STORAGE_KEY,
      JSON.stringify(hiddenActions)
    );
  } catch {
    // Ignore storage write failures.
  }
};

interface ActivityTimelineFilterState {
  hiddenActions: string[];
  setHiddenActions: (actions: string[]) => void;
  toggleActionVisibility: (action: string, visible: boolean) => void;
  showAllActions: () => void;
}

/** Persists timeline action visibility across route changes and reloads. */
export const useActivityTimelineFilterStore = create<ActivityTimelineFilterState>((set) => ({
  hiddenActions: readInitialHiddenActions(),
  setHiddenActions: (actions) => {
    const uniqueActions = [...new Set(actions)];
    persistHiddenActions(uniqueActions);
    set({ hiddenActions: uniqueActions });
  },
  toggleActionVisibility: (action, visible) =>
    set((state) => {
      const nextHiddenActions = visible
        ? state.hiddenActions.filter((item) => item !== action)
        : [...new Set([...state.hiddenActions, action])];
      persistHiddenActions(nextHiddenActions);
      return { hiddenActions: nextHiddenActions };
    }),
  showAllActions: () => {
    persistHiddenActions([]);
    set({ hiddenActions: [] });
  },
}));
