import { create } from "zustand";
import type { Document } from "@/app/adapter/api/documents.api";

interface DocumentExpiryReminderState {
  dueDocuments: Document[];
  setDueDocuments: (docs: Document[]) => void;
}

/** Holds documents that are due for expiry reminders. */
export const useDocumentExpiryReminderStore = create<DocumentExpiryReminderState>((set) => ({
  dueDocuments: [],
  setDueDocuments: (docs) => set({ dueDocuments: docs }),
}));
