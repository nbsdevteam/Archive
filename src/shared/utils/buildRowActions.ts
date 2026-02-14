import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import type { RowAction, ButtonVariant } from "../components/ui/DataTable/DataTable.types";
import type { IconName } from "../components/ui/Icon";

/** Config for one row action when building via buildRowActions. */
export interface RowActionConfig<T> {
  id: string;
  /** i18n key for label (e.g. "common.view"). */
  labelKey: string;
  /** Default label when key is missing. */
  defaultValue: string;
  icon?: IconName;
  variant?: ButtonVariant;
  className?: string;
  /** When false, action is hidden for that row. */
  visible?: (row: T) => boolean;
  /** When true for a row, the action button is disabled (e.g. while loading). */
  disabled?: (row: T) => boolean;
  /** Optional per-row label (e.g. show spinner + text while loading). */
  renderLabel?: (row: T) => ReactNode;
  /** Handler; event stopPropagation is applied by the builder. */
  onClick: (row: T) => void;
}

/**
 * Builds DataTable rowActions with consistent stopPropagation, icon typing, and i18n labels.
 * Use this to avoid repeating e.stopPropagation() and label/icon config across table pages.
 * Supports optional disabled and renderLabel for loading states.
 */
export function buildRowActions<T>(
  t: TFunction,
  configs: RowActionConfig<T>[]
): RowAction<T>[] {
  return configs.map(
    ({ id, labelKey, defaultValue, icon, variant, className, visible, disabled, renderLabel, onClick }) => ({
      id,
      label: t(labelKey, { defaultValue }),
      icon,
      variant,
      className,
      visible,
      disabled,
      renderLabel,
      onClick: (row: T, e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(row);
      },
    })
  );
}
