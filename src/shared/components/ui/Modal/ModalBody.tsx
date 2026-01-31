import { type ReactNode } from "react";

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export const ModalBody = ({ children, className = "" }: ModalBodyProps) => {
  return <div className={`modal-body ${className}`}>{children}</div>;
};
