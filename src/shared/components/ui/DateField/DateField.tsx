import { useId } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

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
 * Native date input (yyyy-mm-dd) wired through react-hook-form; matches Input layout and control heights.
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
          return (
            <input
              id={id}
              type="date"
              className={`form-control ${heightClass} ${error ? "is-invalid" : ""}`.trim()}
              value={str}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              ref={field.ref}
              disabled={disabled}
              autoComplete="off"
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
