import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightLeft } from "lucide-react";
import { Button, Modal, ModalFooter, Spinner } from "../../../shared/components/ui";
import { listFolders } from "../services/folders.api";
import type { Folder } from "../types/folders.types";

export interface TransferToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number;
  title: string;
  subtitle?: string;
  excludeFolderId?: number;
  onConfirm: (folderId: number) => void | Promise<void>;
  /** When true, confirm button shows spinner and is disabled. */
  isSubmitting?: boolean;
}

/**
 * Modal to pick a destination folder for transfer. Lists folders for the given department
 * and excludes the current folder. Same-department enforcement is done by the caller.
 */
export function TransferToFolderModal({
  isOpen,
  onClose,
  departmentId,
  title,
  subtitle,
  excludeFolderId,
  onConfirm,
  isSubmitting = false,
}: TransferToFolderModalProps) {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || departmentId <= 0) {
      setFolders([]);
      setSelectedFolderId("");
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    listFolders({ department_id: departmentId })
      .then((res) => {
        const list = res.folders ?? [];
        const filtered = list.filter(
          (f) => f.department_id === departmentId && f.id !== excludeFolderId
        );
        setFolders(filtered);
        setSelectedFolderId("");
      })
      .catch((e) => setError((e as Error).message ?? "Failed to load folders"))
      .finally(() => setLoading(false));
  }, [isOpen, departmentId, excludeFolderId]);

  const handleConfirm = () => {
    const id = Number(selectedFolderId);
    if (!Number.isFinite(id)) return;
    void Promise.resolve(onConfirm(id));
  };

  const canConfirm = Number.isFinite(Number(selectedFolderId)) && !isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      {subtitle && <p className="text-muted small mb-3">{subtitle}</p>}
      {loading ? (
        <div className="py-3 text-center">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <p className="text-danger small mb-0">{error}</p>
      ) : (
        <div className="mb-3">
          <label className="form-label">
            {t("folders.selectDestinationFolder", { defaultValue: "Select destination folder" })}
          </label>
          <select
            className="form-select"
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            aria-label={t("folders.selectDestinationFolder", { defaultValue: "Destination folder" })}
            data-testid="transfer-folder-select"
          >
            <option value="">— {t("folders.selectDestinationFolder", { defaultValue: "Select folder" })} —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name ?? `Folder #${f.id}`}
                {f.code ? ` (${f.code})` : ""}
              </option>
            ))}
          </select>
          {folders.length === 0 && !loading && (
            <p className="text-muted small mt-2 mb-0">
              {t("folders.noOtherFoldersInDepartment", { defaultValue: "No other folders in this department." })}
            </p>
          )}
        </div>
      )}
      {/* Use shared modal footer spacing (align with ConfirmModal). */}
      <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
        <Button variant="outline" className="btn-outline-secondary" onClick={onClose}>
          {t("common.cancel", { defaultValue: "Cancel" })}
        </Button>
        <Button
          variant="secondary"
          disabled={!canConfirm}
          onClick={handleConfirm}
          data-testid="transfer-confirm-btn"
        >
          {isSubmitting ? (
            <Spinner size="sm" />
          ) : (
            <>
              <ArrowRightLeft className="me-1" style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} />
              {t("folders.transfer", { defaultValue: "Transfer" })}
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
