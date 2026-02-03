import { type ReactNode } from "react";
import { Card as NbsCard } from "@nbs/component-library";

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerActions?: ReactNode;
  glassEffect?: boolean;
  bordered?: boolean;
  footer?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  shadow?: boolean;
  glassVariant?: "shine" | "perfume";
  glassRandomHue?: boolean;
 }

export const Card = ({
  children,
  title,
  className = "",
  headerActions,
  glassEffect = false,
  bordered = true,
  footer,
  imageSrc,
  imageAlt,
  shadow = true,
  glassVariant = "shine",
  glassRandomHue = false,
 }: CardProps) => {
  
  const header =
    title || headerActions ? (
      <div className="d-flex align-items-center justify-content-between">
        {title && <h5 className="mb-0">{title}</h5>}
        {headerActions && <div>{headerActions}</div>}
      </div>
    ) : undefined;

  return (
    <NbsCard  className={className} header={header} glassEffect={glassEffect}>
      {children}
    </NbsCard>
  );
};
