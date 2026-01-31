import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const ThemeInitializer: React.FC = () => {
  const dataTheme = useSelector((state: any) => state.themeSetting.dataTheme);
  const dataLayout = useSelector((state: any) => state.themeSetting.dataLayout);
  const dataWidth = useSelector((state: any) => state.themeSetting.dataWidth);
  const dataCard = useSelector((state: any) => state.themeSetting.dataCard);
  const dataSidebar = useSelector((state: any) => state.themeSetting.dataSidebar);
  const dataTopBar = useSelector((state: any) => state.themeSetting.dataTopBar);
  const dataTopBarColor = useSelector((state: any) => state.themeSetting.dataTopBarColor);
  const dataColor = useSelector((state: any) => state.themeSetting.dataColor);
  const dataLoader = useSelector((state: any) => state.themeSetting.dataLoader);
  const dataSidebarBg = useSelector((state: any) => state.themeSetting.dataSidebarBg);
  const dataTopbarBg = useSelector((state: any) => state.themeSetting.dataTopbarBg);

  useEffect(() => {
    // Initialize all theme attributes on app start
    const themeValue = dataTheme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", themeValue);
    document.documentElement.setAttribute("data-layout", dataLayout);
    document.documentElement.setAttribute("data-width", dataWidth);
    document.documentElement.setAttribute("data-card", dataCard);
    document.documentElement.setAttribute("data-sidebar", dataSidebar);
    document.documentElement.setAttribute("data-topbar", dataTopBar);
    document.documentElement.setAttribute("data-topbarcolor", dataTopBarColor);
    document.documentElement.setAttribute("data-color", dataColor);
    document.documentElement.setAttribute("data-loader", dataLoader);
    
    if (dataSidebarBg) {
      document.body.setAttribute("data-sidebarbg", dataSidebarBg);
    }
    if (dataTopbarBg) {
      document.body.setAttribute("data-topbarbg", dataTopbarBg);
    }
  }, []); // Only run once on mount

  return null; // This component doesn't render anything
};

export default ThemeInitializer; 