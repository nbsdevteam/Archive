import { useId, useRef, useState, useCallback, useEffect } from "react";
import { Icon } from "../Icon";

export type InfoWrapperPosition = "top" | "bottom" | "left" | "right";
export type InfoWrapperShowOn = "hover" | "click";

export interface InfoWrapperProps {
  /** Content shown inside the popover (e.g. translated string or JSX). */
  content: React.ReactNode;
  /** Placement of popover relative to trigger. Default "bottom". */
  position?: InfoWrapperPosition;
  /** Custom trigger element; if omitted, renders the default info icon. */
  trigger?: React.ReactNode;
  /** Class name applied to the wrapper around the trigger. */
  className?: string;
  /** Class name applied to the trigger element (e.g. text-muted, size). */
  triggerClassName?: string;
  /** Whether to show on hover or click. Default "hover". */
  showOn?: InfoWrapperShowOn;
}

const POPOVER_CLASS = "info-wrapper-popover";

/** Translates position prop to Bootstrap positioning utility classes. */
function getPositionClasses(position: InfoWrapperPosition): string {
  switch (position) {
    case "top":    return "bottom-100 mb-1 start-50 translate-middle-x";
    case "left":   return "end-100 me-1 top-50 translate-middle-y";
    case "right":  return "start-100 ms-1 top-50 translate-middle-y";
    case "bottom":
    default:       return "top-100 mt-1 start-50 translate-middle-x";
  }
}

/**
 * Generic info popover with theme-styled content.
 * Custom implementation — no react-bootstrap dependency.
 * Styling via .info-wrapper-popover in SCSS.
 */
export function InfoWrapper({
  content,
  position = "bottom",
  trigger,
  className = "",
  triggerClassName = "",
  showOn = "hover",
}: InfoWrapperProps) {
  const id = useId().replace(/:/g, "-");
  const isClick = showOn === "click";
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  /** Close popover when user clicks outside the wrapper (click mode only); uses AbortController for single cleanup. */
  useEffect(() => {
    if (!isClick || !visible) return;
    const ac = new AbortController();
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick, { signal: ac.signal });
    return () => ac.abort();
  }, [isClick, visible]);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => setVisible((v) => !v), []);

  const defaultTrigger = (
    <span
      className={`d-inline-flex align-items-center ${triggerClassName}`}
      role="img"
      aria-label={typeof content === "string" ? content : "Information"}
    >
      <Icon name="info" style={{ width: "1rem", height: "1rem" }} />
    </span>
  );

  const triggerElement = trigger ?? defaultTrigger;

  return (
    <span
      ref={wrapperRef}
      className={`d-inline-flex align-items-center position-relative ${className}`}
      onMouseEnter={!isClick ? show : undefined}
      onMouseLeave={!isClick ? hide : undefined}
    >
      <span
        className="d-inline-flex align-items-center cursor-pointer"
        onClick={isClick ? toggle : undefined}
        aria-expanded={isClick ? visible : undefined}
        aria-controls={isClick ? id : undefined}
      >
        {triggerElement}
      </span>
      {visible && (
        <div
          id={id}
          role="tooltip"
          className={`${POPOVER_CLASS} position-absolute ${getPositionClasses(position)}`}
          style={{ zIndex: 1070, whiteSpace: "nowrap" }}
        >
          {content}
        </div>
      )}
    </span>
  );
}

export default InfoWrapper;
