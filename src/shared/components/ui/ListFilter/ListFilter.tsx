import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import Select, { type SingleValue } from "react-select";
import { Button } from "../Button";
import { Icon } from "../Icon";
import type { SelectOption } from "../Select";
import styles from "./ListFilter.module.css";

export interface ListFilterFilterConfig {
  label: string;
  value: number | string | null;
  options: Array<{ value: number | string; label: string }>;
  onChange: (value: number | string | null) => void;
}

export interface ListFilterProps {
  isOpen: boolean;
  onClose: () => void;
  primaryFilter: ListFilterFilterConfig;
  secondaryFilter: ListFilterFilterConfig;
  /** Optional third filter row (e.g. Company/Brand). */
  tertiaryFilter?: ListFilterFilterConfig;
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

export function ListFilter({
  isOpen,
  onClose,
  primaryFilter,
  secondaryFilter,
  tertiaryFilter,
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
  const resolvedApplyLabel = applyLabel ?? t("common.apply", { defaultValue: "Apply" });
  const resolvedClearLabel = clearLabel ?? t("common.clear", { defaultValue: "Clear" });
  const resolvedCloseAriaLabel = closeAriaLabel ?? t("common.close", { defaultValue: "Close filter" });
  const resolvedAriaLabel = ariaLabel ?? t("documents.filterOptions", { defaultValue: "Filter options" });
  const selectPlaceholder = t("app.selectPlaceholder", { defaultValue: "Select..." });

  const handleApply = useCallback(() => {
    onApply();
    onClose();
  }, [onApply, onClose]);

  const handleClear = useCallback(() => {
    onClear?.();
    onClose();
  }, [onClear, onClose]);

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  /* Do not close on Escape or click outside; only close via cross, Clear, or Apply */
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const primaryIsString = isStringOption(primaryFilter.options);
  const secondaryIsString = isStringOption(secondaryFilter.options);
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
    primaryFilter.value !== null && primaryFilter.value !== undefined && primaryFilter.value !== ""
      ? primaryFilter.options.find((o) => o.value === primaryFilter.value) ?? null
      : null;
  const secondaryOption =
    secondaryFilter.value !== null && secondaryFilter.value !== undefined && secondaryFilter.value !== ""
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
      </div>
      <div className={styles.actions}>
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
    </>
  );
}
