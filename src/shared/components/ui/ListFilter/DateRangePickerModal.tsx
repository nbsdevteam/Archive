import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import { Button } from "../Button";
import { Icon } from "../Icon";
import type { DateRangeMode } from "./ListFilter";
import styles from "./DateRangePickerModal.module.css";

interface DateRangePickerModalProps {
  /** Current mode from parent draft state (initialises pending mode on mount). */
  mode: DateRangeMode;
  /** Current from-date from parent draft state (initialises pending from-date on mount). */
  fromDate: Date | null;
  /** Current to-date from parent draft state (initialises pending to-date on mount). */
  toDate: Date | null;
  /** Called when user clicks Save; parent should commit these dates to its draft state. */
  onSave: (args: { fromDate: Date | null; toDate: Date | null; mode: DateRangeMode }) => void;
  /** Called when user clicks Cancel, presses Escape, or clicks the overlay. */
  onClose: () => void;
  titleLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
}

/** Custom datepicker header with Lucide chevron navigation. */
function CalendarNav({
  date,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}: {
  date: Date;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
}) {
  const { t } = useTranslation();
  const monthName = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  return (
    <div className={styles.calHeader}>
      <button
        type="button"
        className={styles.calNavBtn}
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        aria-label={t("common.previousMonth", { defaultValue: "Previous month" })}
      >
        <Icon name="chevron-left" style={{ width: "1rem", height: "1rem" }} />
      </button>
      <span className={styles.calMonthYear}>
        {monthName} {year}
      </span>
      <button
        type="button"
        className={styles.calNavBtn}
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        aria-label={t("common.nextMonth", { defaultValue: "Next month" })}
      >
        <Icon name="chevron-right" style={{ width: "1rem", height: "1rem" }} />
      </button>
    </div>
  );
}

/**
 * Portal-based modal for selecting a date range.
 * Maintains its own pending state; only commits to parent on Save.
 * Cancel / Escape / overlay-click discards changes and closes without calling onSave.
 */
export function DateRangePickerModal({
  mode: initialMode,
  fromDate: initialFromDate,
  toDate: initialToDate,
  onSave,
  onClose,
  titleLabel,
  saveLabel,
  cancelLabel,
}: DateRangePickerModalProps) {
  const { t } = useTranslation();

  /* Pending state — initialised from props on mount; only committed on Save */
  const [pendingMode, setPendingMode] = useState<DateRangeMode>(initialMode);
  const [pendingFromDate, setPendingFromDate] = useState<Date | null>(initialFromDate);
  const [pendingToDate, setPendingToDate] = useState<Date | null>(initialToDate);

  /* Close on Escape key */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleModeChange = useCallback((mode: DateRangeMode) => {
    setPendingMode(mode);
  }, []);

  /** Save: commit pending state to parent then close. */
  const handleSave = useCallback(() => {
    onSave({ fromDate: pendingFromDate, toDate: pendingToDate, mode: pendingMode });
    onClose();
  }, [onSave, onClose, pendingFromDate, pendingToDate, pendingMode]);

  /** Overlay click (clicking outside the dialog card) acts as Cancel. */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  /** Stable renderCustomHeader callback for react-datepicker. */
  const renderCustomHeader = useCallback(
    (props: {
      date: Date;
      decreaseMonth: () => void;
      increaseMonth: () => void;
      prevMonthButtonDisabled: boolean;
      nextMonthButtonDisabled: boolean;
    }) => <CalendarNav {...props} />,
    []
  );

  const resolvedTitle = titleLabel ?? t("filter.byDate", { defaultValue: "By Date" });
  const resolvedSave = saveLabel ?? t("common.save", { defaultValue: "Save" });
  const resolvedCancel = cancelLabel ?? t("common.cancel", { defaultValue: "Cancel" });

  const modeLabels: Record<DateRangeMode, string> = {
    after: t("filter.dateMode.after", { defaultValue: "After" }),
    upto: t("filter.dateMode.upto", { defaultValue: "Upto" }),
    between: t("filter.dateMode.between", { defaultValue: "Between" }),
  };

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={resolvedTitle}>
        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{resolvedTitle}</span>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label={resolvedCancel}
          >
            <Icon name="x" style={{ width: "1rem", height: "1rem" }} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.modalBody}>
          {/* Mode segmented control: After / Upto / Between */}
          <div
            className={styles.modeTabs}
            role="group"
            aria-label={t("filter.dateRangeMode", { defaultValue: "Date range mode" })}
          >
            {(["after", "upto", "between"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={pendingMode === m ? styles.modeTabActive : styles.modeTab}
                onClick={() => handleModeChange(m)}
              >
                {modeLabels[m]}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className={styles.calendarWrap}>
            {pendingMode === "between" ? (
              <DatePicker
                selectsRange
                startDate={pendingFromDate}
                endDate={pendingToDate}
                onChange={(dates) => {
                  const [start, end] = dates ?? [null, null];
                  setPendingFromDate(start ?? null);
                  setPendingToDate(end ?? null);
                }}
                shouldCloseOnSelect={false}
                inline
                renderCustomHeader={renderCustomHeader}
                calendarClassName={styles.calendar}
              />
            ) : (
              <DatePicker
                selected={pendingMode === "after" ? pendingFromDate : pendingToDate}
                onChange={(date) => {
                  if (pendingMode === "after") {
                    setPendingFromDate(date ?? null);
                  } else {
                    setPendingToDate(date ?? null);
                  }
                }}
                shouldCloseOnSelect={false}
                inline
                renderCustomHeader={renderCustomHeader}
                calendarClassName={styles.calendar}
              />
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.modalFooter}>
          <Button variant="outline" size="md" className="btn-outline-secondary" onClick={onClose}>
            {resolvedCancel}
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            {resolvedSave}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
