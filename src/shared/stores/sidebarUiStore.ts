import { create } from "zustand";

type SidebarUiStore = {
  mobileSidebar: boolean;
  miniSidebar: boolean;
  headerCollapse: boolean;
  expandMenu: boolean;
  setMobileSidebar: (value: boolean) => void;
  toggleMiniSidebar: () => void;
  setHeaderCollapse: (value: boolean) => void;
  setExpandMenu: (value: boolean) => void;
  resetMobileSidebar: () => void;
};

export const useSidebarUiStore = create<SidebarUiStore>((set) => ({
  mobileSidebar: false,
  miniSidebar: false,
  headerCollapse: false,
  expandMenu: false,
  setMobileSidebar: (value) => set({ mobileSidebar: value }),
  toggleMiniSidebar: () => set((state) => ({ miniSidebar: !state.miniSidebar })),
  setHeaderCollapse: (value) => set({ headerCollapse: value }),
  setExpandMenu: (value) => set({ expandMenu: value }),
  resetMobileSidebar: () => set({ mobileSidebar: false }),
}));
