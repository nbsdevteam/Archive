import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Select, { type SingleValue } from "react-select";
import { Button } from "../Button";
import { Icon } from "../Icon";
import type { SelectOption } from "../Select";
import { formatDate } from "@/shared/utils/format/date";
import { DateRangePickerModal } from "./DateRangePickerModal";
import styles from "./ListFilter.module.css";

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
  /** Called when user clicks Cancel; only refetch/clear when date was applied. */
  onCancel?: () => void;
  cancelLabel?: string;
}

export interface ListFilterProps {
  isOpen: boolean;
  onClose: () => void;
  /** When absent (e.g. Trash page), only date range row is shown if dateRange is provided. */
  primaryFilter?: ListFilterFilterConfig;
  secondaryFilter?: ListFilterFilterConfig;
  /** Optional third filter row (e.g. Company/Brand). */
  tertiaryFilter?: ListFilterFilterConfig;
  /** Optional date range row (By Date); when absent, no date row or Cancel is shown. */
  dateRange?: ListFilterDateRangeConfig;
  onApply: () => void;
  onClear?: () => void;
  /** When true, Apply button is disabled (e.g. when draft has no changes from applied). Enable Apply only when user has changed a value. */
  applyDisabled?: boolean;
  disabled?: boolean;
  applyLabel?: string;
  clearLabel?: string;
  closeAriaLabel?: string;
  ariaLabel?: string;
}

function isStringOption(
  options: Array<{ value: number | string; label: string }>
): boolean {
  if (options.length === 0) return false;
  return typeof options[0].value === "string";
}

/** Builds display string for date range: "-" | "after D" | "upto D" | "between D1 - D2". */
function getDateRangeDisplayValue(
  fromDate: Date | null,
  toDate: Date | null,
  t: (key: string, opts?: { defaultValue?: string }) => string
): string {
  const hasFrom = fromDate != null && !isNaN(fromDate.getTime());
  const hasTo = toDate != null && !isNaN(toDate.getTime());
  if (!hasFrom && !hasTo) return "–";
  const afterLabel = t("filter.dateAfter", { defaultValue: "after" });
  const uptoLabel = t("filter.dateUpto", { defaultValue: "upto" });
  const betweenLabel = t("filter.dateBetween", { defaultValue: "between" });
  // UI display format must be DD/MM/YYYY (payload stays YYYY-MM-DD in hooks).
  if (hasFrom && !hasTo) return `${afterLabel} ${formatDate(fromDate, "DD/MM/YYYY")}`;
  if (!hasFrom && hasTo) return `${uptoLabel} ${formatDate(toDate, "DD/MM/YYYY")}`;
  return `${betweenLabel} ${formatDate(fromDate!, "DD/MM/YYYY")} – ${formatDate(toDate!, "DD/MM/YYYY")}`;
}

export function ListFilter({
  isOpen,
  onClose,
  primaryFilter,
  secondaryFilter,
  tertiaryFilter,
  dateRange,
  onApply,
  onClear,
  applyDisabled = true,
  disabled = false,
  applyLabel,
  clearLabel,
  closeAriaLabel,
  ariaLabel,
}: ListFilterProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  /** Controls visibility of the date-range modal (separate from the filter panel). */
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const resolvedApplyLabel = applyLabel ?? t("common.apply", { defaultValue: "Apply" });
  const resolvedClearLabel = clearLabel ?? t("common.clear", { defaultValue: "Clear" });
  const resolvedCloseAriaLabel = closeAriaLabel ?? t("common.close", { defaultValue: "Close filter" });
  const resolvedAriaLabel = ariaLabel ?? t("documents.filterOptions", { defaultValue: "Filter options" });
  const selectPlaceholder = t("app.selectPlaceholder", { defaultValue: "Select..." });
  const resolvedCancelLabel = dateRange?.cancelLabel ?? t("common.cancel", { defaultValue: "Cancel" });

  const handleApply = useCallback(() => {
    onApply();
    onClose();
  }, [onApply, onClose]);

  const handleClear = useCallback(() => {
    onClear?.();
    onClose();
  }, [onClear, onClose]);

  const handleCancel = useCallback(() => {
    dateRange?.onCancel?.();
    onClose();
  }, [dateRange, onClose]);

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  /* Do not close on Escape or click outside; only close via cross, Clear, or Apply */
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const primaryIsString = primaryFilter ? isStringOption(primaryFilter.options) : false;
  const secondaryIsString = secondaryFilter ? isStringOption(secondaryFilter.options) : false;
  const tertiaryIsString = tertiaryFilter ? isStringOption(tertiaryFilter.options) : false;

  const handlePrimarySelectChange = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      const v = newValue?.value;
      primaryFilter.onChange(
        v !== undefined && v !== null
          ? (primaryIsString ? (v as string) : (v as number))
          : null
      );
    },
    [primaryFilter, primaryIsString]
  );

  const handleSecondarySelectChange = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      const v = newValue?.value;
      secondaryFilter.onChange(
        v !== undefined && v !== null
          ? (secondaryIsString ? (v as string) : (v as number))
          : null
      );
    },
    [secondaryFilter, secondaryIsString]
  );

  const handleTertiarySelectChange = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      if (!tertiaryFilter) return;
      const v = newValue?.value;
      tertiaryFilter.onChange(
        v !== undefined && v !== null
          ? (tertiaryIsString ? (v as string) : (v as number))
          : null
      );
    },
    [tertiaryFilter, tertiaryIsString]
  );

  const selectStyles = useCallback(
    (base: object) => ({ ...base, minHeight: "38px" }),
    []
  );

  if (!isOpen) return null;

  const primaryOption =
    primaryFilter &&
    primaryFilter.value !== null &&
    primaryFilter.value !== undefined &&
    primaryFilter.value !== ""
      ? primaryFilter.options.find((o) => o.value === primaryFilter.value) ?? null
      : null;
  const secondaryOption =
    secondaryFilter &&
    secondaryFilter.value !== null &&
    secondaryFilter.value !== undefined &&
    secondaryFilter.value !== ""
      ? secondaryFilter.options.find((o) => o.value === secondaryFilter.value) ?? null
      : null;
  const tertiaryOption =
    tertiaryFilter &&
    tertiaryFilter.value !== null &&
    tertiaryFilter.value !== undefined &&
    tertiaryFilter.value !== ""
      ? tertiaryFilter.options.find((o) => o.value === tertiaryFilter.value) ?? null
      : null;

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={handleOverlayClick}
        onMouseDown={handleOverlayClick}
        aria-hidden
      />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-label={resolvedAriaLabel}
        aria-modal="true"
      >

      <div className={styles.header}>
        <span className={styles.headerTitle}>{resolvedAriaLabel}</span>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleCloseClick}
          aria-label={resolvedCloseAriaLabel}
          disabled={disabled}
        >
          <Icon name="x" style={{ width: "1rem", height: "1rem" }} />
        </button>
      </div>
      <div className={styles.rows}>
        {primaryFilter != null && (
          <div className={styles.row}>
            <span className={styles.label}>{primaryFilter.label}</span>
            <div className={styles.selectWrap}>
              <Select<SelectOption>
                isClearable
                placeholder={selectPlaceholder}
                options={primaryFilter.options}
                value={primaryOption}
                isDisabled={disabled}
                onChange={handlePrimarySelectChange}
                classNamePrefix="react-select"
                styles={{ control: selectStyles }}
              />
            </div>
          </div>
        )}
        {secondaryFilter != null && (
          <div className={styles.row}>
            <span className={styles.label}>{secondaryFilter.label}</span>
            <div className={styles.selectWrap}>
              <Select<SelectOption>
                isClearable
                placeholder={selectPlaceholder}
                options={secondaryFilter.options}
                value={secondaryOption}
                isDisabled={disabled}
                onChange={handleSecondarySelectChange}
                classNamePrefix="react-select"
                styles={{ control: selectStyles }}
              />
            </div>
          </div>
        )}
        {tertiaryFilter != null && (
          <div className={styles.row}>
            <span className={styles.label}>{tertiaryFilter.label}</span>
            <div className={styles.selectWrap}>
              <Select<SelectOption>
                isClearable
                placeholder={selectPlaceholder}
                options={tertiaryFilter.options}
                value={tertiaryOption}
                isDisabled={disabled}
                onChange={handleTertiarySelectChange}
                classNamePrefix="react-select"
                styles={{ control: selectStyles }}
              />
            </div>
          </div>
        )}
        {dateRange != null && (
          <div className={styles.row}>
            <span className={styles.label}>{dateRange.label}</span>
            <div className={styles.dateWrap}>
              {/* Trigger button — clicking opens the date-range modal */}
              <button
                type="button"
                className={styles.dateTrigger}
                onClick={() => setDateModalOpen(true)}
                disabled={disabled}
                aria-haspopup="dialog"
              >
                <Icon name="calendar" style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                <span className={styles.dateTriggerText}>
                  {getDateRangeDisplayValue(dateRange.fromDate, dateRange.toDate, t)}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className={styles.actions}>
        {dateRange?.onCancel != null && (
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary"
            onClick={handleCancel}
            disabled={disabled}
          >
            {resolvedCancelLabel}
          </Button>
        )}
        {onClear != null && (
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary"
            onClick={handleClear}
            disabled={disabled}
          >
            {resolvedClearLabel}
          </Button>
        )}
        <Button
          variant="primary"
          size="md"
          onClick={handleApply}
          disabled={disabled || applyDisabled}
        >
          {resolvedApplyLabel}
        </Button>
      </div>
    </div>
    {/* Date-range modal — rendered via portal to document.body, above filter panel */}
    {dateRange != null && dateModalOpen && (
      <DateRangePickerModal
        mode={dateRange.mode}
        fromDate={dateRange.fromDate}
        toDate={dateRange.toDate}
        onSave={({ fromDate, toDate, mode }) => {
          dateRange.onModeChange(mode);
          dateRange.onDatesChange({ fromDate, toDate });
        }}
        onClose={() => setDateModalOpen(false)}
      />
    )}
    </>
  );
}
