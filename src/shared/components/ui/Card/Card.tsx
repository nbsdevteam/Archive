import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerActions?: ReactNode;
}

/**
 * Card - Reusable card component
 * Wraps Bootstrap card styling
 */
export const Card = ({
  children,
  title,
  className = "",
  headerActions,
}: CardProps) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0">{title}</h5>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};
