import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { DocumentDetail } from "@/app/adapter/api/documents.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { downloadDocumentWithToast } from "@/shared/utils/documents/downloadDocumentWithToast";
import { fileToBase64 } from "@/shared/utils/files/fileToBase64";

/**
 * Version download/upload flow and modal state for document detail.
 */
export function useDocumentVersions(
  doc: DocumentDetail | null,
  fileName: string,
  fetchDocument: (id: number) => Promise<void>
) {
  const { t } = useTranslation();
  const { downloadVersion, uploadVersion } = useDocumentStore();

  const [modalUploadVersion, setModalUploadVersion] = useState(false);
  const [uploadVersionFile, setUploadVersionFile] = useState<File | null>(null);
  const [uploadVersionUnlockToken, setUploadVersionUnlockToken] = useState("");
  const [uploadVersionDescription, setUploadVersionDescription] = useState("");
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const uploadVersionInputRef = useRef<HTMLInputElement | null>(null);

  const handleClearUploadVersionFile = useCallback(() => {
    setUploadVersionFile(null);
    if (uploadVersionInputRef.current) {
      uploadVersionInputRef.current.value = "";
    }
  }, []);

  const handleDownloadVersion = useCallback(
    async (versionId: number, fName: string) => {
      if (!doc?.id) return;
      try {
        await downloadVersion(doc.id, versionId, fName);
        toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
      } catch (e) {
        toast.error(
          (e as Error)?.message ?? t("documents.downloadFailed", { defaultValue: "Download failed." })
        );
      }
    },
    [doc?.id, downloadVersion, t]
  );

  const handleDownloadCurrent = useCallback(async () => {
    if (!doc?.id || !fileName) return;
    await downloadDocumentWithToast(doc.id, fileName, t);
  }, [doc?.id, fileName, t]);

  const handleUploadVersionSubmit = useCallback(async () => {
    if (!doc?.id || !uploadVersionFile || !uploadVersionUnlockToken.trim()) return;
    setUploadingVersion(true);
    try {
      const fileData = await fileToBase64(uploadVersionFile);
      await uploadVersion(doc.id, {
        file_data: fileData,
        file_name: uploadVersionFile.name,
        unlock_token: uploadVersionUnlockToken.trim(),
        change_description: uploadVersionDescription.trim() || "New version",
      });
      toast.success(t("documents.versionUploaded", { defaultValue: "New version uploaded." }));
      setModalUploadVersion(false);
      setUploadVersionFile(null);
      setUploadVersionUnlockToken("");
      setUploadVersionDescription("");
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.versionUploadFailed", { defaultValue: "Upload failed." })
      );
    } finally {
      setUploadingVersion(false);
    }
  }, [
    doc?.id,
    uploadVersionFile,
    uploadVersionUnlockToken,
    uploadVersionDescription,
    uploadVersion,
    t,
  ]);

  return {
    modalUploadVersion,
    setModalUploadVersion,
    uploadVersionFile,
    setUploadVersionFile,
    uploadVersionUnlockToken,
    setUploadVersionUnlockToken,
    uploadVersionDescription,
    setUploadVersionDescription,
    uploadingVersion,
    uploadVersionInputRef,
    handleClearUploadVersionFile,
    handleDownloadVersion,
    handleDownloadCurrent,
    handleUploadVersionSubmit,
  };
}
