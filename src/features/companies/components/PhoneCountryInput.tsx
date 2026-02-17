/**
 * Combined country dropdown + dial code + national number inputs with sync and blur validation.
 * Used in Create/Edit company side panels.
 */

import { useRef, useCallback } from "react";
import type { Control, UseFormSetValue, UseFormSetError, UseFormClearErrors, UseFormGetValues, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import Select, { type SingleValue } from "react-select";
import type { SelectOption } from "@/shared/components/ui";
import type { CountryOption } from "../utils/countryPhoneUtils";
import {
  getCountryByCallingCode,
  isValidCallingCode,
  validatePhoneForCountry,
  type CountryOption as CountryOptionType,
} from "../utils/countryPhoneUtils";

export interface PhoneCountryInputProps<T extends FieldValues> {
  control: Control<T>;
  getValues: UseFormGetValues<T>;
  countryIso2Name: FieldPath<T>;
  dialCodeName: FieldPath<T>;
  nationalNumberName: FieldPath<T>;
  countryOptions: CountryOptionType[];
  setValue: UseFormSetValue<T>;
  setError: UseFormSetError<T>;
  clearErrors: UseFormClearErrors<T>;
  errors: { dialCode?: { message?: string }; nationalNumber?: { message?: string }; countryIso2?: { message?: string } };
  selectOptions: SelectOption[];
  t: (key: string, opts?: { defaultValue?: string }) => string;
  nationalNumberRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * Renders country react-select, small dial-code input, and national number input.
 * On country change: sets dial code and focuses national number. On dial code blur: resolves country or sets error.
 * On national number blur: validates phone for selected country.
 */
export function PhoneCountryInput<T extends FieldValues>({
  control,
  getValues,
  countryIso2Name,
  dialCodeName,
  nationalNumberName,
  countryOptions,
  setValue,
  setError,
  clearErrors,
  errors,
  selectOptions,
  t,
  nationalNumberRef,
}: PhoneCountryInputProps<T>) {
  const handleCountryChange = useCallback(
    (newValue: SingleValue<SelectOption>, fieldOnChange: (v: string) => void) => {
      const v = newValue?.value as string | undefined;
      fieldOnChange(v ?? "");
      if (v) {
        const opt = countryOptions.find((o) => o.value === v);
        if (opt) {
          setValue(dialCodeName, opt.callingCode as T[FieldPath<T>]);
          clearErrors(dialCodeName);
          setTimeout(() => nationalNumberRef?.current?.focus(), 0);
        }
      }
    },
    [countryOptions, setValue, dialCodeName, clearErrors, nationalNumberRef]
  );

  const handleDialCodeBlur = useCallback(
    (dialCode: string, currentIso2: string | undefined) => {
      const digits = dialCode.replace(/\D/g, "");
      if (!digits) {
        setValue(countryIso2Name, "" as T[FieldPath<T>]);
        clearErrors(dialCodeName);
        return;
      }
      const found = getCountryByCallingCode(digits, currentIso2 || undefined);
      if (found) {
        setValue(countryIso2Name, found.iso2 as T[FieldPath<T>]);
        setValue(dialCodeName, digits as T[FieldPath<T>]);
        clearErrors(dialCodeName);
      } else {
        setError(dialCodeName, {
          type: "manual",
          message: t("companies.validation.invalidCountryCode", { defaultValue: "Please provide a correct country code." }),
        });
      }
    },
    [countryIso2Name, dialCodeName, setValue, setError, clearErrors, t]
  );

  const handleNationalNumberBlur = useCallback(
    (nationalNumber: string, countryIso2: string | undefined, dialCode: string) => {
      const digits = nationalNumber.replace(/\D/g, "");
      if (!digits) {
        clearErrors(nationalNumberName);
        return;
      }
      if (!dialCode) {
        setError(nationalNumberName, {
          type: "manual",
          message: t("companies.validation.selectCountryFirst", { defaultValue: "Select a country or enter country code first." }),
        });
        return;
      }
      const valid = validatePhoneForCountry(nationalNumber, countryIso2 || undefined, dialCode);
      if (!valid) {
        setError(nationalNumberName, {
          type: "manual",
          message: t("companies.validation.invalidPhone", { defaultValue: "Please enter a valid phone number for the selected country." }),
        });
      } else {
        clearErrors(nationalNumberName);
      }
    },
    [nationalNumberName, setError, clearErrors, t]
  );

  return (
    <>
      <Controller
        control={control}
        name={countryIso2Name}
        render={({ field }) => (
          <div className="mb-3">
            <label className="form-label">{t("companies.country", { defaultValue: "Country" })}</label>
            <Select<SelectOption>
              isClearable
              placeholder={t("companies.country", { defaultValue: "Select country..." })}
              options={selectOptions}
              value={selectOptions.find((o) => o.value === field.value) ?? null}
              onChange={(v) => handleCountryChange(v, field.onChange)}
              onBlur={field.onBlur}
              ref={field.ref}
              classNamePrefix="react-select"
              className={errors.countryIso2?.message ? "is-invalid" : ""}
              styles={{ control: (base) => ({ ...base, minHeight: "38px" }) }}
            />
            {errors.countryIso2?.message && (
              <div className="invalid-feedback d-block">{errors.countryIso2.message}</div>
            )}
          </div>
        )}
      />
      <div className="mb-3">
        <label className="form-label">{t("companies.phoneCountryCode", { defaultValue: "Phone" })}</label>
        <div className="d-flex gap-2 align-items-start">
          <Controller
            control={control}
            name={dialCodeName}
            render={({ field }) => (
              <div className="flex-shrink-0" style={{ width: "100px" }}>
                <input
                  type="text"
                  className={`form-control form-control-md ${errors.dialCode?.message ? "is-invalid" : ""}`}
                  placeholder="+1"
                  value={field.value ? `+${String(field.value).replace(/\D/g, "")}` : ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    field.onChange(digits);
                  }}
                  onBlur={(e) => {
                    field.onBlur();
                    const digits = (field.value ?? "").toString().replace(/\D/g, "");
                    const currentIso2 = getValues(countryIso2Name as FieldPath<T>) as string | undefined;
                    handleDialCodeBlur(digits, currentIso2);
                  }}
                  aria-label={t("companies.phoneCountryCode", { defaultValue: "Country code" })}
                />
                {errors.dialCode?.message && (
                  <div className="invalid-feedback d-block">{errors.dialCode.message}</div>
                )}
              </div>
            )}
          />
          <Controller
            control={control}
            name={nationalNumberName}
            render={({ field }) => (
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <input
                  ref={(el) => {
                    field.ref(el);
                    if (nationalNumberRef) (nationalNumberRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                  }}
                  type="tel"
                  className={`form-control form-control-md ${errors.nationalNumber?.message ? "is-invalid" : ""}`}
                  placeholder={t("companies.phoneNumberPlaceholder", { defaultValue: "Phone number" })}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={(e) => {
                    field.onBlur();
                    const countryIso2 = getValues(countryIso2Name as FieldPath<T>) as string | undefined;
                    const dialCode = (getValues(dialCodeName as FieldPath<T>) ?? "").toString().replace(/\D/g, "");
                    handleNationalNumberBlur((field.value ?? "").toString(), countryIso2, dialCode);
                  }}
                  aria-label={t("companies.phoneNumber", { defaultValue: "Phone number" })}
                />
                {errors.nationalNumber?.message && (
                  <div className="invalid-feedback d-block">{errors.nationalNumber.message}</div>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </>
  );
}
