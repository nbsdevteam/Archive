import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "../Icon";
import "./search-input.css";

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  onDebouncedChange: (value: string) => void;
  onImmediateChange?: (value: string) => void;
  className?: string;
  inputClassName?: string;
  /** Lucide icon name (kebab-case). Default: "search". Use "folder-search" or "file-search-corner" for context. */
  icon?: IconName;
  /** Give search more width and flex growth so it stands out. */
  wide?: boolean;
  /** Slightly highlighted background so the eye is drawn to it. */
  highlight?: boolean;
  /** Show a clear control when the field has text (works with controlled or uncontrolled value). */
  clearable?: boolean;
  clearAriaLabel?: string;
  /** Optional row below the field (e.g. filtered result counts). */
  footer?: ReactNode;
  /** Classes merged onto the outer wrapper when `footer` is set (e.g. fixed width stack). */
  stackClassName?: string;
  "aria-label"?: string;
}

const SearchInputInner = ({
  value: controlledValue,
  defaultValue = "",
  placeholder = "Search...",
  debounceMs = 300,
  minLength = 1,
  onDebouncedChange,
  onImmediateChange,
  className = "",
  inputClassName = "",
  icon = "search",
  wide = false,
  highlight = false,
  clearable = false,
  clearAriaLabel = "Clear search",
  footer,
  stackClassName = "",
  "aria-label": ariaLabel = "Search",
}: SearchInputProps) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef<string | null>(null);

  const emitDebounced = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      const shouldEmit = trimmed.length === 0 || trimmed.length >= minLength;
      const toEmit = shouldEmit ? trimmed : "";
      if (lastEmittedRef.current === toEmit) return;
      lastEmittedRef.current = toEmit;
      onDebouncedChange(toEmit);
    },
    [minLength, onDebouncedChange]
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      emitDebounced(value);
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, debounceMs, emitDebounced]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (!isControlled) setInternalValue(next);
      onImmediateChange?.(next);
    },
    [isControlled, onImmediateChange]
  );

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue("");
    lastEmittedRef.current = null;
    onImmediateChange?.("");
    onDebouncedChange("");
  }, [isControlled, onImmediateChange, onDebouncedChange]);

  const showClear = clearable && String(value).length > 0;

  const wrapperClasses = [
    "search-input",
    wide ? "search-input--wide" : "",
    highlight ? "search-input--highlight" : "",
    showClear ? "search-input--with-clear" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const inputClasses = `form-control control-height-md search-input__field ${inputClassName}`.trim();

  const field = (
    <div className={wrapperClasses}>
      <span className="search-input__icon" aria-hidden>
        <Icon name={icon} className="flex-shrink-0" style={{ width: "1rem", height: "1rem" }} />
      </span>
      <input
        type="search"
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
      />
      {showClear ? (
        <button
          type="button"
          className="search-input__clear"
          onClick={handleClear}
          aria-label={clearAriaLabel}
        >
          <Icon name="x" style={{ width: "0.85rem", height: "0.85rem" }} />
        </button>
      ) : null}
    </div>
  );

  if (footer == null) {
    return field;
  }

  return (
    <div
      className={["search-input-stack", stackClassName].filter(Boolean).join(" ").trim()}
    >
      {field}
      <div className="search-input__footer">{footer}</div>
    </div>
  );
};

export const SearchInput = memo(SearchInputInner);
SearchInput.displayName = "SearchInput";
