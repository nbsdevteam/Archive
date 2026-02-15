import { useCallback } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import { Alert, Button, Icon, Spinner } from "@/shared/components/ui";
import { PageLayout } from "@/shared/layout/PageLayout";
import type { ActivityViewMode } from "@/features/activity/types";
import { useFolderDetailPageContainer } from "@/features/folders/containers/useFolderDetailPageContainer";
import { useFolderDetailDialogs } from "@/features/folders/hooks/useFolderDetailDialogs";
import { FolderDetailInfoSection } from "./FolderDetailInfoSection";
import { FolderDetailMainDocSection } from "./FolderDetailMainDocSection";
import { FolderDetailSubDocsSection } from "./FolderDetailSubDocsSection";
import { FolderDetailAttachmentsSection } from "./FolderDetailAttachmentsSection";
import { FolderDetailNotesSection } from "./FolderDetailNotesSection";
import { FolderDetailPreviewSection } from "./FolderDetailPreviewSection";
import { FolderDetailActivitySection } from "./FolderDetailActivitySection";
import { FolderDetailModals } from "./FolderDetailModals";
import { AttachmentSidePanel } from "@/features/documents/components";
import { EditDocumentSidePanel } from "@/features/documents/components/EditDocument";

/** Folder detail page: guards, layout, and composition of info, main doc, sub-docs, attachments, notes, preview, activity, and modals. */
const FolderDetailPage = () => {
  const { t, routes, data, loadingState, errors, activity, selection, actions, modals } =
    useFolderDetailPageContainer();
  const {
    deleteFolderDialog,
    subDocTrashDialog,
    batchSubDocTrashDialog,
    attachmentTrashDialog,
    batchAttachmentTrashDialog,
    noteDeleteDialog,
  } = useFolderDetailDialogs({
    confirmDeleteFolder: actions.confirmDeleteFolder,
    confirmSubDocTrash: actions.confirmSubDocTrash,
    confirmBatchSubDocTrash: actions.confirmBatchSubDocTrash,
    confirmAttachmentTrash: actions.confirmAttachmentTrash,
    confirmBatchAttachmentTrash: actions.confirmBatchAttachmentTrash,
    confirmDeleteNote: actions.confirmDeleteNote,
  });

  const handleActivityRefresh = useCallback(() => void activity.refreshActivityLogs(), [activity.refreshActivityLogs]);
  const handleActivityViewModeChange = useCallback((nextMode: ActivityViewMode) => activity.setActivityViewMode(nextMode), [activity.setActivityViewMode]);

  if (!data.folderId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger">{t("errors.invalidId", { defaultValue: "Invalid folder id" })}</Alert>
        </div>
      </div>
    );
  }

  if (loadingState.loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-center min-vh-50">
            <Spinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  if (!data.folder) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="warning">{t("errors.notFound", { defaultValue: "Not found." })}</Alert>
          <Link to={routes.folders} className="btn btn-secondary mt-2">
            {t("common.back", { defaultValue: "Back" })}
          </Link>
        </div>
      </div>
    );
  }

  const pageTitle = data.folder.name || `Folder #${data.folderId}`;

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[{ label: t("folders.title", { defaultValue: "Folders" }), to: routes.folders }]}
      homeTo={routes.adminDashboard}
      rightContent={
        <>
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleUploadInFolder} data-testid="upload-in-folder-btn">
            <Icon name="upload" className="me-1" />
            {t("folders.uploadInFolder", { defaultValue: "Upload in folder" })}
          </Button>
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleOpenEditFolder}>
            <Icon name="edit" className="me-1" />
            {t("folders.editFolder", { defaultValue: "Edit folder" })}
          </Button>
          <Button variant="outline" size="sm" className="btn-outline-danger" onClick={deleteFolderDialog.open} aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}>
            <Icon name="trash" className="me-1" />
            {t("folders.deleteFolder", { defaultValue: "Delete folder" })}
          </Button>
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.loadFolderDocuments}>
            <Icon name="refresh-cw" className="me-1" />
            {t("common.refresh", { defaultValue: "Refresh" })}
          </Button>
          <CollapseHeader />
        </>
      }
    >
      {errors.main && (
        <Alert variant="danger" className="mb-3">
          {errors.main}
          <Button variant="outline" size="sm" className="ms-2 btn-outline-secondary" onClick={actions.loadFolderDocuments}>
            {t("common.retry", { defaultValue: "Retry" })}
          </Button>
        </Alert>
      )}

      <FolderDetailInfoSection t={t} folder={data.folder} folderId={data.folderId} documentCount={data.documents.length} />

      <FolderDetailMainDocSection
        t={t}
        mainDoc={data.mainDoc}
        formatDate={actions.formatDate}
        onDownload={actions.handleDownloadMainDocument}
        onNavigate={actions.handleNavigateToDocument}
        onEdit={actions.handleOpenEditDocument}
        onArchive={actions.handleArchiveFolderDocument}
        onUnarchive={actions.handleUnarchiveFolderDocument}
        isArchiving={loadingState.isSubDocArchiving}
        isUnarchiving={loadingState.isSubDocUnarchiving}
      />

      <FolderDetailSubDocsSection
        t={t}
        subDocs={data.subDocs}
        selectionConfig={selection.subDocsSelectionConfig}
        formatDate={actions.formatDate}
        onNavigate={actions.handleNavigateToDocument}
        onDownload={actions.handleDownloadDocument}
        onEdit={actions.handleOpenEditDocument}
        onTransfer={actions.openTransferDocs}
        onArchive={actions.handleArchiveFolderDocument}
        onUnarchive={actions.handleUnarchiveFolderDocument}
        onTrash={(id) => subDocTrashDialog.open(id)}
        onClearSelection={actions.clearSubDocsSelection}
        onBatchTrash={batchSubDocTrashDialog.open}
        transferSubmitting={loadingState.transferSubmitting}
        isSubDocTrashing={loadingState.isSubDocTrashing}
        isSubDocArchiving={loadingState.isSubDocArchiving}
        isSubDocUnarchiving={loadingState.isSubDocUnarchiving}
      />

      <FolderDetailAttachmentsSection
        t={t}
        documents={data.documents}
        attachmentsDocId={data.attachmentsDocId}
        attachments={data.attachments}
        loadingAttachments={loadingState.loadingAttachments}
        selectionConfig={selection.attachmentsSelectionConfig}
        onAttachmentsDocIdChange={actions.handleAttachmentsDocIdChange}
        onAddAttachment={actions.openAddAttachmentPanel}
        onViewAttachment={actions.handleViewAttachment}
        onDownloadAttachment={actions.handleDownloadAttachment}
        onEditAttachment={actions.handleOpenEditAttachment}
        onTrashAttachment={(id) => attachmentTrashDialog.open(id)}
        onClearSelection={actions.clearAttachmentsSelection}
        onBatchTrash={batchAttachmentTrashDialog.open}
        isAttachmentTrashing={loadingState.isAttachmentTrashing}
      />

      <FolderDetailNotesSection
        t={t}
        notes={data.notes}
        loadingNotes={loadingState.loadingNotes}
        notesError={errors.notesError}
        onLoadNotes={actions.handleLoadNotes}
        onCreateNote={actions.handleCreateNote}
        onEditNote={actions.handleEditNote}
        onDeleteNote={(id) => noteDeleteDialog.open(id)}
        onViewNoteImage={actions.handleViewNoteImage}
      />

      <FolderDetailPreviewSection
        t={t}
        previewDoc={data.previewDoc}
        previewFileName={data.previewFileName}
        onDownload={actions.handleDownloadMainDocument}
      />

      <FolderDetailActivitySection
        t={t}
        logs={activity.activityLogs}
        loading={activity.activityLoading}
        error={activity.activityError}
        viewMode={activity.activityViewMode}
        onViewModeChange={handleActivityViewModeChange}
        documentCount={activity.activityDocumentCount}
        onRefresh={handleActivityRefresh}
        onDocumentClick={actions.handleNavigateToDocument}
      />

      <FolderDetailModals
        t={t}
        data={{ folder: data.folder, folderId: data.folderId, mainDoc: data.mainDoc, managers: data.managers }}
        modals={modals}
        actions={{
          setSignatureOpen: actions.setSignatureOpen,
          setSignatureSignerId: actions.setSignatureSignerId,
          setSignatureMessage: actions.setSignatureMessage,
          submitSignature: actions.submitSignature,
          setEditOpen: actions.setEditOpen,
          setEditReason: actions.setEditReason,
          submitEditRequest: actions.submitEditRequest,
          handleCloseEditFolder: actions.handleCloseEditFolder,
          handleEditFolderSuccess: actions.handleEditFolderSuccess,
          closeTransferModal: actions.closeTransferModal,
          handleTransferConfirm: actions.handleTransferConfirm,
          handleCloseUploadPanel: actions.handleCloseUploadPanel,
          loadFolderDocuments: actions.loadFolderDocuments,
          refreshAttachmentsForCurrentDocument: actions.refreshAttachmentsForCurrentDocument,
          handleCloseEditAttachment: actions.handleCloseEditAttachment,
          setEditAttachmentName: actions.setEditAttachmentName,
          setEditAttachmentDescription: actions.setEditAttachmentDescription,
          handleConfirmEditAttachment: actions.handleConfirmEditAttachment,
          handleCloseNoteEditor: actions.handleCloseNoteEditor,
          handleSaveNote: (payload: unknown) => actions.handleSaveNote(payload as Parameters<typeof actions.handleSaveNote>[0]),
          handleCloseNoteImageViewer: actions.handleCloseNoteImageViewer,
        }}
        loadingState={{ transferSubmitting: loadingState.transferSubmitting, isCreatingNote: loadingState.isCreatingNote, isUpdatingNote: loadingState.isUpdatingNote, isUpdatingAttachment: loadingState.isUpdatingAttachment }}
        selection={{ subDocSelectedIds: selection.subDocSelectedIds, attachmentSelectedIds: selection.attachmentSelectedIds }}
        deleteFolderDialog={deleteFolderDialog}
        subDocTrashDialog={subDocTrashDialog}
        batchSubDocTrashDialog={batchSubDocTrashDialog}
        attachmentTrashDialog={attachmentTrashDialog}
        batchAttachmentTrashDialog={batchAttachmentTrashDialog}
        noteDeleteDialog={noteDeleteDialog}
      />
      {typeof data.attachmentsDocId === "number" && (
        <AttachmentSidePanel
          isOpen={modals.isAttachmentPanelOpen}
          onClose={actions.handleCloseAttachmentPanel}
          editAttachmentId={modals.editAttachmentId}
          editAttachmentName={modals.editAttachmentName}
          editAttachmentDescription={modals.editAttachmentDescription}
          setEditAttachmentName={actions.setEditAttachmentName}
          setEditAttachmentDescription={actions.setEditAttachmentDescription}
          onSaveEdit={actions.handleConfirmEditAttachment}
          isSavingEdit={loadingState.isUpdatingAttachment}
          documentId={data.attachmentsDocId}
          onAddSuccess={() => {
            actions.handleCloseAttachmentPanel();
            actions.refreshAttachmentsForCurrentDocument();
          }}
          t={t}
        />
      )}
      <EditDocumentSidePanel
        isOpen={modals.editDocumentId != null}
        documentId={modals.editDocumentId}
        initialFolderId={data.folderId ?? undefined}
        onClose={actions.handleCloseEditDocument}
        onSuccess={actions.handleEditDocumentSuccess}
      />
    </PageLayout>
  );
};

export default FolderDetailPage;
