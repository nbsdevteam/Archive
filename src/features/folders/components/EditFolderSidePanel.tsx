import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { createEditFolderResolver } from "./editFolderValidation";
import { SidePanel, Input, Button } from "../../../shared/components/ui";
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
};

export const EditFolderSidePanel = ({
  isOpen,
  onClose,
  folder,
  onSuccess,
}: EditFolderSidePanelProps) => {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolver = useMemo(() => createEditFolderResolver(t), [t]);

  const {
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
    },
  });

  useEffect(() => {
    if (isOpen && folder) {
      reset({
        name: folder.name ?? "",
        code: folder.code ?? "",
        description: folder.description ?? "",
      });
      setSubmitError(null);
    }
  }, [isOpen, folder, reset]);

  const onSubmit = async (data: EditFolderFormValues) => {
    if (!folder?.id) return;
    setSubmitError(null);
    try {
      await updateFolder(folder.id, {
        name: data.name.trim(),
        code: data.code.trim(),
        description: data.description?.trim() || null,
      });
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
        <div className="mb-3">
          <label className="form-label">{t("folders.description")}</label>
          <textarea
            className={`form-control ${errors.description ? "is-invalid" : ""}`}
            {...register("description")}
            rows={3}
            autoComplete="off"
          />
          {errors.description && (
            <p className="invalid-feedback d-block mb-0" role="alert">{errors.description.message}</p>
          )}
        </div>
      </form>
    </SidePanel>
  );
};
