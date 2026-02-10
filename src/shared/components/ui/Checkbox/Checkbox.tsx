import { memo, useCallback, type ChangeEvent, type InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "size"> {
  label: string;
  description?: string;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Checkbox - shared checkbox with consistent label/description rendering.
 */
const CheckboxComponent = ({
  id,
  label,
  description,
  checked,
  disabled,
  className = "",
  onChange,
  ...props
}: CheckboxProps) => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.checked, event);
    },
    [onChange]
  );

  return (
    <div className={`form-check ${className}`.trim()}>
      <input
        id={id}
        type="checkbox"
        className="form-check-input"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
      {description && <div className="form-text mt-0">{description}</div>}
    </div>
  );
};

const arePropsEqual = (prev: CheckboxProps, next: CheckboxProps) => {
  return (
    prev.id === next.id &&
    prev.label === next.label &&
    prev.description === next.description &&
    prev.checked === next.checked &&
    prev.disabled === next.disabled &&
    prev.className === next.className &&
    prev.onChange === next.onChange
  );
};

export const Checkbox = memo(CheckboxComponent, arePropsEqual);

