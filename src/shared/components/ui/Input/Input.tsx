import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
}

const heightClassBySize = {
  sm: "control-height-sm",
  md: "control-height-md",
  lg: "control-height-lg",
} as const;

/**
 * Input - Reusable input with optional label, error, and helper text.
 * Associates label via id/htmlFor and exposes aria-invalid and aria-describedby for errors.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, size = "md", className = "", id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const heightClass = heightClassBySize[size];
    const inputClasses = `form-control ${heightClass} ${error ? "is-invalid" : ""} ${className}`.trim();

    return (
      <div className="mb-3">
        {label && (
          <label className="form-label" htmlFor={id}>
            {label}
            {props.required && <span className="text-danger ms-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={inputClasses}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <div id={errorId} className="invalid-feedback" role="alert">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div className="form-text">{helperText}</div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
