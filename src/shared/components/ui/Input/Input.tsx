import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input - Reusable input component
 * Wraps Bootstrap form controls with consistent API
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    const inputClasses = `form-control ${error ? "is-invalid" : ""} ${className}`.trim();

    return (
      <div className="mb-3">
        {label && (
          <label className="form-label">
            {label}
            {props.required && <span className="text-danger ms-1">*</span>}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <div className="invalid-feedback">{error}</div>}
        {helperText && !error && (
          <div className="form-text">{helperText}</div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
