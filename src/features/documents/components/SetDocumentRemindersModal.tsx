import { useCallback, useState } from 'react';
import type { TFunction } from 'i18next';
import { useForm } from 'react-hook-form';
import { Button, DateField, Input, Modal, ModalFooter } from '@/shared/components/ui';
import { documentsApi } from '@/app/adapter/api/documents.api';
import { invalidateDocumentData } from '@/shared/lib/queryInvalidation';
import { toCanonicalDdMmYyyy } from '@/shared/utils/documents/documentDate';

export type SetRemindersScope = 'selected' | 'all';

export interface SetDocumentRemindersFormValues {
  reminder_days: number;
  expiry_date: string;
}

export interface SetDocumentRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: number) => void;
  scope: SetRemindersScope;
  selectedDocumentIds: number[];
  t: TFunction;
}

/** Dedicated modal to bulk-set reminder_days (and optional shared expiry) via POST /api/documents/set-reminders. */
export function SetDocumentRemindersModal({
  isOpen,
  onClose,
  onSuccess,
  scope,
  selectedDocumentIds,
  t,
}: SetDocumentRemindersModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<SetDocumentRemindersFormValues>({
    defaultValues: { reminder_days: 7, expiry_date: '' },
  });

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    reset({ reminder_days: 7, expiry_date: '' });
    setSubmitError(null);
    onClose();
  }, [isSubmitting, onClose, reset]);

  const onSubmit = useCallback(
    async (values: SetDocumentRemindersFormValues) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const reminderDays = Math.max(0, Math.floor(Number(values.reminder_days)));
        const expiryCanon = values.expiry_date?.trim() ? toCanonicalDdMmYyyy(values.expiry_date) : '';
        const payload =
          scope === 'all'
            ? { reminder_days: reminderDays }
            : {
                reminder_days: reminderDays,
                document_ids: selectedDocumentIds,
                ...(expiryCanon ? { expiry_date: expiryCanon } : {}),
              };
        const result = await documentsApi.setDocumentReminders(payload);
        void invalidateDocumentData();
        onSuccess?.(result.updated ?? selectedDocumentIds.length);
        handleClose();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : t('common.unexpectedError'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleClose, onSuccess, scope, selectedDocumentIds, t]
  );

  const title =
    scope === 'all'
      ? t('documents.setRemindersAllTitle', { defaultValue: 'Set reminders for all active documents' })
      : t('documents.setRemindersSelectedTitle', {
          defaultValue: 'Set reminders for selected documents',
          count: selectedDocumentIds.length,
        });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md" data-testid="set-document-reminders-modal">
      {submitError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {submitError}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)();
        }}
        className="d-flex flex-column gap-3"
      >
        <p className="text-muted small mb-0">
          {scope === 'all'
            ? t('documents.setRemindersAllHint', {
                defaultValue: 'Applies the reminder window to every active document in the archive.',
              })
            : t('documents.setRemindersSelectedHint', {
                defaultValue: 'Applies reminder days to {{count}} selected document(s). Optionally set the same expiry date on all selected.',
                count: selectedDocumentIds.length,
              })}
        </p>
        <Input
          type="number"
          min={0}
          step={1}
          label={t('documents.reminderDays', { defaultValue: 'Reminder (days before)' })}
          required
          {...register('reminder_days', { valueAsNumber: true, required: true, min: 0 })}
          error={errors.reminder_days?.message as string | undefined}
          data-testid="set-reminders-days-input"
        />
        {scope === 'selected' && (
          <DateField
            control={control}
            name="expiry_date"
            label={t('documents.expiryDateOptionalShared', { defaultValue: 'Shared expiry date (optional)' })}
            helperText={t('documents.expiryDateOptionalSharedHint', {
              defaultValue: 'When set, the same expiry is applied to all selected documents.',
            })}
            error={errors.expiry_date?.message as string | undefined}
          />
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} data-testid="set-reminders-submit">
            {t('documents.setRemindersSubmit', { defaultValue: 'Apply reminders' })}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
