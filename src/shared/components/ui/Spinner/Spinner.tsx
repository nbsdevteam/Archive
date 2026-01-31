import { type CSSProperties } from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: CSSProperties;
}

/**
 * Spinner - Loading indicator component
 */
export const Spinner = ({
  size = "md",
  className = "",
  style,
}: SpinnerProps) => {
  const sizeClasses = {
    sm: "spinner-border-sm",
    md: "",
    lg: "spinner-border-lg",
  };

  return (
    <div
      className={`spinner-border text-primary ${sizeClasses[size]} ${className}`}
      role="status"
      style={style}
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  );
};
