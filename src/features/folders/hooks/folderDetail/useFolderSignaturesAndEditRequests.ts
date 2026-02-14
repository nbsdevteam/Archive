import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { editRequestsApi } from "@/app/adapter/api/editRequests.api";
import { useSignatureStore } from "@/features/signatures/stores/signatureStore";
import type { Document } from "@/app/adapter/api/documents.api";

/**
 * Signature request and edit request modals for folder main document.
 */
export function useFolderSignaturesAndEditRequests(
  mainDoc: Document | null,
  routes: { signatures: string; editRequests: string }
) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createRequest } = useSignatureStore();

  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureSignerId, setSignatureSignerId] = useState<number | "">("");
  const [signatureMessage, setSignatureMessage] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editReason, setEditReason] = useState("");

  const openSignature = useCallback(() => {
    setSignatureSignerId("");
    setSignatureMessage("");
    setSignatureOpen(true);
  }, []);

  const submitSignature = useCallback(async () => {
    if (!mainDoc || !signatureSignerId) {
      toast.error(t("folders.selectSignerError", { defaultValue: "Please select a signer." }));
      return;
    }
    try {
      await createRequest({
        document_id: mainDoc.id,
        signer_id: Number(signatureSignerId),
        message: signatureMessage.trim() || undefined,
      });
      toast.success(t("folders.signatureRequestCreated", { defaultValue: "Signature request created." }));
      setSignatureOpen(false);
      navigate(routes.signatures);
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("folders.signatureRequestCreateFailed", { defaultValue: "Failed to create request." }));
    }
  }, [mainDoc, signatureSignerId, signatureMessage, createRequest, t, navigate, routes.signatures]);

  const openEditRequest = useCallback(() => {
    setEditReason("");
    setEditOpen(true);
  }, []);

  const submitEditRequest = useCallback(async () => {
    if (!mainDoc) return;
    if (!editReason.trim()) {
      toast.error(t("folders.writeEditReason", { defaultValue: "Please enter a reason." }));
      return;
    }
    try {
      const res = await editRequestsApi.createEditRequest(mainDoc.id, editReason.trim());
      if (!res.success) throw new Error("Create failed");
      toast.success(t("folders.editRequestCreated", { defaultValue: "Edit request created." }));
      setEditOpen(false);
      navigate(routes.editRequests);
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("folders.editRequestCreateFailed", { defaultValue: "Failed to create edit request." }));
    }
  }, [mainDoc, editReason, t, navigate, routes.editRequests]);

  return {
    signatureOpen,
    signatureSignerId,
    signatureMessage,
    setSignatureOpen,
    setSignatureSignerId,
    setSignatureMessage,
    editOpen,
    editReason,
    setEditOpen,
    setEditReason,
    openSignature,
    submitSignature,
    openEditRequest,
    submitEditRequest,
  };
}
