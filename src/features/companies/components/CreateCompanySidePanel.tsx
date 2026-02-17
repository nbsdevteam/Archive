import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { SidePanel, Input, Button } from "@/shared/components/ui";
import { createCreateCompanyResolver } from "./createCompanyValidation";
import { createCompany } from "../services/companies.api";

export interface CreateCompanySidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type CreateCompanyFormValues = {
  name: string;
  phone?: string;
  email?: string;
  vat?: string;
  street?: string;
  city?: string;
  country_id?: number;
  website?: string;
};

export function CreateCompanySidePanel({
  isOpen,
  onClose,
  onSuccess,
}: CreateCompanySidePanelProps) {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolver = useMemo(() => createCreateCompanyResolver(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCompanyFormValues>({
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
    if (isOpen) {
      reset({
        name: "",
        phone: "",
        email: "",
        vat: "",
        street: "",
        city: "",
        website: "",
      });
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: CreateCompanyFormValues) => {
    setSubmitError(null);
    try {
      await createCompany({
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        vat: data.vat?.trim() || undefined,
        street: data.street?.trim() || undefined,
        city: data.city?.trim() || undefined,
        country_id: data.country_id != null && data.country_id >= 1 ? data.country_id : undefined,
        website: data.website?.trim() || undefined,
      });
      toast.success(t("companies.createSuccess", { defaultValue: "Company created successfully." }));
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("companies.createFailed", { defaultValue: "Failed to create company." });
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
