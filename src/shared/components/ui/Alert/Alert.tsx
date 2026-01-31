import { type ReactNode } from "react";

interface AlertProps {
  variant?: "success" | "danger" | "warning" | "info";
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * Alert - Alert/notification component
 */
export const Alert = ({
  variant = "info",
  children,
  onClose,
  className = "",
}: AlertProps) => {
  const variantClass = `alert-${variant}`;
  const classes = `alert ${variantClass} ${className}`.trim();

  return (
    <div className={classes} role="alert">
      {children}
      {onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        />
      )}
    </div>
  );
};
