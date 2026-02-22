import { useId, useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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
  /** When true the tooltip never shows, regardless of hover/click. */
  disabled?: boolean;
  /**
   * When true the tooltip is rendered via ReactDOM.createPortal onto document.body
   * with fixed positioning. Use inside overflow:hidden containers so the tooltip
   * is never clipped by a parent.
   */
  portal?: boolean;
}

const POPOVER_CLASS = "info-wrapper-popover";

/** Translates position prop to Bootstrap positioning utility classes (non-portal mode). */
function getPositionClasses(position: InfoWrapperPosition): string {
  switch (position) {
    case "top":    return "bottom-100 mb-1 start-50 translate-middle-x";
    case "left":   return "end-100 me-1 top-50 translate-middle-y";
    case "right":  return "start-100 ms-1 top-50 translate-middle-y";
    case "bottom":
    default:       return "top-100 mt-1 start-50 translate-middle-x";
  }
}

/** CSS transform used in portal (fixed) mode to centre the tooltip on the anchor point. */
function getPortalTransform(position: InfoWrapperPosition): string {
  switch (position) {
    case "top":    return "translate(-50%, -100%)";
    case "left":   return "translate(-100%, -50%)";
    case "right":  return "translate(0, -50%)";
    case "bottom":
    default:       return "translate(-50%, 0)";
  }
}

/**
 * Generic info popover with theme-styled content.
 * Custom implementation — no react-bootstrap dependency.
 * Styling via .info-wrapper-popover in SCSS.
 * Supports `portal` mode (createPortal to document.body) for use inside overflow:hidden containers.
 */
export function InfoWrapper({
  content,
  position = "bottom",
  trigger,
  className = "",
  triggerClassName = "",
  showOn = "hover",
  disabled = false,
  portal = false,
}: InfoWrapperProps) {
  const id = useId().replace(/:/g, "-");
  const isClick = showOn === "click";
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  /** Fixed-position coordinates used when portal=true. */
  const [portalPos, setPortalPos] = useState<{ top: number; left: number } | null>(null);

  /** Close popover when user clicks outside the wrapper (click mode only). */
  useEffect(() => {
    if (!isClick || !visible) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isClick, visible]);

  /** Calculate the fixed viewport position of the tooltip anchor (portal mode only). */
  const calculatePortalPos = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    let top: number, left: number;
    switch (position) {
      case "top":
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
        break;
      case "bottom":
      default:
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
    }
    setPortalPos({ top, left });
  }, [position]);

  const show = useCallback(() => {
    if (disabled) return;
    if (portal) calculatePortalPos();
    setVisible(true);
  }, [disabled, portal, calculatePortalPos]);

  const hide = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => {
    if (disabled) return;
    if (portal) calculatePortalPos();
    setVisible((v) => !v);
  }, [disabled, portal, calculatePortalPos]);

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

  const tooltipEl = visible ? (
    <div
      id={id}
      role="tooltip"
      className={`${POPOVER_CLASS}${portal ? "" : ` position-absolute ${getPositionClasses(position)}`}`}
      style={
        portal && portalPos
          ? {
              position: "fixed",
              top: portalPos.top,
              left: portalPos.left,
              transform: getPortalTransform(position),
              zIndex: 1070,
              whiteSpace: "nowrap",
            }
          : { zIndex: 1070, whiteSpace: "nowrap" }
      }
    >
      {/* popover-body wrapper ensures the SCSS nested .popover-body styles (padding, color) apply */}
      <div className="popover-body">{content}</div>
    </div>
  ) : null;

  return (
    <span
      ref={wrapperRef}
      className={`d-inline-flex align-items-center position-relative ${className}`}
      onMouseEnter={!isClick && !disabled ? show : undefined}
      onMouseLeave={!isClick && !disabled ? hide : undefined}
    >
      <span
        className="d-inline-flex align-items-center cursor-pointer"
        onClick={isClick && !disabled ? toggle : undefined}
        aria-expanded={isClick ? visible : undefined}
        aria-controls={isClick ? id : undefined}
      >
        {triggerElement}
      </span>
      {portal ? createPortal(tooltipEl, document.body) : tooltipEl}
    </span>
  );
}

export default InfoWrapper;
