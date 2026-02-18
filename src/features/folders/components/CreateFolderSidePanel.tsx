import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { createCreateFolderResolver } from "../utils/CreateFolderSidePanel.validations";
import { SidePanel, Input, SelectField, Button } from "../../../shared/components/ui";
import type { SelectOption } from "../../../shared/components/ui";
import { FOLDER_TYPE_VALUES } from "../../../shared/constants/folderTypeOptions";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { useCompaniesStore } from "../../../shared/stores/companiesStore";
import { createFolder } from "../services/folders.api";
import type { Department } from "../../../app/adapter/api/admin.api";

export interface CreateFolderSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type CreateFolderFormValues = {
  name: string;
  code: string;
  department_id: number;
  folder_type?: string;
  description?: string;
  company_id?: number;
};

export const CreateFolderSidePanel = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateFolderSidePanelProps) => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const { companies, fetchCompanies } = useCompaniesStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolver = useMemo(() => createCreateFolderResolver(t), [t]);

  const FOLDER_TYPE_OPTIONS: SelectOption<string>[] = useMemo(
    () =>
      FOLDER_TYPE_VALUES.map((value) => ({
        value,
        label: t(`folders.folderTypeOptions.${value}`, { defaultValue: value }),
      })),
    [t]
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateFolderFormValues>({
    mode: "onChange",
    resolver,
    defaultValues: {
      name: "",
      code: "",
      department_id: 0,
      folder_type: "other",
      description: "",
      company_id: 0,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.getDepartments();
        if (!cancelled && res?.data) setDepartments(res.data);
      } catch {
        if (!cancelled) setDepartments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchCompanies({ limit: 100 });
  }, [isOpen, fetchCompanies]);

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        code: "",
        department_id: 0,
        folder_type: "other",
        description: "",
        company_id: 0,
      });
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  const name = watch("name");
  const code = watch("code");
  const departmentId = watch("department_id");

  // Enable Create when all required (*) fields are filled
  const hasRequiredName = typeof name === "string" && name.trim().length > 0;
  const hasRequiredCode = typeof code === "string" && code.trim().length > 0;
  const hasRequiredDepartment = Number(departmentId) >= 1;

  const canSubmit = hasRequiredName && hasRequiredCode && hasRequiredDepartment;
  const submitDisabled = !canSubmit || isSubmitting;

  const onSubmit = async (data: CreateFolderFormValues) => {
    setSubmitError(null);
    try {
      await createFolder({
        name: data.name,
        code: data.code,
        department_id: data.department_id,
        folder_type: data.folder_type || "other",
        description: data.description || null,
        ...(data.company_id != null && data.company_id >= 1 && { company_id: data.company_id }),
      });
      toast.success(t("folders.createSuccess"));
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("folders.failedToCreateFolder");
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
        variant="secondary"
        isLoading={isSubmitting}
        onClick={handleSubmit(onSubmit)}
        disabled={submitDisabled}
      >
        {t("folders.create")}
      </Button>
    </div>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("folders.addFolder")}
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
          label={t("folders.name")}
          {...register("name")}
          error={errors.name?.message}
          required
          autoComplete="off"
        />
        <Input
          label={t("folders.code")}
          {...register("code")}
          error={errors.code?.message}
          required
          autoComplete="off"
        />
        <SelectField
          control={control}
          name="department_id"
          options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
          label={t("folders.department")}
          placeholder={t("common.selectDepartment")}
          required
          error={errors.department_id?.message}
        />
        <SelectField
          control={control}
          name="folder_type"
          options={FOLDER_TYPE_OPTIONS}
          label={t("folders.folderType")}
          placeholder={t("common.other")}
          isStringValue
          error={errors.folder_type?.message}
        />
        <SelectField
          control={control}
          name="company_id"
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
          label={t("folders.companyBrand", { defaultValue: "Company/Brand" })}
          placeholder={t("app.selectPlaceholder", { defaultValue: "Select..." })}
          allowZero
          isClearable
          error={errors.company_id?.message}
        />
        <div className="mb-3">
          <label className="form-label">{t("folders.description")}</label>
          <textarea
            className={`form-control ${errors.description ? "is-invalid" : ""}`}
            {...register("description")}
            rows={3}
            autoComplete="off"
          />
          {errors.description && (
            <div className="invalid-feedback">{errors.description.message}</div>
          )}
        </div>
      </form>
    </SidePanel>
  );
};
