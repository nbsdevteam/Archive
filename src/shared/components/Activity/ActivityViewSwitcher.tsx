import { memo, useCallback } from "react";
import type { ActivityViewMode } from "./types";

export interface ActivityViewSwitcherTranslator {
  (key: string, options?: { defaultValue?: string; [key: string]: unknown }): string;
}

interface ActivityViewSwitcherProps {
  t: ActivityViewSwitcherTranslator;
  value: ActivityViewMode;
  onChange: (next: ActivityViewMode) => void;
}

/** Segmented control to switch between timeline and tree views. */
const ActivityViewSwitcherComponent = ({ t, value, onChange }: ActivityViewSwitcherProps) => {
  const handleTimelineClick = useCallback(() => onChange("timeline"), [onChange]);
  const handleTreeClick = useCallback(() => onChange("tree"), [onChange]);

  return (
    <div className="btn-group btn-group-sm" role="group" aria-label={t("activity.viewMode", { defaultValue: "View mode" })}>
      <button
        type="button"
        className={`btn ${value === "timeline" ? "btn-secondary" : "btn-outline-secondary"}`}
        onClick={handleTimelineClick}
      >
        {t("activity.view.timeline", { defaultValue: "Timeline" })}
      </button>
      <button
        type="button"
        className={`btn ${value === "tree" ? "btn-secondary" : "btn-outline-secondary"}`}
        onClick={handleTreeClick}
      >
        {t("activity.view.tree", { defaultValue: "Tree" })}
      </button>
    </div>
  );
};

const arePropsEqual = (prev: ActivityViewSwitcherProps, next: ActivityViewSwitcherProps) =>
  prev.t === next.t && prev.value === next.value && prev.onChange === next.onChange;

const ActivityViewSwitcher = memo(ActivityViewSwitcherComponent, arePropsEqual);
export default ActivityViewSwitcher;
