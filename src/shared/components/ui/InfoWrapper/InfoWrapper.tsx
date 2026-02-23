import { useId, useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
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
   * @deprecated No-op — all tooltips now always use portal + fixed positioning
   * so they are never clipped by overflow:hidden parents. Kept for API compatibility.
   */
  portal?: boolean;
}

const POPOVER_CLASS = "info-wrapper-popover";
/** Minimum gap (px) between tooltip edge and viewport edge. */
const VIEWPORT_MARGIN = 8;

/**
 * Computes the raw anchor point in viewport (fixed) coordinates.
 * The anchor is the reference point the tooltip will be placed relative to
 * before the final viewport-clamping step.
 */
function calcAnchor(rect: DOMRect, position: InfoWrapperPosition): { top: number; left: number } {
  switch (position) {
    case "top":    return { top: rect.top - 8,               left: rect.left + rect.width / 2 };
    case "left":   return { top: rect.top + rect.height / 2, left: rect.left - 8 };
    case "right":  return { top: rect.top + rect.height / 2, left: rect.right + 8 };
    case "bottom":
    default:       return { top: rect.bottom + 8,            left: rect.left + rect.width / 2 };
  }
}

/**
 * Converts the anchor + measured tooltip dimensions into a clamped top-left corner
 * that keeps the tooltip fully inside the visible viewport.
 *
 * Anchor semantics per position:
 *   bottom → anchor.left is horizontal midpoint; anchor.top is the top edge of the tooltip
 *   top    → anchor.left is horizontal midpoint; anchor.top is the bottom edge of the tooltip
 *   left   → anchor.top is vertical midpoint;   anchor.left is the right edge of the tooltip
 *   right  → anchor.top is vertical midpoint;   anchor.left is the left edge of the tooltip
 */
function clampToViewport(
  anchor: { top: number; left: number },
  width: number,
  height: number,
  position: InfoWrapperPosition,
): { top: number; left: number } {
  let top: number, left: number;

  switch (position) {
    case "top":
      top  = anchor.top - height;
      left = anchor.left - width / 2;
      break;
    case "left":
      top  = anchor.top - height / 2;
      left = anchor.left - width;
      break;
    case "right":
      top  = anchor.top - height / 2;
      left = anchor.left;
      break;
    case "bottom":
    default:
      top  = anchor.top;
      left = anchor.left - width / 2;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - width - VIEWPORT_MARGIN));
  top  = Math.max(VIEWPORT_MARGIN, Math.min(top,  vh - height - VIEWPORT_MARGIN));
  return { top, left };
}

/**
 * Generic info icon with a viewport-aware fixed-position tooltip.
 *
 * Always rendered via createPortal onto document.body so it is never clipped
 * by overflow:hidden/scroll parents (e.g. sidebars, modals, table cells).
 *
 * Uses a two-phase render to guarantee correct clamping:
 *   Phase 1 — tooltip is painted with visibility:hidden at the raw anchor position.
 *   Phase 2 — useLayoutEffect measures the rendered box, computes the clamped
 *             position, then flips visibility:visible.
 */
export function InfoWrapper({
  content,
  position = "bottom",
  trigger,
  className = "",
  triggerClassName = "",
  showOn = "hover",
  disabled = false,
  portal: _portal, // kept for API compat, intentionally unused
}: InfoWrapperProps) {
  const id = useId().replace(/:/g, "-");
  const isClick = showOn === "click";
  const [visible, setVisible] = useState(false);
  const wrapperRef  = useRef<HTMLSpanElement>(null);
  const tooltipRef  = useRef<HTMLDivElement>(null);

  /** Raw anchor in viewport coords — set the moment the tooltip becomes visible. */
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  /** Clamped final position — null until Phase 2 measurement completes. */
  const [finalPos, setFinalPos] = useState<{ top: number; left: number } | null>(null);

  /** Click-outside dismissal (click mode only). */
  useEffect(() => {
    if (!isClick || !visible) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [isClick, visible]);

  /**
   * Phase 2: runs synchronously after the DOM paints the hidden tooltip.
   * Measures its bounding box and stores the viewport-clamped position,
   * which causes a second paint where the tooltip becomes visible.
   */
  useLayoutEffect(() => {
    if (!visible || !anchor || !tooltipRef.current) {
      setFinalPos(null);
      return;
    }
    const { width, height } = tooltipRef.current.getBoundingClientRect();
    setFinalPos(clampToViewport(anchor, width, height, position));
  }, [visible, anchor, position]);

  /** Snapshot the trigger's viewport rect and store it as the anchor. */
  const calculateAnchor = useCallback(() => {
    if (!wrapperRef.current) return;
    setAnchor(calcAnchor(wrapperRef.current.getBoundingClientRect(), position));
  }, [position]);

  const show = useCallback(() => {
    if (disabled) return;
    calculateAnchor();
    setVisible(true);
  }, [disabled, calculateAnchor]);

  const hide = useCallback(() => {
    setVisible(false);
    setFinalPos(null);
    setAnchor(null);
  }, []);

  const toggle = useCallback(() => {
    if (disabled) return;
    if (visible) { hide(); } else { calculateAnchor(); setVisible(true); }
  }, [disabled, visible, hide, calculateAnchor]);

  const defaultTrigger = (
    <span
      className={`d-inline-flex align-items-center ${triggerClassName}`}
      role="img"
      aria-label={typeof content === "string" ? content : "Information"}
    >
      <Icon name="info" style={{ width: "1rem", height: "1rem" }} />
    </span>
  );

  const tooltipEl = visible ? (
    <div
      ref={tooltipRef}
      id={id}
      role="tooltip"
      className={POPOVER_CLASS}
      style={{
        position: "fixed",
        /* Phase 1: use raw anchor so the element is in roughly the right area while hidden. */
        top:  finalPos?.top  ?? anchor?.top  ?? 0,
        left: finalPos?.left ?? anchor?.left ?? 0,
        zIndex: 1070,
        /* Hidden until Phase 2 measurement completes — prevents flicker of mis-positioned tooltip. */
        visibility: finalPos ? "visible" : "hidden",
      }}
    >
      {/* popover-body ensures nested SCSS styles (padding, color) apply */}
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
        {trigger ?? defaultTrigger}
      </span>
      {createPortal(tooltipEl, document.body)}
    </span>
  );
}

export default InfoWrapper;
