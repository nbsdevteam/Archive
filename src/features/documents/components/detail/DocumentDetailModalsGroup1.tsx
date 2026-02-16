import { Button, Modal, ModalFooter, Spinner, ConfirmModal, Icon } from "@/shared/components/ui";
import type { DocumentDetailModalsGroup1Props } from "./DocumentDetailModals";

/** Upload version, request sign, upload signed, add relation + confirm dialogs. */
export function DocumentDetailModalsGroup1(props: DocumentDetailModalsGroup1Props) {
  const { t, data, loading, modals, actions, selection, attachmentTrashModalProps, batchAttachmentTrashModalProps, noteDeleteModalProps } = props;

  const handleCloseUploadVersionModal = () => actions.setModalUploadVersion(false);
  const handleUploadVersionDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => actions.setUploadVersionDescription(e.target.value);
  const handleUploadVersionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => actions.setUploadVersionFile(e.target.files?.[0] ?? null);

  const handleCloseRequestSignModal = () => actions.setModalRequestSign(false);
  const handleSelectedSignerChange = (e: React.ChangeEvent<HTMLSelectElement>) => actions.setSelectedSignerId(e.target.value ? Number(e.target.value) : "");
  const handleSignMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => actions.setSignMessage(e.target.value);

  const handleCloseUploadSignedModal = () => actions.setModalUploadSigned(false);
  const handleSelectedApprovedReqChange = (e: React.ChangeEvent<HTMLSelectElement>) => actions.setSelectedApprovedReqId(e.target.value ? Number(e.target.value) : null);
  const handleSignTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => actions.setSignToken(e.target.value);
  const handleSignedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => actions.setSignedFile(e.target.files?.[0] ?? null);

  const handleCloseAddRelationModal = () => actions.setModalAddRelation(false);
  const handleRelatedDocIdChange = (e: React.ChangeEvent<HTMLInputElement>) => actions.setRelatedDocId(e.target.value);
  const handleRelationNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => actions.setRelationNotes(e.target.value);

  return (
    <>
      <Modal isOpen={modals.modalUploadVersion} onClose={handleCloseUploadVersionModal} title={t("documents.uploadNewVersion", { defaultValue: "Upload new version" })} size="md">
        <div className="mb-3">
          <label className="form-label">{t("documents.changeDescription", { defaultValue: "Change description" })}</label>
          <input type="text" className="form-control" value={modals.uploadVersionDescription} onChange={handleUploadVersionDescriptionChange} placeholder={t("documents.changeDescriptionPlaceholder", { defaultValue: "Optional" })} />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.file", { defaultValue: "File" })} *</label>
          <div className="d-flex gap-2 align-items-center">
            <input ref={modals.uploadVersionInputRef} type="file" className="form-control" onChange={handleUploadVersionFileChange} />
            {modals.uploadVersionFile && (
              <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleClearUploadVersionFile}>
                <Icon name="x" className="me-1" />
                {t("common.remove", { defaultValue: "Remove" })}
              </Button>
            )}
          </div>
          {modals.uploadVersionFile && <small className="text-muted d-block mt-1">{modals.uploadVersionFile.name}</small>}
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={handleCloseUploadVersionModal}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="secondary" disabled={!modals.uploadVersionFile || loading.uploadingVersion} onClick={actions.handleUploadVersionSubmit}>
            {loading.uploadingVersion ? <Spinner /> : t("documents.upload", { defaultValue: "Upload" })}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modals.modalRequestSign} onClose={handleCloseRequestSignModal} title={t("documents.requestSignature", { defaultValue: "Request signature" })} size="md">
        <div className="mb-3">
          <label className="form-label">{t("documents.selectManager", { defaultValue: "Select manager" })}</label>
          <select className="form-select" value={String(modals.selectedSignerId)} onChange={handleSelectedSignerChange}>
            <option value="">{t("common.select", { defaultValue: "Select…" })}</option>
            {data.managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name} {m.login ? `(${m.login})` : ""}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.notesOptional", { defaultValue: "Notes (optional)" })}</label>
          <textarea className="form-control" rows={3} value={modals.signMessage} onChange={handleSignMessageChange} />
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={handleCloseRequestSignModal}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="secondary" disabled={!modals.selectedSignerId} onClick={actions.handleCreateSignatureRequest}>{t("documents.send", { defaultValue: "Send" })}</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modals.modalUploadSigned} onClose={handleCloseUploadSignedModal} title={t("documents.uploadSignedVersion", { defaultValue: "Upload signed version" })} size="md">
        <div className="mb-3">
          <label className="form-label">{t("documents.selectApprovedRequest", { defaultValue: "Select approved request" })}</label>
          <select className="form-select" value={modals.selectedApprovedReqId ?? ""} onChange={handleSelectedApprovedReqChange}>
            <option value="">{t("common.select", { defaultValue: "Select…" })}</option>
            {data.approvedRequests.map((r: { id: number; signer_name?: string }) => (
              <option key={r.id} value={r.id}>#{r.id} • {r.signer_name ?? "–"}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.signToken", { defaultValue: "Sign token" })}</label>
          <input type="text" className="form-control" value={modals.signToken} onChange={handleSignTokenChange} placeholder={t("documents.signTokenPlaceholder", { defaultValue: "Enter token from approval email" })} />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.selectSignedFile", { defaultValue: "Signed file" })}</label>
          <div className="d-flex gap-2 align-items-center">
            <input ref={modals.signedFileInputRef} type="file" className="form-control" onChange={handleSignedFileChange} />
            {modals.signedFile && (
              <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleClearSignedFile}>
                <Icon name="x" className="me-1" />
                {t("common.remove", { defaultValue: "Remove" })}
              </Button>
            )}
          </div>
          {modals.signedFile && <small className="text-muted d-block mt-1">{modals.signedFile.name}</small>}
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={handleCloseUploadSignedModal}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="secondary" disabled={!modals.selectedApprovedReqId || !modals.signedFile || !modals.signToken.trim() || loading.uploadingSigned} onClick={actions.handleUploadSignedSubmit}>
            {loading.uploadingSigned ? <Spinner /> : t("documents.upload", { defaultValue: "Upload" })}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modals.modalAddRelation} onClose={handleCloseAddRelationModal} title={t("documents.addRelation", { defaultValue: "Add relation" })} size="md">
        <div className="mb-3">
          <label className="form-label">{t("documents.relatedDocumentId", { defaultValue: "Related document ID" })} *</label>
          <input type="number" className="form-control" value={modals.relatedDocId} onChange={handleRelatedDocIdChange} placeholder={t("documents.relatedDocumentIdPlaceholder", { defaultValue: "Document ID" })} />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.notesOptional", { defaultValue: "Notes (optional)" })}</label>
          <textarea className="form-control" rows={2} value={modals.relationNotes} onChange={handleRelationNotesChange} />
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={handleCloseAddRelationModal}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="secondary" disabled={!modals.relatedDocId.trim() || loading.addingRelation} onClick={actions.handleAddRelationSubmit}>
            {loading.addingRelation ? <Spinner /> : t("common.add", { defaultValue: "Add" })}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal {...attachmentTrashModalProps} title={t("documents.deleteAttachment", { defaultValue: "Delete" })} message={t("documents.confirmDeleteAttachment", { defaultValue: "Are you sure you want to delete this attachment? This cannot be undone." })} confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })} cancelLabel={t("common.cancel", { defaultValue: "Cancel" })} confirmVariant="danger" />
      <ConfirmModal {...batchAttachmentTrashModalProps} title={t("documents.deleteSelectedAttachments", { defaultValue: "Delete selected" })} message={t("documents.confirmBatchDeleteAttachments", { defaultValue: "Delete {{count}} attachment(s)? This cannot be undone.", count: selection.attachmentSelectedIds.length })} confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })} cancelLabel={t("common.cancel", { defaultValue: "Cancel" })} confirmVariant="danger" />
      <ConfirmModal {...noteDeleteModalProps} title={t("notes.deleteNote", { defaultValue: "Delete note" })} message={t("notes.confirmDelete", { defaultValue: "Are you sure you want to delete this note? This action cannot be undone." })} confirmLabel={t("common.delete", { defaultValue: "Delete" })} cancelLabel={t("common.cancel", { defaultValue: "Cancel" })} confirmVariant="danger" />
    </>
  );
}
