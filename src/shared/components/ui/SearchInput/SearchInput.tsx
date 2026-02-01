import { memo, useCallback, useEffect, useRef, useState } from "react";
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
      const shouldEmit =
        trimmed.length === 0 || trimmed.length >= minLength;
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

  const wrapperClasses = [
    "search-input",
    wide ? "search-input--wide" : "",
    highlight ? "search-input--highlight" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const inputClasses = `form-control control-height-md search-input__field ${inputClassName}`.trim();

  return (
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
    </div>
  );
};

export const SearchInput = memo(SearchInputInner);
SearchInput.displayName = "SearchInput";
