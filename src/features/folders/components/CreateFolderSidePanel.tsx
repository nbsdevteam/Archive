import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { createCreateFolderResolver } from "../utils/CreateFolderSidePanel.validations";
import { SidePanel, Input, SelectField, Button } from "../../../shared/components/ui";
import { useCompaniesStore } from "../../../shared/stores/companiesStore";
import { useDepartmentsStore } from "../../../shared/stores/departmentsStore";
import { createFolder } from "../services/folders.api";
import { FOLDER_TYPE_VALUES } from "@/shared/constants/folderTypeOptions";

export type CreateFolderFormValues = {
  name: string;
  code: string;
  department_id: number;
  folder_type?: string;
  company_id?: number;
  description?: string;
};

export interface CreateFolderSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateFolderSidePanel = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateFolderSidePanelProps) => {
  const { t } = useTranslation();
  const { companies, fetchCompanies } = useCompaniesStore();
  const { departments, fetchDepartments } = useDepartmentsStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolver = useMemo(() => createCreateFolderResolver(t), [t]);

  const folderTypeOptions = useMemo(
    () =>
      FOLDER_TYPE_VALUES.map((value) => ({
        value,
        label: t(`folders.folderTypeOptions.${value}`, { defaultValue: value }),
      })),
    [t]
  );

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
    [departments]
  );

  const {
    control,
    register,
    handleSubmit,
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
      company_id: 0,
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        code: "",
        department_id: 0,
        folder_type: "other",
        company_id: 0,
        description: "",
      });
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies({ limit: 100 });
      fetchDepartments();
    }
  }, [isOpen, fetchCompanies, fetchDepartments]);

  const onSubmit = async (data: CreateFolderFormValues) => {
    setSubmitError(null);
    try {
      await createFolder({
        name: data.name.trim(),
        code: data.code.trim(),
        department_id: data.department_id,
        folder_type: data.folder_type || "other",
        description: data.description?.trim() || null,
        company_id: data.company_id != null && data.company_id >= 1 ? data.company_id : undefined,
      });
      toast.success(t("folders.createSuccess", { defaultValue: "Folder created successfully." }));
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("folders.failedToCreateFolder", { defaultValue: "Failed to create folder" });
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
        disabled={isSubmitting}
      >
        {isSubmitting
          ? t("folders.creating", { defaultValue: "Creating..." })
          : t("folders.create", { defaultValue: "Create" })}
      </Button>
    </div>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("folders.addFolder", { defaultValue: "Add Folder" })}
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
          options={departmentOptions}
          label={t("folders.department", { defaultValue: "Department" })}
          placeholder={t("app.selectPlaceholder", { defaultValue: "Select..." })}
          error={errors.department_id?.message as string | undefined}
          required
        />
        <SelectField
          control={control}
          name="folder_type"
          options={folderTypeOptions}
          label={t("folders.folderType", { defaultValue: "Folder type" })}
          placeholder={t("common.other", { defaultValue: "Other" })}
          isStringValue
          isClearable
          error={errors.folder_type?.message as string | undefined}
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
