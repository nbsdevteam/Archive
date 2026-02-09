/**
 * Single source of truth for theme-related design tokens.
 * themeColorStore reads from here to set --primary-rgb and --primary-rgb-picr on document.documentElement.
 * Use these values in SCSS/CSS via var(--primary-rgb); do not hardcode primary colors in the store or components.
 */

export type ThemeColorId =
  | "creamy"
  | "primary"
  | "brightblue"
  | "lunargreen"
  | "lavendar"
  | "magenta"
  | "chromeyellow"
  | "lavared"
  | "all";

/** RGB triplets as "r, g, b" for use in rgba(var(--primary-rgb), opacity). Empty string for "all" (custom color). */
export const THEME_PRIMARY_RGB: Record<ThemeColorId, string> = {
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

/** Default theme when none is saved (creamy). */
export const DEFAULT_THEME_COLOR: ThemeColorId = "creamy";

/**
 * Dark-mode inner profile background (sidebar .user-profile) per theme.
 * Set as --app-profile-inner-bg so the inner card is theme-dependent, not hardcoded.
 */
export const THEME_PROFILE_INNER_BG: Record<ThemeColorId, string> = {
  creamy: "#2c2419",
  primary: "#2c1a0f",
  brightblue: "#1b2844",
  lunargreen: "#1a2819",
  lavendar: "#1e1a2c",
  magenta: "#2c1a24",
  chromeyellow: "#2c2410",
  lavared: "#2c1515",
  all: "#171724",
};

/**
 * Opacity values for theme-tinted backgrounds (used in tables, sidebar, content, etc.).
 * Use in CSS as rgba(var(--primary-rgb), <value>).
 */
export const THEME_OPACITY = {
  /** Light mode: striped row, subtle tint */
  tableStriped: 0.06,
  /** Light mode: hover row, content background tint */
  tableHover: 0.12,
  /** Light mode: very subtle (e.g. content area) */
  contentSubtle: 0.04,
  /** Dark mode: striped row */
  tableStripedDark: 0.12,
  /** Dark mode: hover row */
  tableHoverDark: 0.2,
  /** Transparent primary backgrounds (badges, sidebar active) */
  primaryTransparent: 0.12,
  /** Border / divider tint */
  border: 0.2,
  /** Placeholder text */
  placeholder: 0.6,
} as const;
