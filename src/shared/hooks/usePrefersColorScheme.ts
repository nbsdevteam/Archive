import { useEffect, useState } from "react";

type ColorScheme = "light" | "dark";

const prefersDarkQuery = "(prefers-color-scheme: dark)";

const getPrefersDark = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(prefersDarkQuery).matches;
};

/**
 * usePrefersColorScheme - track system color scheme preference
 */
export const usePrefersColorScheme = (): {
  prefersDark: boolean;
  scheme: ColorScheme;
} => {
  const [prefersDark, setPrefersDark] = useState<boolean>(getPrefersDark());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia(prefersDarkQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    setPrefersDark(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", handleChange);
    } else {
      mediaQueryList.addListener(handleChange);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, []);

  return { prefersDark, scheme: prefersDark ? "dark" : "light" };
};
