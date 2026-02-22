import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767.98px)";
const DESKTOP_QUERY = "(min-width: 992px)";

function getMatches(): { mobile: boolean; desktop: boolean } {
  if (typeof window === "undefined" || !window.matchMedia) {
    return { mobile: false, desktop: true };
  }
  return {
    mobile: window.matchMedia(MOBILE_QUERY).matches,
    desktop: window.matchMedia(DESKTOP_QUERY).matches,
  };
}

/**
 * useViewport - track mobile vs desktop breakpoints for layout branching.
 * isMobileView: < 768px; isDesktopView: >= 992px; tablet (768–991) is neither.
 */
export function useViewport(): {
  isMobileView: boolean;
  isDesktopView: boolean;
} {
  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mobileMql = window.matchMedia(MOBILE_QUERY);
    const desktopMql = window.matchMedia(DESKTOP_QUERY);

    const update = () => setMatches(getMatches());

    mobileMql.addEventListener("change", update);
    desktopMql.addEventListener("change", update);
    return () => {
      mobileMql.removeEventListener("change", update);
      desktopMql.removeEventListener("change", update);
    };
  }, []);

  return {
    isMobileView: matches.mobile,
    isDesktopView: matches.desktop,
  };
}
