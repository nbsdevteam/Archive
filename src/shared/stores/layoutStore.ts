import { create } from "zustand";

export type AppLayout = "default" | "modern";

const LAYOUT_STORAGE_KEY = "dataLayout";

const getInitialLayout = (): AppLayout => {
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
  return saved === "modern" ? "modern" : "default";
};

const applyLayout = (layout: AppLayout) => {
  document.documentElement.setAttribute("data-layout", layout);
};

const initialLayout = getInitialLayout();
applyLayout(initialLayout);

type LayoutStore = {
  layout: AppLayout;
  setLayout: (layout: AppLayout) => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  layout: initialLayout,
  setLayout: (layout) => {
    const next = layout === "modern" ? "modern" : "default";
    localStorage.setItem(LAYOUT_STORAGE_KEY, next);
    applyLayout(next);
    set({ layout: next });
  },
}));
