import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { documentsApi } from "@/app/adapter/api/documents.api";
import type { Document } from "@/app/adapter/api/documents.api";
import { EXPIRY_REMINDER_MODAL_SESSION_KEY, isAuthenticated } from "@/shared/utils/storage";
import { useDocumentExpiryReminderStore } from "@/shared/stores/documentExpiryReminderStore";
import {
  asExpiryReminderDocument,
  daysUntilExpiry,
  filterDueExpiryReminders,
  getExpiryReminderDocumentLabel,
} from "@/shared/utils/documents/expiryReminder";
import { formatDate } from "@/shared/utils/format/date";
import { Button, Modal, ModalFooter } from "@/shared/components/ui";

const REMINDER_FETCH_PAGE_SIZE = 200;
const REMINDER_POLL_INTERVAL_MS = 60_000;

/** Fetches all active documents across paginated list API for reminder evaluation. */
async function fetchAllActiveDocumentsForReminders(): Promise<Document[]> {
  const all: Document[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await documentsApi.getDocuments({
      status: "active",
      page,
      per_page: REMINDER_FETCH_PAGE_SIZE,
    });
    all.push(...(response.data ?? []));
    totalPages = response.pagination?.total_pages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

function isReminderModalDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(EXPIRY_REMINDER_MODAL_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function markReminderModalDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(EXPIRY_REMINDER_MODAL_SESSION_KEY, "true");
  } catch {
    // Ignore storage write failures.
  }
}

/** Persistent marquee bar just below the header. */
export function DocumentExpiryReminderMarquee() {
  const { t } = useTranslation();
  const dueDocuments = useDocumentExpiryReminderStore((s) => s.dueDocuments);

  const message = useMemo(() => {
    if (dueDocuments.length === 0) return "";
    return dueDocuments
      .map((doc) => {
        const name = getExpiryReminderDocumentLabel(doc);
        const expiry = doc.expiry_date ?? "—";
        const remaining = daysUntilExpiry(doc.expiry_date);
        const suffix =
          remaining == null
            ? ""
            : remaining < 0
              ? t("documents.expiryReminderOverdueDays", {
                  defaultValue: "{{count}} day(s) overdue",
                  count: Math.abs(remaining),
                })
              : remaining === 0
                ? t("documents.expiryReminderDueToday", { defaultValue: "Expires today" })
                : t("documents.expiryReminderDaysLeft", {
                    defaultValue: "{{count}} day(s) left",
                    count: remaining,
                  });
        return `${name} (${expiry})${suffix ? ` — ${suffix}` : ""}`;
      })
      .join(" • ");
  }, [dueDocuments, t]);

  if (!message) return null;

  return (
    <div className="expiry-reminder-marquee" role="status" aria-live="polite">
      <div className="expiry-reminder-marquee__track">
        <span>{message}</span>
        <span aria-hidden>{message}</span>
      </div>
    </div>
  );
}

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
}

function DocumentExpiryReminderModal({ isOpen, onClose, documents }: ReminderModalProps) {
  const { t } = useTranslation();

  if (!isOpen || documents.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={t("documents.expiryReminderModalTitle", { defaultValue: "Expiring documents" })}
    >
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>{t("documents.name", { defaultValue: "Name" })}</th>
              <th>{t("documents.barcode", { defaultValue: "Barcode" })}</th>
              <th>{t("documents.documentType", { defaultValue: "Document type" })}</th>
              <th>{t("documents.department", { defaultValue: "Department" })}</th>
              <th>{t("documents.expiryDate", { defaultValue: "Expiry date" })}</th>
              <th>{t("documents.reminderDays", { defaultValue: "Reminder (days before expiry)" })}</th>
              <th>{t("documents.uploadDate", { defaultValue: "Upload date" })}</th>
              <th>{t("documents.uploadVersion", { defaultValue: "Upload version" })}</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.title ?? doc.name ?? "—"}</td>
                <td>{doc.barcode ?? "—"}</td>
                <td>{doc.document_type_name ?? doc.document_type?.name ?? "—"}</td>
                <td>{doc.department_name ?? doc.department?.name ?? "—"}</td>
                <td>{doc.expiry_date ?? "—"}</td>
                <td>{doc.reminder_days ?? "—"}</td>
                <td>{formatDate(doc.upload_date)}</td>
                <td>{doc.document_upload_version == null ? "—" : doc.document_upload_version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          {t("common.close", { defaultValue: "Close" })}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/**
 * App-level controller: computes due documents, updates the store,
 * and opens the login-only modal once per session.
 */
export function DocumentExpiryReminderProvider() {
  const dueDocuments = useDocumentExpiryReminderStore((s) => s.dueDocuments);
  const setDueDocuments = useDocumentExpiryReminderStore((s) => s.setDueDocuments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const evaluatingRef = useRef(false);

  const refreshReminders = useCallback(async () => {
    if (!isAuthenticated() || evaluatingRef.current) return;
    evaluatingRef.current = true;
    try {
      const documents = await fetchAllActiveDocumentsForReminders();
      const due = filterDueExpiryReminders(documents.map(asExpiryReminderDocument));
      const dueIds = new Set(due.map((doc) => doc.id));
      const dueFullDocs = documents.filter((doc) => dueIds.has(doc.id));
      setDueDocuments(dueFullDocs);
      if (dueFullDocs.length > 0 && !isReminderModalDismissed()) {
        setIsModalOpen(true);
      }
    } catch {
      setDueDocuments([]);
    } finally {
      evaluatingRef.current = false;
    }
  }, [setDueDocuments]);

  useEffect(() => {
    void refreshReminders();
    const intervalId = window.setInterval(() => {
      void refreshReminders();
    }, REMINDER_POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [refreshReminders]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    markReminderModalDismissed();
  }, []);

  return (
    <DocumentExpiryReminderModal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      documents={dueDocuments}
    />
  );
}

