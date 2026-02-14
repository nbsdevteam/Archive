import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { documentsApi } from "@/app/adapter/api/documents.api";

export type DocumentRelations = {
  parent?: { id: number; title: string; barcode?: string } | null;
  related?: Array<{ id: number; title: string; barcode?: string; relation_type?: string; notes?: string }>;
};

/**
 * Relations state and add-relation / set-parent handlers for document detail.
 */
export function useDocumentRelations(docId: number | null, activeTab: string) {
  const { t } = useTranslation();
  const [relations, setRelations] = useState<DocumentRelations>({});
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [modalAddRelation, setModalAddRelation] = useState(false);
  const [relatedDocId, setRelatedDocId] = useState("");
  const [relationNotes, setRelationNotes] = useState("");
  const [addingRelation, setAddingRelation] = useState(false);

  useEffect(() => {
    if (!docId || activeTab !== "relations") return;
    setLoadingRelations(true);
    documentsApi
      .getRelations(docId)
      .then((r) => {
        const data = (r as { data?: DocumentRelations }).data;
        setRelations(data ?? {});
      })
      .catch(() => setRelations({}))
      .finally(() => setLoadingRelations(false));
  }, [docId, activeTab]);

  const handleAddRelationSubmit = useCallback(async () => {
    if (!docId || !relatedDocId.trim()) return;
    const relatedId = parseInt(relatedDocId.trim(), 10);
    if (!Number.isFinite(relatedId)) return;
    setAddingRelation(true);
    try {
      await documentsApi.addRelation(docId, {
        related_document_id: relatedId,
        notes: relationNotes.trim() || undefined,
      });
      toast.success(t("documents.relationAdded", { defaultValue: "Relation added." }));
      setModalAddRelation(false);
      setRelatedDocId("");
      setRelationNotes("");
      const r = await documentsApi.getRelations(docId);
      const data = (r as { data?: DocumentRelations }).data;
      setRelations(data ?? {});
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.relationAddFailed", { defaultValue: "Failed to add relation." })
      );
    } finally {
      setAddingRelation(false);
    }
  }, [docId, relatedDocId, relationNotes, t]);

  const handleSetParent = useCallback(
    async (parentId: number | null) => {
      if (!docId) return;
      try {
        await documentsApi.setParent(docId, parentId);
        toast.success(t("documents.parentUpdated", { defaultValue: "Parent updated." }));
        const r = await documentsApi.getRelations(docId);
        const data = (r as { data?: DocumentRelations }).data;
        setRelations(data ?? {});
      } catch (e) {
        toast.error(
          (e as Error)?.message ?? t("documents.parentUpdateFailed", { defaultValue: "Failed to update parent." })
        );
      }
    },
    [docId, t]
  );

  return {
    relations,
    loadingRelations,
    modalAddRelation,
    setModalAddRelation,
    relatedDocId,
    setRelatedDocId,
    relationNotes,
    setRelationNotes,
    addingRelation,
    handleAddRelationSubmit,
    handleSetParent,
  };
}
