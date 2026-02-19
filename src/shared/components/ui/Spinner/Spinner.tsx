import { type CSSProperties } from "react";
import { Loader } from "lucide-react";
import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: CSSProperties;
}

/** Size in px for Lucide Loader so all loading states match (no Bootstrap blue circle). */
const SIZE_MAP = { sm: 20, md: 24, lg: 32 } as const;

/**
 * Spinner - Inline loading indicator using Lucide Loader and theme color.
 * Matches route LoadingSpinner look (light theme tint) so route and page loading are consistent.
 */
export const Spinner = ({
  size = "md",
  className = "",
  style,
}: SpinnerProps) => {
  return (
    <Loader
      size={SIZE_MAP[size]}
      className={`${styles.loaderIcon} ${className}`.trim()}
      style={style}
      role="status"
      aria-hidden={false}
    />
  );
};
