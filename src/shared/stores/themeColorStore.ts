import { create } from "zustand";
import {
  THEME_PRIMARY_RGB,
  DEFAULT_THEME_COLOR,
  type ThemeColorId,
} from "../design-tokens";

export type ThemeColor = ThemeColorId;

const COLOR_STORAGE_KEY = "dataColor";
const COLOR_ALL_STORAGE_KEY = "dataColorAll";

const VALID_THEME_IDS: ThemeColorId[] = [
  "creamy",
  "primary",
  "brightblue",
  "lunargreen",
  "lavendar",
  "magenta",
  "chromeyellow",
  "lavared",
  "all",
];

const getInitialColor = (): ThemeColor => {
  const saved = localStorage.getItem(COLOR_STORAGE_KEY);
  if (saved !== null && VALID_THEME_IDS.includes(saved as ThemeColorId)) {
    return saved as ThemeColor;
  }
  return DEFAULT_THEME_COLOR;
};

const getInitialCustomColor = (): string => {
  return localStorage.getItem(COLOR_ALL_STORAGE_KEY) || "";
};

const applyThemeColor = (color: ThemeColor, customColor: string) => {
  document.documentElement.setAttribute("data-color", color);
  const rgbValue =
    color === "all" && customColor ? customColor : THEME_PRIMARY_RGB[color];
  if (rgbValue) {
    document.documentElement.style.setProperty("--primary-rgb", rgbValue);
    document.documentElement.style.setProperty("--primary-rgb-picr", rgbValue);
  } else {
    document.documentElement.style.removeProperty("--primary-rgb");
    document.documentElement.style.removeProperty("--primary-rgb-picr");
  }
};

const initialColor = getInitialColor();
const initialCustomColor = getInitialCustomColor();
applyThemeColor(initialColor, initialCustomColor);

type ThemeColorStore = {
  color: ThemeColor;
  customColor: string;
  setColor: (color: ThemeColor) => void;
  setCustomColor: (customColor: string) => void;
};

export const useThemeColorStore = create<ThemeColorStore>((set, get) => ({
  color: initialColor,
  customColor: initialCustomColor,
  setColor: (color) => {
    const next = color || "primary";
    localStorage.setItem(COLOR_STORAGE_KEY, next);
    applyThemeColor(next, get().customColor);
    set({ color: next });
  },
  setCustomColor: (customColor) => {
    const value = customColor || "";
    localStorage.setItem(COLOR_ALL_STORAGE_KEY, value);
    const current = get().color;
    applyThemeColor(current, value);
    set({ customColor: value });
  },
}));
