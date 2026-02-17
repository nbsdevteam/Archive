import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { SidePanel, Input, Button } from "@/shared/components/ui";
import { createValidationResolver } from "@/shared/utils/form/validation";
import { requiredTrimmedString, optionalTrimmedString } from "@/shared/utils/form/validation";
import type { Validator } from "@/shared/utils/form/validation";
import { getCompany, updateCompany } from "../services/companies.api";
import type { CompanyDetail } from "../types/companies.types";

export interface EditCompanySidePanelProps {
  isOpen: boolean;
  companyId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export type EditCompanyFormValues = {
  name: string;
  phone?: string;
  email?: string;
  vat?: string;
  street?: string;
  city?: string;
  website?: string;
};

const PATH_NAME = ["name"];

function makeEditCompanyValidator(t: (key: string, opts?: { defaultValue?: string }) => string): Validator<EditCompanyFormValues> {
  return (values: EditCompanyFormValues) => {
    const issues: { path: (string | number)[]; message: string; code?: string }[] = [];
    requiredTrimmedString(
      issues,
      PATH_NAME,
      values.name,
      t("companies.validation.nameRequired", { defaultValue: "Name is required." })
    );
    return {
      values: {
        name: optionalTrimmedString(values.name),
        phone: optionalTrimmedString(values.phone),
        email: optionalTrimmedString(values.email),
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
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolver = useMemo(
    () => createValidationResolver(makeEditCompanyValidator(t)),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditCompanyFormValues>({
    mode: "onChange",
    resolver,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      vat: "",
      street: "",
      city: "",
      website: "",
    },
  });

  useEffect(() => {
    if (!isOpen || !companyId) {
      setCompany(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    getCompany(companyId)
      .then((data) => {
        if (!cancelled) {
          setCompany(data);
          reset({
            name: data.name ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            vat: data.vat ?? "",
            street: data.street ?? "",
            city: data.city ?? "",
            website: data.website ?? "",
          });
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("errors.loadFailed", { defaultValue: "Failed to load." }));
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, reset, t]);

  useEffect(() => {
    if (!isOpen) setSubmitError(null);
  }, [isOpen]);

  const onSubmit = async (data: EditCompanyFormValues) => {
    if (!companyId) return;
    setSubmitError(null);
    try {
      await updateCompany(companyId, {
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        vat: data.vat?.trim() || undefined,
        street: data.street?.trim() || undefined,
        city: data.city?.trim() || undefined,
        website: data.website?.trim() || undefined,
      });
      toast.success(t("companies.updateSuccess", { defaultValue: "Company updated successfully." }));
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("companies.updateFailed", { defaultValue: "Failed to update company." });
      setSubmitError(msg);
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
        disabled={isSubmitting || !company}
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
      {loadError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {loadError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-0">
        {submitError && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {submitError}
          </div>
        )}
        <Input
          label={t("companies.name", { defaultValue: "Name" })}
          {...register("name")}
          error={errors.name?.message}
          required
          autoComplete="off"
        />
        <Input
          label={t("companies.phone", { defaultValue: "Phone" })}
          {...register("phone")}
          error={errors.phone?.message}
          autoComplete="off"
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
