import { create } from "zustand";

export type ThemeColor =
  | "creamy"
  | "primary"
  | "brightblue"
  | "lunargreen"
  | "lavendar"
  | "magenta"
  | "chromeyellow"
  | "lavared"
  | "all";

const COLOR_STORAGE_KEY = "dataColor";
const COLOR_ALL_STORAGE_KEY = "dataColorAll";

const getInitialColor = (): ThemeColor => {
  const saved = localStorage.getItem(COLOR_STORAGE_KEY);
  if (
    saved === "creamy" ||
    saved === "primary" ||
    saved === "brightblue" ||
    saved === "lunargreen" ||
    saved === "lavendar" ||
    saved === "magenta" ||
    saved === "chromeyellow" ||
    saved === "lavared" ||
    saved === "all"
  ) {
    return saved;
  }
  return "creamy";
};

const getInitialCustomColor = (): string => {
  return localStorage.getItem(COLOR_ALL_STORAGE_KEY) || "";
};

const THEME_RGB_MAP: Record<ThemeColor, string> = {
  creamy: "201, 168, 108",
  primary: "242, 101, 34",
  brightblue: "70, 128, 255",
  lunargreen: "54, 94, 50",
  lavendar: "103, 58, 183",
  magenta: "232, 62, 140",
  chromeyellow: "255, 155, 4",
  lavared: "220, 38, 38",
  all: "",
};

const applyThemeColor = (color: ThemeColor, customColor: string) => {
  document.documentElement.setAttribute("data-color", color);
  const rgbValue =
    color === "all" && customColor ? customColor : THEME_RGB_MAP[color];
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
