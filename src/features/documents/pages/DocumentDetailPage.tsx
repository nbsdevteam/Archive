import { Link } from "react-router-dom";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import { Alert, Button, Spinner, Icon } from "@/shared/components/ui";
import { PageLayout } from "@/shared/layout/PageLayout";
import { UploadDocumentSidePanel } from "@/features/documents/components";
import { useDocumentDetailDialogs } from "@/features/documents/hooks/useDocumentDetailDialogs";
import { DocumentDetailInfoCard, DocumentDetailTabContent, DocumentDetailModals } from "@/features/documents/components/detail";
import { EditDocumentSidePanel } from "@/features/documents/components/EditDocument";
import { useDocumentDetailPageContainer } from "@/features/documents/containers/useDocumentDetailPageContainer";
import "@/features/documents/styles/documents.css";

const DocumentDetailPage = () => {
  const { t, routes, data, loading, error, tabState, selection, actions, modals } = useDocumentDetailPageContainer();
  const { attachmentTrashDialog, batchAttachmentTrashDialog, noteDeleteDialog } = useDocumentDetailDialogs({
    confirmAttachmentTrash: actions.confirmAttachmentTrash,
    confirmBatchAttachmentTrash: actions.confirmBatchAttachmentTrash,
    confirmDeleteNote: actions.confirmDeleteNote,
  });

  if (loading.isLoading && !data.doc) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-center min-vh-50">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  if (!data.docId || !data.doc) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="warning">
            {t("errors.notFound", { defaultValue: "Not found." })}
          </Alert>
          <Link to={routes.documents} className="btn btn-secondary mt-2">
            {t("common.back", { defaultValue: "Back" })}
          </Link>
        </div>
      </div>
    );
  }

  const pageTitle = `${data.title}${data.doc.barcode ? ` (${data.doc.barcode})` : ""}`;

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[{ label: t("documents.title", { defaultValue: "Documents" }), to: routes.documents }]}
      homeTo={routes.adminDashboard}
      rightContent={
        <>
          <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={actions.handleOpenEdit}>
            <Icon name="pencil" className="me-1" />
            {t("common.edit", { defaultValue: "Edit" })}
          </Button>
          {data.isArchived ? (
            <Button variant="secondary" size="sm" onClick={actions.handleUnarchive}>
              <Icon name="archive" className="me-1" />
              {t("documents.unarchive", { defaultValue: "Unarchive" })}
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={actions.handleArchive}>
              <Icon name="archive" className="me-1" />
              {t("documents.archive", { defaultValue: "Archive" })}
            </Button>
          )}
          {data.isTrashed && (
            <Button variant="secondary" size="sm" onClick={actions.handleRestoreDocument} disabled={loading.isRestoring}>
              <Icon name="refresh-cw" className="me-1" />
              {t("documents.restore", { defaultValue: "Restore" })}
            </Button>
          )}
          <CollapseHeader />
        </>
      }
    >
        {error.storeError && (
          <Alert variant="danger" className="mb-3">
            {error.storeError}
          </Alert>
        )}

        <DocumentDetailInfoCard
          t={t}
          doc={data.doc}
          title={data.title}
          documentTypeName={data.documentTypeName}
          departmentName={data.departmentName}
          uploaderName={data.uploaderName}
          isArchived={data.isArchived}
          formatDate={(date) => actions.formatDate(date ?? undefined)}
          tags={data.tags}
        />

        <ul className="nav nav-tabs mb-2">
          {tabState.tabs.map((tab) => (
            <li className="nav-item" key={tab.id}>
              <button
                type="button"
                className={`nav-link ${tabState.activeTab === tab.id ? "active" : ""}`}
                onClick={() => tabState.setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="card">
          <div className="card-body h-min-25vh">
            <DocumentDetailTabContent
              t={t}
              tabState={tabState}
              data={data}
              loading={loading}
              error={error}
              selection={selection}
              actions={actions}
              attachmentTrashDialog={attachmentTrashDialog}
              batchAttachmentTrashDialog={batchAttachmentTrashDialog}
              noteDeleteDialog={noteDeleteDialog}
            />
          </div>
        </div>

      {data.doc && (
        <UploadDocumentSidePanel
          isOpen={modals.isAddAttachmentPanelOpen}
          onClose={() => actions.setIsAddAttachmentPanelOpen(false)}
          onSuccess={() => {
            actions.setIsAddAttachmentPanelOpen(false);
            actions.refreshAttachments();
          }}
          initialValues={{
            upload_kind: "attachment",
            target_document_id: data.doc.id,
          }}
        />
      )}

      <DocumentDetailModals
        t={t}
        data={{ docId: data.docId, doc: data.doc, approvedRequests: data.approvedRequests, managers: data.managers }}
        loading={{
          uploadingVersion: loading.uploadingVersion,
          uploadingSigned: loading.uploadingSigned,
          addingRelation: loading.addingRelation,
          isUpdatingAttachment: loading.isUpdatingAttachment,
          isCreatingNote: loading.isCreatingNote,
          isUpdatingNote: loading.isUpdatingNote,
        }}
        modals={modals}
        actions={actions}
        selection={selection}
        attachmentTrashModalProps={attachmentTrashDialog.modalProps}
        batchAttachmentTrashModalProps={batchAttachmentTrashDialog.modalProps}
        noteDeleteModalProps={noteDeleteDialog.modalProps}
      />
      <EditDocumentSidePanel
        isOpen={modals.editDocumentId != null}
        documentId={modals.editDocumentId}
        onClose={actions.handleCloseEdit}
        onSuccess={actions.handleEditSuccess}
      />
    </PageLayout>
  );
};

export default DocumentDetailPage;