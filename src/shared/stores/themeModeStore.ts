import { create } from "zustand";

export type ThemeMode = "light" | "dark";

/** Keep in sync with the pre-paint script in index.html. */
export const THEME_MODE_STORAGE_KEY = "themeMode";

const getSystemMode = (): ThemeMode =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

/** Saved choice wins; otherwise follow the OS preference. */
const getInitialMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage unavailable */
  }
  return getSystemMode();
};

const persist = (mode: ThemeMode) => {
  try {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
};

interface ThemeModeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const useThemeModeStore = create<ThemeModeState>((set, get) => ({
  mode: getInitialMode(),
  setMode: (mode) => {
    persist(mode);
    set({ mode });
  },
  toggleMode: () => get().setMode(get().mode === "dark" ? "light" : "dark"),
}));
