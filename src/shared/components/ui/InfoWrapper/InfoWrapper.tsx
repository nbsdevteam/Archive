import { useId } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
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

/**
 * Generic info popover with theme-styled content and arrow.
 * Uses react-bootstrap OverlayTrigger + Popover; styling via .info-wrapper-popover in SCSS.
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

  const overlay = (
    <Popover id={id} className={POPOVER_CLASS}>
      <Popover.Body>{content}</Popover.Body>
    </Popover>
  );

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
    <span className={`d-inline-flex align-items-center ${className}`}>
      <OverlayTrigger
        trigger={isClick ? ["click"] : ["hover", "focus"]}
        placement={position}
        overlay={overlay}
        delay={{ show: 200, hide: 100 }}
      >
        <span className="d-inline-flex align-items-center cursor-pointer">
          {triggerElement}
        </span>
      </OverlayTrigger>
    </span>
  );
}

export default InfoWrapper;
