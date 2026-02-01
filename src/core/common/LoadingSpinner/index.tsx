import React from "react";
import "./LoadingSpinner.scss";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  text?: string;
}

const THEME_CREAMY = "#c9a86c";

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = THEME_CREAMY,
  text,
}) => {
  const containerClass = `loading-spinner-container ${
    size === "small"
      ? "loading-spinner-small"
      : size === "large"
      ? "loading-spinner-large"
      : ""
  }`;

  return (
    <div
      className={containerClass}
      style={{ ["--loading-spinner-color" as string]: color }}
    >
      <div className="loading-spinner" style={{ borderTopColor: color }}>
        <div className="spinner-ring" style={{ borderTopColor: color }}></div>
      </div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};
