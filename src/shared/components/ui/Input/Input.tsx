import { type InputHTMLAttributes, forwardRef } from "react";

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
 * Input - Reusable input component; height matches Button for toolbar alignment.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, size = "md", className = "", ...props }, ref) => {
    const heightClass = heightClassBySize[size];
    const inputClasses = `form-control ${heightClass} ${error ? "is-invalid" : ""} ${className}`.trim();

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
