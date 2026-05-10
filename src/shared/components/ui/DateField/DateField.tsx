import { useId } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { toCanonicalDdMmYyyy } from "@/shared/utils/documents/documentDate";

const heightClassBySize = {
  sm: "control-height-sm",
  md: "control-height-md",
  lg: "control-height-lg",
} as const;

export interface DateFieldProps<T extends FieldValues, N extends FieldPath<T>> {
  control: Control<T>;
  name: N;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  size?: keyof typeof heightClassBySize;
  /** When true, the outer wrapper has no bottom margin (e.g. inside a grid row that supplies spacing). */
  omitBottomMargin?: boolean;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * Document date as text (dd-mm-yyyy) so day-first typing works; normalizes valid input on blur.
 * Avoids `type="date"` where segment order is locale-dependent and days &gt; 12 are rejected as “month”.
 */
export function DateField<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  label,
  error,
  helperText,
  required,
  size = "md",
  omitBottomMargin = false,
  disabled,
  className = "",
  "data-testid": dataTestId,
}: DateFieldProps<T, N>) {
  const generatedId = useId();
  const id = generatedId;
  const errorId = `${id}-error`;
  const heightClass = heightClassBySize[size];
  const rootClass = `${omitBottomMargin ? "" : "mb-3 "}${className}`.trim();

  return (
    <div className={rootClass || undefined} {...(dataTestId ? { "data-testid": dataTestId } : {})}>
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const str = field.value != null ? String(field.value) : "";
          
          /** Format as user types: auto-insert dashes at positions 2 and 5 (dd-mm-yyyy). */
          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let input = e.target.value;
            // Remove all non-digits
            const digits = input.replace(/\D/g, "");
            
            // Auto-format: add dashes after DD and MM
            let formatted = digits;
            if (digits.length >= 3) {
              formatted = digits.slice(0, 2) + "-" + digits.slice(2);
            }
            if (digits.length >= 5) {
              formatted = digits.slice(0, 2) + "-" + digits.slice(2, 4) + "-" + digits.slice(4, 8);
            }
            
            // Limit to 10 chars (dd-mm-yyyy)
            if (formatted.length > 10) {
              formatted = formatted.slice(0, 10);
            }
            
            field.onChange(formatted);
          };

          /** On blur, validate and pad to dd-mm-yyyy when the string parses. */
          const handleBlur = () => {
            const raw = field.value != null ? String(field.value) : "";
            const trimmed = raw.trim();
            if (!trimmed) {
              field.onChange("");
            } else {
              const canon = toCanonicalDdMmYyyy(trimmed);
              if (canon) field.onChange(canon);
            }
            field.onBlur();
          };

          return (
            <input
              id={id}
              type="text"
              placeholder="dd-mm-yyyy"
              className={`form-control ${heightClass} ${error ? "is-invalid" : ""}`.trim()}
              value={str}
              onChange={handleChange}
              onBlur={handleBlur}
              ref={field.ref}
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
          );
        }}
      />
      {error && (
        <div id={errorId} className="invalid-feedback" role="alert">
          {error}
        </div>
      )}
      {helperText && !error && <div className="form-text">{helperText}</div>}
    </div>
  );
}
