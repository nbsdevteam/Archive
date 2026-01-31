import { type ReactNode } from "react";

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export const ModalFooter = ({ children, className = "" }: ModalFooterProps) => {
  return <div className={`modal-footer ${className}`}>{children}</div>;
};
