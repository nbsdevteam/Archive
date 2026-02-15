import { type Control, type FieldPath, type FieldValues, Controller } from "react-hook-form";
import Select, { type SingleValue } from "react-select";

export interface SelectOption<T = number | string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends FieldValues, Name extends FieldPath<T>> {
  control: Control<T>;
  name: Name;
  options: SelectOption[];
  label?: string;
  required?: boolean;
  placeholder?: string;
  isDisabled?: boolean;
  error?: string;
  className?: string;
  /** Optional: use string values (e.g. for folder_type) */
  isStringValue?: boolean;
  /** When true, 0 is a valid selection (e.g. folder "None") */
  allowZero?: boolean;
  /** When false, hides the clear (X) button; use for required single-choice dropdowns. Default true. */
  isClearable?: boolean;
  /** Optional data-testid for E2E testing */
  "data-testid"?: string;
}

/**
 * Single select wired to react-hook-form via Controller.
 * Form value is the primitive (number or string); options are { value, label }.
 */
export function SelectField<T extends FieldValues, Name extends FieldPath<T>>({
  control,
  name,
  options,
  label,
  required,
  placeholder = "Select...",
  isDisabled,
  error,
  className = "",
  isStringValue = false,
  allowZero = false,
  isClearable = true,
  "data-testid": dataTestId,
}: SelectFieldProps<T, Name>) {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const raw = field.value as number | string | undefined;
          const isEmpty = raw === undefined || raw === null || raw === "" || (!allowZero && raw === 0);
          const selectedOption: SelectOption | null = isEmpty
            ? null
            : (options.find((o) => o.value === raw) ?? null);
          return (
            <Select<SelectOption>
              isClearable={isClearable}
              placeholder={placeholder}
              options={options}
              value={selectedOption}
              isDisabled={isDisabled}
              onChange={(newValue: SingleValue<SelectOption>) => {
                const v = newValue?.value;
                if (isStringValue) {
                  field.onChange(v ?? "");
                } else {
                  field.onChange(v != null ? (typeof v === "string" ? 0 : v) : 0);
                }
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              classNamePrefix="react-select"
              className={error ? "is-invalid" : ""}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  borderColor: error ? "var(--bs-form-invalid-border-color)" : base.borderColor,
                }),
              }}
              {...(dataTestId ? { "data-testid": dataTestId } : {})}
            />
          );
        }}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
