import React from "react";
import { Loader2 } from "lucide-react";
import "./LoadingSpinner.scss";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  text?: string;
}

/**
 * Route/lazy-loading full-screen spinner. Centered horizontally and vertically,
 * uses Loader2 from lucide-react with a light theme-colored icon.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  text,
}) => {
  const containerClass = `loading-spinner-container ${
    size === "small"
      ? "loading-spinner-small"
      : size === "large"
      ? "loading-spinner-large"
      : ""
  }`;

  const iconSize = size === "small" ? 24 : size === "large" ? 48 : 32;

  return (
    <div className={containerClass}>
      <div className="loading-spinner-inner">
        <Loader2
          size={iconSize}
          className="loading-spinner-icon"
          aria-hidden
        />
        {text && <div className="loading-text">{text}</div>}
      </div>
    </div>
  );
};
