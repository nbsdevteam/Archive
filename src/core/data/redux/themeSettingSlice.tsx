import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ThemeSettingState } from "../types";

const initialState: ThemeSettingState = {
  dataLayout: localStorage.getItem("dataLayout") || "default",
  dataWidth: localStorage.getItem("dataWidth") || "fluid",
  dataCard: localStorage.getItem("dataCard") || "bordered",
  dataSidebar: localStorage.getItem("dataSidebar") || "light",
  dataSidebarAll: localStorage.getItem("dataSidebarAll") || "",
  dataTopbarAll: localStorage.getItem("dataTopbarAll") || "",
  dataTopBarColorAll: localStorage.getItem("dataTopBarColorAll") || "",
  dataColorAll: localStorage.getItem("dataColorAll") || "",
  dataTheme: localStorage.getItem("dataTheme") || "light",
  dataTopBar: localStorage.getItem("dataTopBar") || "white",
  dataTopBarColor: localStorage.getItem("dataTopBarColor") || "white",
  dataSidebarBg: localStorage.getItem("dataSidebarBg") || "",
  dataTopbarBg: localStorage.getItem("dataTopbarBg") || "",
  dataColor: localStorage.getItem("dataColor") || "primary",
  dataLoader: localStorage.getItem("dataLoader") || "enable",
  isRtl: localStorage.getItem("rtl") || false,
  headerCollapse: false,
};

const themeSettingSlice = createSlice({
  name: "themeSetting",
  initialState,
  reducers: {
    setHeaderCollapse: (state, action: PayloadAction<boolean>) => {
      state.headerCollapse = action.payload;
    },
    setDataLayout: (state, action: PayloadAction<string>) => {
      state.dataLayout = action.payload;
      localStorage.setItem("dataLayout", action.payload);
      document.documentElement.setAttribute("data-layout", action.payload);
    },
    setDataWidth: (state, action: PayloadAction<string>) => {
      state.dataWidth = action.payload;
      localStorage.setItem("dataWidth", action.payload);
      document.documentElement.setAttribute("data-width", action.payload);
    },
    setDataCard: (state, action: PayloadAction<string>) => {
      state.dataCard = action.payload;
      localStorage.setItem("dataCard", action.payload);
      document.documentElement.setAttribute("data-card", action.payload);
    },
    setDataSidebar: (state, action: PayloadAction<string>) => {
      state.dataSidebar = action.payload;
      localStorage.setItem("dataSidebar", action.payload);
      document.documentElement.setAttribute("data-sidebar", action.payload);
    },
    setDataSidebarAll: (state, action: PayloadAction<string>) => {
      state.dataSidebarAll = action.payload;
      localStorage.setItem("dataSidebarAll", action.payload);
    },
    setDataColorAll: (state, action: PayloadAction<string>) => {
      state.dataColorAll = action.payload;
      localStorage.setItem("dataColorAll", action.payload);
    },
    setDataTopBarColorAll: (state, action: PayloadAction<string>) => {
      state.dataTopBarColorAll = action.payload;
      localStorage.setItem("dataTopBarColorAll", action.payload);
    },
    setDataTopbarAll: (state, action: PayloadAction<string>) => {
      state.dataTopbarAll = action.payload;
      localStorage.setItem("dataTopbarAll", action.payload);
    },
    setDataTheme: (state, action: PayloadAction<string>) => {
      const themeValue = action.payload === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", themeValue);
      state.dataTheme = action.payload;
      localStorage.setItem("dataTheme", action.payload);
    },
    setTopBarColor: (state, action: PayloadAction<string>) => {
      state.dataTopBar = action.payload;
      localStorage.setItem("dataTopBar", action.payload);
      document.documentElement.setAttribute("data-topbar", action.payload);
    },
    setTopBarColor2: (state, action: PayloadAction<string>) => {
      state.dataTopBarColor = action.payload;
      localStorage.setItem("dataTopBarColor", action.payload);
      document.documentElement.setAttribute("data-topbarcolor", action.payload);
    },
    setDataSidebarBg: (state, action: PayloadAction<string>) => {
      state.dataSidebarBg = action.payload;
      localStorage.setItem("dataSidebarBg", action.payload);
      document.body.setAttribute("data-sidebarbg", action.payload);
    },
    setDataTopbarBg: (state, action: PayloadAction<string>) => {
      state.dataTopbarBg = action.payload;
      localStorage.setItem("dataTopbarBg", action.payload);
      document.body.setAttribute("data-topbarbg", action.payload);
    },
    setDataColor: (state, action: PayloadAction<string>) => {
      state.dataColor = action.payload;
      localStorage.setItem("dataColor", action.payload);
      document.documentElement.setAttribute("data-color", action.payload);
    },
    setLoader: (state, action: PayloadAction<string>) => {
      state.dataLoader = action.payload;
      localStorage.setItem("dataLoader", action.payload);
      document.documentElement.setAttribute("data-loader", action.payload);
    },
    setRtl: (state, action: PayloadAction<boolean | string>) => {
      state.isRtl = action.payload;
      localStorage.setItem("rtl", action.payload.toString());
      // Only add/remove the RTL class, don't replace all body classes
      if (action.payload === "layout-mode-rtl") {
        document.body.classList.add("layout-mode-rtl");
      } else {
        document.body.classList.remove("layout-mode-rtl");
      }
    },
    resetAllMode: (state) => {
      state.dataLayout = "default";
      state.dataWidth = "fluid";
      state.dataCard = "bordered";
      state.dataSidebar = "light";
      state.dataTheme = "light";
      state.dataTopBar = "white";
      state.dataTopBarColor = "white";
      state.dataSidebarBg = "";
      state.dataTopbarBg = "";
      state.dataColor = "primary";
      state.dataLoader = "enable";
      state.isRtl = "";
      localStorage.setItem("dataLayout", "default");
      localStorage.setItem("dataWidth", "fluid");
      localStorage.setItem("dataCard", "bordered");
      localStorage.setItem("dataSidebar", "light");
      localStorage.setItem("dataTheme", "light");
      localStorage.setItem("dataTopBar", "white");
      localStorage.setItem("dataTopBarColor", "white");
      localStorage.setItem("dataSidebarBg", "");
      localStorage.setItem("dataTopbarBg", "");
      localStorage.setItem("dataColor", "primary");
      localStorage.setItem("dataLoader", "enable");
      localStorage.setItem("rtl", "");
    },
  },
});

export const {
  setDataLayout,
  setDataWidth,
  setDataCard,
  resetAllMode,
  setTopBarColor,
  setDataTheme,
  setDataSidebar,
  setDataSidebarAll,
  setDataColorAll,
  setDataTopBarColorAll,
  setDataTopbarAll,
  setDataSidebarBg,
  setDataTopbarBg,
  setHeaderCollapse,
  setDataColor,
  setLoader,
  setTopBarColor2,
  setRtl,
} = themeSettingSlice.actions;

export default themeSettingSlice.reducer;
