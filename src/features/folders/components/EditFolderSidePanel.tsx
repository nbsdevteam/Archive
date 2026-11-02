import { useEffect, useMemo, useState } from "react";
import { invalidateFolderData } from "@/shared/lib/queryInvalidation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { createEditFolderResolver } from "../utils/EditFolderSidePanel.validations";
import { SidePanel, Input, SelectField, Button } from "../../../shared/components/ui";
import { useCompaniesStore } from "../../../shared/stores/companiesStore";
import { updateFolder } from "../services/folders.api";
import type { Folder, FolderDetail } from "../types/folders.types";

export interface EditFolderSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Folder or FolderDetail (list item has Folder; detail page has FolderDetail) */
  folder: Folder | FolderDetail | null;
  onSuccess?: () => void;
}

export type EditFolderFormValues = {
  name: string;
  code: string;
  description?: string;
  company_id?: number;
};

export const EditFolderSidePanel = ({
  isOpen,
  onClose,
  folder,
  onSuccess,
}: EditFolderSidePanelProps) => {
  const { t } = useTranslation();
  const { companies, fetchCompanies } = useCompaniesStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolver = useMemo(() => createEditFolderResolver(t), [t]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditFolderFormValues>({
    mode: "onChange",
    resolver,
    defaultValues: {
      name: "",
      code: "",
      description: "",
      company_id: 0,
    },
  });

  useEffect(() => {
    if (isOpen && folder) {
      reset({
        name: folder.name ?? "",
        code: folder.code ?? "",
        description: folder.description ?? "",
        company_id: folder.company_id ?? 0,
      });
      setSubmitError(null);
    }
  }, [isOpen, folder, reset]);

  useEffect(() => {
    if (isOpen) fetchCompanies({ limit: 100 });
  }, [isOpen, fetchCompanies]);

  const onSubmit = async (data: EditFolderFormValues) => {
    if (!folder?.id) return;
    setSubmitError(null);
    try {
      await updateFolder(folder.id, {
        name: data.name.trim(),
        code: data.code.trim(),
        description: data.description?.trim() || null,
        company_id: data.company_id != null && data.company_id >= 1 ? data.company_id : null,
      });
      void invalidateFolderData();
      toast.success(t("folders.folderUpdated"));
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("folders.updateFailed");
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
        {t("common.save")}
      </Button>
    </div>
  );

  if (!folder) return null;

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("folders.editFolder")}
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
