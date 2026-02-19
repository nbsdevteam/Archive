import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "light" | "outline";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
  children: ReactNode;
}

/**
 * Button - Shared generic button with consistent height for toolbar alignment.
 * Extends native button props; passes through ...rest (e.g. aria-label, ref).
 * When using only an icon with no visible text, pass aria-label so screen readers and read-aloud tools announce the action.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    type = "button",
    isLoading = false,
    children,
    className = "",
    disabled,
    ...props
  },
  ref
) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== "md" ? `btn-${size}` : "";
  const heightClass =
    size === "sm"
      ? "control-height-sm"
      : size === "lg"
        ? "control-height-lg"
        : "control-height-md";
  const classes = `btn ${variantClass} ${sizeClass} ${heightClass} ${className}`.trim();

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled ?? isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
});
