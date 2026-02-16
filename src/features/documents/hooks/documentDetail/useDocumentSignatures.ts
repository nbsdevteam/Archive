import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { DocumentDetail } from "@/app/adapter/api/documents.api";
import { useSignatureStore } from "@/features/signatures/stores/signatureStore";
import { fileToBase64 } from "@/shared/utils/files/fileToBase64";
import type { Manager } from "./useDocumentManagers";

/**
 * Signature request and upload-signed modals and handlers for document detail.
 */
export function useDocumentSignatures(
  docId: number | null,
  doc: DocumentDetail | null,
  _managers: Manager[],
  fetchDocument: (id: number) => Promise<void>
) {
  const { t } = useTranslation();
  const { requests, fetchRequests, createRequest, uploadSigned } = useSignatureStore();

  const [modalRequestSign, setModalRequestSign] = useState(false);
  const [selectedSignerId, setSelectedSignerId] = useState<number | "">("");
  const [signMessage, setSignMessage] = useState("");

  const [modalUploadSigned, setModalUploadSigned] = useState(false);
  const [selectedApprovedReqId, setSelectedApprovedReqId] = useState<number | null>(null);
  const [signToken, setSignToken] = useState("");
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const signedFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (docId) {
      fetchRequests({ document_id: docId });
    }
  }, [docId, fetchRequests]);

  const signatureRows = useMemo(() => {
    if (!docId || !requests) return [];
    return requests.filter((r: { document_id?: number }) => r.document_id === docId);
  }, [requests, docId]);

  const approvedRequests = useMemo(
    () => signatureRows.filter((r: { state?: string }) => r.state === "approved"),
    [signatureRows]
  );

  const handleCreateSignatureRequest = useCallback(async () => {
    if (!doc?.id || !selectedSignerId) return;
    try {
      await createRequest({
        document_id: doc.id,
        signer_id: Number(selectedSignerId),
        message: signMessage.trim() || undefined,
      });
      toast.success(t("documents.signatureRequestSent", { defaultValue: "Signature request sent." }));
      setModalRequestSign(false);
      setSelectedSignerId("");
      setSignMessage("");
      fetchRequests({ document_id: doc.id });
    } catch (e) {
      toast.error(
        (e as Error)?.message ??
          t("documents.signatureRequestFailed", { defaultValue: "Request failed." })
      );
    }
  }, [doc?.id, selectedSignerId, signMessage, createRequest, fetchRequests, t]);

  const handleClearSignedFile = useCallback(() => {
    setSignedFile(null);
    if (signedFileInputRef.current) {
      signedFileInputRef.current.value = "";
    }
  }, []);

  const handleUploadSignedSubmit = useCallback(async () => {
    if (!selectedApprovedReqId || !signedFile || !signToken.trim()) return;
    setUploadingSigned(true);
    try {
      const fileData = await fileToBase64(signedFile);
      await uploadSigned(selectedApprovedReqId, {
        file_data: fileData,
        file_name: signedFile.name,
        sign_token: signToken.trim(),
        notes: t("documents.signedVersionUploadNotes", { defaultValue: "Signed version uploaded from detail page." }),
      });
      toast.success(t("documents.signedVersionUploaded", { defaultValue: "Signed version uploaded." }));
      setModalUploadSigned(false);
      setSelectedApprovedReqId(null);
      setSignToken("");
      setSignedFile(null);
      if (doc?.id) {
        fetchDocument(doc.id);
        fetchRequests({ document_id: doc.id });
      }
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.signedVersionUploadFailed", { defaultValue: "Upload failed." })
      );
    } finally {
      setUploadingSigned(false);
    }
  }, [selectedApprovedReqId, signedFile, signToken, uploadSigned, doc?.id, fetchDocument, fetchRequests, t]);

  return {
    signatureRows,
    approvedRequests,
    modalRequestSign,
    setModalRequestSign,
    selectedSignerId,
    setSelectedSignerId,
    signMessage,
    setSignMessage,
    modalUploadSigned,
    setModalUploadSigned,
    selectedApprovedReqId,
    setSelectedApprovedReqId,
    signToken,
    setSignToken,
    signedFile,
    setSignedFile,
    uploadingSigned,
    signedFileInputRef,
    handleCreateSignatureRequest,
    handleClearSignedFile,
    handleUploadSignedSubmit,
  };
}
