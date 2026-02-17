/**
 * Edit company side panel: country options from localStorage cache. Loads company, prefills form; submit uses country_name and E.164 phone.
 */

import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { SidePanel, Input, Button } from "@/shared/components/ui";
import { createValidationResolver } from "@/shared/utils/form/validation";
import { requiredTrimmedString, optionalTrimmedString, addIssue } from "@/shared/utils/form/validation";
import type { Validator } from "@/shared/utils/form/validation";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { getCompany, updateCompany } from "../services/companies.api";
import { formatPhoneToE164 } from "../utils/countryPhoneUtils";
import { useCountriesFromCache } from "../hooks/useCountriesFromCache";
import { PhoneCountryInput } from "./PhoneCountryInput";

export interface EditCompanySidePanelProps {
  isOpen: boolean;
  companyId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export type EditCompanyFormValues = {
  name: string;
  countryIso2?: string;
  dialCode?: string;
  nationalNumber?: string;
  email?: string;
  vat?: string;
  street?: string;
  city?: string;
  website?: string;
};

const PATH_NAME = ["name"];
const PATH_EMAIL = ["email"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeEditCompanyValidator(
  t: (key: string, opts?: { defaultValue?: string }) => string
): Validator<EditCompanyFormValues> {
  return (values: EditCompanyFormValues) => {
    const issues: { path: (string | number)[]; message: string; code?: string }[] = [];
    requiredTrimmedString(
      issues,
      PATH_NAME,
      values.name,
      t("companies.validation.nameRequired", { defaultValue: "Name is required." })
    );
    const email = optionalTrimmedString(values.email);
    if (email && !EMAIL_REGEX.test(email)) {
      addIssue(issues, PATH_EMAIL, t("companies.validation.invalidEmail", { defaultValue: "Please enter a valid email address." }), "pattern");
    }
    return {
      values: {
        name: optionalTrimmedString(values.name),
        countryIso2: typeof values.countryIso2 === "string" ? values.countryIso2.trim() || undefined : undefined,
        dialCode: typeof values.dialCode === "string" ? values.dialCode.replace(/\D/g, "") || undefined : undefined,
        nationalNumber: optionalTrimmedString(values.nationalNumber ?? ""),
        email: email || undefined,
        vat: optionalTrimmedString(values.vat),
        street: optionalTrimmedString(values.street),
        city: optionalTrimmedString(values.city),
        website: optionalTrimmedString(values.website),
      },
      issues,
    };
  };
}

export function EditCompanySidePanel({
  isOpen,
  companyId,
  onClose,
  onSuccess,
}: EditCompanySidePanelProps) {
  const { t } = useTranslation();
  const nationalNumberRef = useRef<HTMLInputElement | null>(null);
  const { countryOptions, selectOptions, loading: countriesLoading, error: countriesError } = useCountriesFromCache();

  const resolver = useMemo(
    () => createValidationResolver(makeEditCompanyValidator(t)),
    [t]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getValues,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditCompanyFormValues>({
    mode: "onChange",
    resolver,
    defaultValues: {
      name: "",
      countryIso2: "",
      dialCode: "",
      nationalNumber: "",
      email: "",
      vat: "",
      street: "",
      city: "",
      website: "",
    },
  });

  useEffect(() => {
    if (!isOpen || !companyId) return;
    clearErrors("root");
    let cancelled = false;
    getCompany(companyId)
      .then((data) => {
        if (cancelled) return;
        let countryCode = "";
        let dialCode = "";
        let nationalNumber = "";
        if (data.phone?.trim()) {
          const parsed = parsePhoneNumberFromString(data.phone.trim());
          if (parsed) {
            countryCode = parsed.country ?? "";
            dialCode = parsed.countryCallingCode ?? "";
            nationalNumber = parsed.nationalNumber ?? "";
          }
        }
        const optionByCode = countryOptions.find((o) => o.value === countryCode);
        const optionByCallingCode = dialCode ? countryOptions.find((o) => String(o.callingCode) === String(dialCode)) : undefined;
        const optionByName = data.country_name ? countryOptions.find((o) => o.englishName === data.country_name) : undefined;
        const option = optionByCode ?? optionByName ?? optionByCallingCode;
        const formCountryValue = option ? option.value : countryCode || "";

        if (!dialCode && option?.callingCode) dialCode = option.callingCode;

        reset({
          name: data.name ?? "",
          countryIso2: formCountryValue,
          dialCode: dialCode || "",
          nationalNumber: nationalNumber || "",
          email: data.email ?? "",
          vat: data.vat ?? "",
          street: data.street ?? "",
          city: data.city ?? "",
          website: (data as { website?: string }).website ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) setError("root", { message: t("errors.loadFailed", { defaultValue: "Failed to load." }) });
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, countryOptions, reset, setError, clearErrors, t]);

  const onSubmit = async (data: EditCompanyFormValues) => {
    if (!companyId) return;
    const selectedCountry = data.countryIso2 ? countryOptions.find((o) => o.value === data.countryIso2) : null;
    const dialCode = (data.dialCode ?? "").toString().replace(/\D/g, "");
    const nationalNumber = (data.nationalNumber ?? "").trim().replace(/\D/g, "");
    const callingCodeForE164 = selectedCountry?.callingCode ?? dialCode;
    const phoneE164 =
      callingCodeForE164 && nationalNumber
        ? formatPhoneToE164(nationalNumber, callingCodeForE164, false)
        : undefined;
    const country_name = selectedCountry?.englishName ?? undefined;

    try {
      await updateCompany(companyId, {
        name: data.name.trim(),
        phone: phoneE164,
        email: data.email?.trim() || undefined,
        vat: data.vat?.trim() || undefined,
        street: data.street?.trim() || undefined,
        city: data.city?.trim() || undefined,
        country_name,
        website: data.website?.trim() || undefined,
      });
      toast.success(t("companies.updateSuccess", { defaultValue: "Company updated successfully." }));
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("companies.updateFailed", { defaultValue: "Failed to update company." });
      setError("root", { message: msg });
      toast.error(msg);
    }
  };

  const footer = (
    <div className="d-flex gap-2 justify-content-end">
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
        {t("common.cancel")}
      </Button>
      <Button
        variant="primary"
        isLoading={isSubmitting}
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {t("common.save")}
      </Button>
    </div>
  );

  if (!companyId) return null;

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("companies.editCompany", { defaultValue: "Edit company" })}
      footer={footer}
      loading={isSubmitting}
      width="50vw"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-0">
        {errors.root?.message && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {errors.root.message}
          </div>
        )}
        {countriesError && (
          <div className="alert alert-warning py-2 mb-3" role="alert">
            {countriesError}
          </div>
        )}
        <Input
          label={t("companies.name", { defaultValue: "Name" })}
          {...register("name")}
          error={errors.name?.message}
          required
          autoComplete="off"
        />
        <PhoneCountryInput
          control={control}
          getValues={getValues}
          countryIso2Name="countryIso2"
          dialCodeName="dialCode"
          nationalNumberName="nationalNumber"
          countryOptions={countryOptions}
          setValue={setValue}
          setError={setError}
          clearErrors={clearErrors}
          errors={{
            dialCode: errors.dialCode,
            nationalNumber: errors.nationalNumber,
            countryIso2: errors.countryIso2,
          }}
          selectOptions={selectOptions}
          t={t}
          nationalNumberRef={nationalNumberRef}
          countrySelectDisabled={countriesLoading}
        />
        <Input
          label={t("companies.email", { defaultValue: "Email" })}
          {...register("email")}
          error={errors.email?.message}
          type="email"
          autoComplete="off"
        />
        <Input
          label={t("companies.vat", { defaultValue: "VAT" })}
          {...register("vat")}
          error={errors.vat?.message}
          autoComplete="off"
        />
        <Input
          label={t("companies.street", { defaultValue: "Street" })}
          {...register("street")}
          error={errors.street?.message}
          autoComplete="off"
        />
        <Input
          label={t("companies.city", { defaultValue: "City" })}
          {...register("city")}
          error={errors.city?.message}
          autoComplete="off"
        />
        <Input
          label={t("companies.website", { defaultValue: "Website" })}
          {...register("website")}
          error={errors.website?.message}
          autoComplete="off"
        />
      </form>
    </SidePanel>
  );
}
