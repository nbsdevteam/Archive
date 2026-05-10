import { useId } from "react";
import { type Control, type FieldPath, type FieldValues, Controller } from "react-hook-form";
import Select, { type MultiValue } from "react-select";
import type { SelectOption } from "./SelectField";

interface MultiSelectFieldProps<T extends FieldValues, Name extends FieldPath<T>> {
  control: Control<T>;
  name: Name;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  isDisabled?: boolean;
  error?: string;
  className?: string;
  /** When true, the outer wrapper has no bottom margin (e.g. paired in a grid row). */
  omitBottomMargin?: boolean;
}

/** Returns a change handler for multi Select that syncs selected ids with react-hook-form field. */
function getMultiSelectChangeHandler(field: { onChange: (ids: number[]) => void }) {
  return function handleMultiSelectChange(newValue: MultiValue<SelectOption>) {
    const ids = newValue
      .map((o) => o.value)
      .filter((v): v is number => typeof v === "number");
    field.onChange(ids);
  };
}

/**
 * Multi select wired to react-hook-form via Controller.
 * Form value is number[] (e.g. tag ids); options are { value, label } with value as number.
 */
export function MultiSelectField<T extends FieldValues, Name extends FieldPath<T>>({
  control,
  name,
  options,
  label,
  placeholder = "Select...",
  isDisabled,
  error,
  className = "",
  omitBottomMargin = false,
}: MultiSelectFieldProps<T, Name>) {
  const labelId = useId();
  const accessibleName = label ?? placeholder;
  // Expose accessible name for screen readers/TTS via aria-label and aria-labelledby (react-select supports both).
  return (
    <div className={`${omitBottomMargin ? "" : "mb-3 "}${className}`.trim()}>
      {label && <label id={labelId} className="form-label">{label}</label>}
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const valueArr = (field.value as number[] | undefined) ?? [];
          const selectedOptions = options.filter((o) =>
            typeof o.value === "number" ? valueArr.includes(o.value) : false
          );
          return (
            <Select<SelectOption, true>
              isMulti
              placeholder={placeholder}
              options={options}
              value={selectedOptions}
              isDisabled={isDisabled}
              onChange={getMultiSelectChangeHandler(field)}
              onBlur={field.onBlur}
              ref={field.ref}
              classNamePrefix="react-select"
              className={error ? "is-invalid" : ""}
              aria-label={accessibleName}
              aria-labelledby={label ? labelId : undefined}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  borderColor: error ? "var(--bs-form-invalid-border-color)" : base.borderColor,
                }),
              }}
            />
          );
        }}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
