/**
 * Create company side panel: country options from localStorage cache (API only on cache miss). Submit with country_name and E.164 phone.
 */

import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { SidePanel, Input, Button } from "@/shared/components/ui";
import { createCompany } from "../services/companies.api";
import { formatPhoneToE164 } from "../utils/countryPhoneUtils";
import { useCountriesFromCache } from "../hooks/useCountriesFromCache";
import { createCreateCompanyResolver } from "./createCompanyValidation";
import { PhoneCountryInput } from "./PhoneCountryInput";

export interface CreateCompanySidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type CreateCompanyFormValues = {
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

export function CreateCompanySidePanel({
  isOpen,
  onClose,
  onSuccess,
}: CreateCompanySidePanelProps) {
  const { t } = useTranslation();
  const nationalNumberRef = useRef<HTMLInputElement | null>(null);
  const { countryOptions, selectOptions, loading: countriesLoading, error: countriesError } = useCountriesFromCache(isOpen);

  const resolver = useMemo(() => createCreateCompanyResolver(t), [t]);

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
  } = useForm<CreateCompanyFormValues>({
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
    if (isOpen) {
      reset({
        name: "",
        countryIso2: "",
        dialCode: "",
        nationalNumber: "",
        email: "",
        vat: "",
        street: "",
        city: "",
        website: "",
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: CreateCompanyFormValues) => {
    const selectedCountry = data.countryIso2
      ? countryOptions.find((o) => o.value === data.countryIso2)
      : null;
    const dialCode = (data.dialCode ?? "").toString().replace(/\D/g, "");
    const nationalNumber = (data.nationalNumber ?? "").trim().replace(/\D/g, "");
    const callingCodeForE164 = selectedCountry?.callingCode ?? dialCode;
    const phoneE164 =
      callingCodeForE164 && nationalNumber
        ? formatPhoneToE164(nationalNumber, callingCodeForE164, false)
        : undefined;
    const country_name = selectedCountry?.englishName ?? undefined;

    try {
      await createCompany({
        name: data.name.trim(),
        phone: phoneE164,
        email: data.email?.trim() || undefined,
        vat: data.vat?.trim() || undefined,
        street: data.street?.trim() || undefined,
        city: data.city?.trim() || undefined,
        country_name,
        website: data.website?.trim() || undefined,
      });
      toast.success(t("companies.createSuccess", { defaultValue: "Company created successfully." }));
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("companies.createFailed", { defaultValue: "Failed to create company." });
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
        {t("common.create")}
      </Button>
    </div>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("companies.createCompany", { defaultValue: "Create company" })}
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
