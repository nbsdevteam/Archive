/**
 * Types for ListFilter and date range. Kept in a separate file so the main ui barrel
 * can re-export them without pulling in ListFilter.tsx (and thus datepicker-vendor).
 */

export interface ListFilterFilterConfig {
  label: string;
  value: number | string | null;
  options: Array<{ value: number | string; label: string }>;
  onChange: (value: number | string | null) => void;
}

/** Mode for date range filter: after = from_date only, upto = to_date only, between = both. */
export type DateRangeMode = "after" | "upto" | "between";

export interface ListFilterDateRangeConfig {
  label: string;
  mode: DateRangeMode;
  fromDate: Date | null;
  toDate: Date | null;
  onModeChange: (mode: DateRangeMode) => void;
  onDatesChange: (args: { fromDate: Date | null; toDate: Date | null }) => void;
  onCancel?: () => void;
  cancelLabel?: string;
}

export interface ListFilterProps {
  isOpen: boolean;
  onClose: () => void;
  primaryFilter?: ListFilterFilterConfig;
  secondaryFilter?: ListFilterFilterConfig;
  tertiaryFilter?: ListFilterFilterConfig;
  dateRange?: ListFilterDateRangeConfig;
  onApply: () => void;
  onClear?: () => void;
  applyDisabled?: boolean;
  disabled?: boolean;
  applyLabel?: string;
  clearLabel?: string;
  closeAriaLabel?: string;
  ariaLabel?: string;
}
