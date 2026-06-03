import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { documentsApi } from '@/app/adapter/api/documents.api';
import type { Document } from '@/app/adapter/api/documents.api';
import { all_routes } from '@/router/all_routes';
import { isAuthenticated } from '@/shared/utils/storage';
import {
  asExpiryReminderDocument,
  buildExpiryReminderDismissKey,
  daysUntilExpiry,
  filterDueExpiryReminders,
  getExpiryReminderDocumentLabel,
} from '@/shared/utils/documents/expiryReminder';
import {
  DISMISSED_EXPIRY_REMINDERS_KEY,
  useDocumentExpiryReminderStore,
} from '@/shared/stores/documentExpiryReminderStore';

const GROUPED_EXPIRY_REMINDER_TOAST_ID = 'grouped-expiry-reminder-toast';
const REMINDER_FETCH_PAGE_SIZE = 200;

/** Fetches all active documents across paginated list API for reminder evaluation. */
async function fetchAllActiveDocumentsForReminders(): Promise<Document[]> {
  const all: Document[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await documentsApi.getDocuments({
      status: 'active',
      page,
      per_page: REMINDER_FETCH_PAGE_SIZE,
    });
    all.push(...(response.data ?? []));
    totalPages = response.pagination?.total_pages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

interface GroupedExpiryReminderToastContentProps {
  documents: ReturnType<typeof asExpiryReminderDocument>[];
  onViewDocument: (documentId: number) => void;
  onDismiss: () => void;
}

/** Body for the grouped persistent expiry reminder toast. */
function GroupedExpiryReminderToastContent({
  documents,
  onViewDocument,
  onDismiss,
}: GroupedExpiryReminderToastContentProps) {
  const { t } = useTranslation();
  const preview = documents.slice(0, 5);
  const remaining = documents.length - preview.length;

  return (
    <div className="d-flex flex-column gap-2">
      <strong>{t('documents.expiryReminderToastTitle', { defaultValue: 'Document expiry reminders' })}</strong>
      <p className="mb-0 small">
        {t('documents.expiryReminderToastSummary', {
          defaultValue: '{{count}} document(s) are approaching or past expiry.',
          count: documents.length,
        })}
      </p>
      <ul className="mb-0 ps-3 small">
        {preview.map((doc) => {
          const days = daysUntilExpiry(doc.expiry_date);
          const dayLabel =
            days == null
              ? ''
              : days < 0
                ? t('documents.expiryReminderOverdueDays', { defaultValue: '{{count}} day(s) overdue', count: Math.abs(days) })
                : days === 0
                  ? t('documents.expiryReminderDueToday', { defaultValue: 'Expires today' })
                  : t('documents.expiryReminderDaysLeft', { defaultValue: '{{count}} day(s) left', count: days });
          return (
            <li key={doc.id}>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-start"
                onClick={() => onViewDocument(doc.id)}
              >
                {getExpiryReminderDocumentLabel(doc)}
              </button>
              {dayLabel ? <span className="text-muted ms-1">({dayLabel})</span> : null}
            </li>
          );
        })}
      </ul>
      {remaining > 0 && (
        <p className="mb-0 small text-muted">
          {t('documents.expiryReminderAndMore', { defaultValue: 'and {{count}} more…', count: remaining })}
        </p>
      )}
      <div className="d-flex gap-2 flex-wrap">
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => onViewDocument(documents[0].id)}>
          {t('documents.expiryReminderViewFirst', { defaultValue: 'View first' })}
        </button>
        <button type="button" className="btn btn-sm btn-link text-white" onClick={onDismiss}>
          {t('documents.expiryReminderDismiss', { defaultValue: 'Dismiss' })}
        </button>
      </div>
    </div>
  );
}

/**
 * Authenticated app-level provider: evaluates due expiry reminders and shows one grouped persistent toast.
 * Survives reload/new tab until the user closes the toast; dismissal is stored in localStorage.
 */
export function DocumentExpiryReminderProvider() {
  const navigate = useNavigate();
  const dismissedKeys = useDocumentExpiryReminderStore((s) => s.dismissedKeys);
  const dismissKeys = useDocumentExpiryReminderStore((s) => s.dismissKeys);
  const syncFromStorage = useDocumentExpiryReminderStore((s) => s.syncFromStorage);
  const evaluatingRef = useRef(false);

  const handleViewDocument = useCallback(
    (documentId: number) => {
      navigate(all_routes.documentDetail.replace(':id', String(documentId)));
    },
    [navigate]
  );

  const handleDismiss = useCallback(
    (keys: string[]) => {
      dismissKeys(keys);
      toast.dismiss(GROUPED_EXPIRY_REMINDER_TOAST_ID);
    },
    [dismissKeys]
  );

  /** Loads active documents, filters due undismissed reminders, and renders grouped toast. */
  const evaluateAndShowReminders = useCallback(async () => {
    if (!isAuthenticated() || evaluatingRef.current) return;
    evaluatingRef.current = true;
    try {
      const documents = await fetchAllActiveDocumentsForReminders();
      const due = filterDueExpiryReminders(documents.map(asExpiryReminderDocument));
      const undismissed = due.filter((doc) => !dismissedKeys.includes(buildExpiryReminderDismissKey(doc)));

      if (undismissed.length === 0) {
        toast.dismiss(GROUPED_EXPIRY_REMINDER_TOAST_ID);
        return;
      }

      const dismissKeysForGroup = undismissed.map(buildExpiryReminderDismissKey);

      toast.warning(
        ({ closeToast }) => (
          <GroupedExpiryReminderToastContent
            documents={undismissed}
            onViewDocument={handleViewDocument}
            onDismiss={() => {
              handleDismiss(dismissKeysForGroup);
              closeToast?.();
            }}
          />
        ),
        {
          toastId: GROUPED_EXPIRY_REMINDER_TOAST_ID,
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          onClose: () => handleDismiss(dismissKeysForGroup),
        }
      );
    } catch {
      // Silent fail — reminders are non-blocking.
    } finally {
      evaluatingRef.current = false;
    }
  }, [dismissedKeys, handleDismiss, handleViewDocument]);

  useEffect(() => {
    void evaluateAndShowReminders();
  }, [evaluateAndShowReminders]);

  /** Cross-tab dismissal sync via storage events. */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DISMISSED_EXPIRY_REMINDERS_KEY) return;
      syncFromStorage();
      toast.dismiss(GROUPED_EXPIRY_REMINDER_TOAST_ID);
      void evaluateAndShowReminders();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [evaluateAndShowReminders, syncFromStorage]);

  return null;
}

export { GROUPED_EXPIRY_REMINDER_TOAST_ID };
