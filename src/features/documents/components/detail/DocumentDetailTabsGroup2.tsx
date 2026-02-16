import { Link } from "react-router-dom";
import { Button, Spinner, Icon } from "@/shared/components/ui";
import { AuditActivityPanel } from "@/shared/components/Activity";
import { NotesList } from "@/features/notes/components";
import type { ActivityViewMode } from "@/features/activity/types/auditLogs.types";
import type { DocumentDetailTabContentProps } from "./DocumentDetailTabContent";

/** Renders notes, ocr, signatures, relations, and audit tabs for document detail. */
export function DocumentDetailTabsGroup2(props: DocumentDetailTabContentProps) {
  const { t, tabState, data, loading, error, actions, noteDeleteDialog } = props;

  const handleOpenRequestSignModal = () => actions.setModalRequestSign(true);
  const handleOpenUploadSignedModal = () => actions.setModalUploadSigned(true);
  const handleOpenAddRelationModal = () => actions.setModalAddRelation(true);
  const handleClearParentClick = () => actions.handleSetParent(null);

  if (!["notes", "ocr", "signatures", "relations", "audit"].includes(tabState.activeTab)) return null;

  return (
    <>
      {tabState.activeTab === "notes" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{t("documents.notes", { defaultValue: "Notes" })}</span>
            <Button variant="secondary" size="sm" onClick={actions.handleCreateNote}>
              <Icon name="folder-plus" className="me-1" />
              {t("notes.createNote", { defaultValue: "Create note" })}
            </Button>
          </div>
          <NotesList
            notes={data.notes as Parameters<typeof NotesList>[0]["notes"]}
            loading={loading.loadingNotes}
            error={error.notesError ?? undefined}
            onEdit={actions.handleEditNote}
            onDelete={(note: { id: number }) => noteDeleteDialog.open(note.id)}
            onViewImage={actions.handleViewNoteImage}
            showDocument={false}
            showFolder={true as boolean}
            emptyMessage={t("notes.noNotesForDocument", { defaultValue: "No notes found for this document." })}
          />
        </div>
      )}

      {tabState.activeTab === "ocr" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span>
              {t("documents.ocrStatus", { defaultValue: "OCR status" })}: {data.ocrStatus}
            </span>
            {data.isOcrSupported && (
              <Button variant="secondary" size="sm" disabled={loading.runOcrLoading || data.ocrStatus === "processing"} onClick={actions.handleRunOcr}>
                {loading.runOcrLoading ? <Spinner /> : t("documents.runOcr", { defaultValue: "Run OCR" })}
              </Button>
            )}
          </div>
          {data.isOcrSupported ? (
            <div className="border rounded p-3 bg-light">
              <pre className="mb-0 small text-break" style={{ whiteSpace: "pre-wrap" }}>
                {(data.ocr as { extracted_text_preview?: string }).extracted_text_preview ||
                  (data.ocrStatus === "processing"
                    ? t("documents.ocrProcessing", { defaultValue: "Processing…" })
                    : t("documents.ocrNoText", { defaultValue: "No extracted text yet." }))}
              </pre>
            </div>
          ) : (
            <p className="text-muted">
              {t("documents.ocrNotSupported", { defaultValue: "OCR not supported for this file type ({{fileName}}).", fileName: data.fileName || "–" })}
            </p>
          )}
        </div>
      )}

      {tabState.activeTab === "signatures" && (
        <div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {data.canRequestSignature && (
              <Button variant="secondary" size="sm" onClick={handleOpenRequestSignModal}>
                {t("documents.requestSignature", { defaultValue: "Request signature" })}
              </Button>
            )}
            {data.canRequestSignature && data.approvedRequests.length > 0 && (
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleOpenUploadSignedModal}>
                <Icon name="file-up" className="me-1" />
                {t("documents.uploadSignedVersion", { defaultValue: "Upload signed version" })}
              </Button>
            )}
          </div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>{t("documents.status", { defaultValue: "Status" })}</th>
                  <th>{t("documents.signer", { defaultValue: "Signer" })}</th>
                  <th>{t("documents.requestDate", { defaultValue: "Request date" })}</th>
                </tr>
              </thead>
              <tbody>
                {data.signatureRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.state ?? "–"}</td>
                    <td>{r.signer_name ?? "–"}</td>
                    <td>{actions.formatDate(r.request_date ?? undefined)}</td>
                  </tr>
                ))}
                {data.signatureRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-muted">
                      {t("common.noData", { defaultValue: "No data" })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabState.activeTab === "relations" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{t("documents.relations", { defaultValue: "Relations" })}</span>
            <Button variant="secondary" size="sm" onClick={handleOpenAddRelationModal}>
              {t("documents.addRelation", { defaultValue: "Add relation" })}
            </Button>
          </div>
          {loading.loadingRelations ? (
            <Spinner />
          ) : (
            <>
              <div className="mb-3">
                <strong>{t("documents.parentDocument", { defaultValue: "Parent document" })}</strong>
                {data.relations.parent ? (
                  <p className="mb-1">
                    <Link to={`/documents/${data.relations.parent.id}`}>
                      {data.relations.parent.title} ({data.relations.parent.barcode ?? data.relations.parent.id})
                    </Link>
                    <Button variant="outline" size="sm" className="ms-2 btn-outline-danger" onClick={handleClearParentClick}>
                      {t("documents.clearParent", { defaultValue: "Clear" })}
                    </Button>
                  </p>
                ) : (
                  <p className="text-muted mb-0">{t("common.none", { defaultValue: "None" })}</p>
                )}
              </div>
              <div>
                <strong>{t("documents.relatedDocuments", { defaultValue: "Related documents" })}</strong>
                <ul className="list-unstyled mb-0">
                  {(data.relations.related ?? []).map((rel) => (
                    <li key={rel.id}>
                      <Link to={`/documents/${rel.id}`}>
                        {rel.title} ({rel.barcode ?? rel.id})
                      </Link>
                      {rel.notes && <span className="text-muted ms-1">– {rel.notes}</span>}
                    </li>
                  ))}
                  {(data.relations.related ?? []).length === 0 && (
                    <li className="text-muted">{t("common.noData", { defaultValue: "No data" })}</li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {tabState.activeTab === "audit" && (
        <AuditActivityPanel
          t={t}
          logs={data.auditLogs as Parameters<typeof AuditActivityPanel>[0]["logs"]}
          loading={loading.loadingAudit}
          error={error.auditError ?? undefined}
          viewMode={tabState.activityViewMode as "timeline" | "tree"}
          onViewModeChange={(mode: string) => tabState.setActivityViewMode(mode as ActivityViewMode)}
          title={t("activity.auditTitle", { defaultValue: "Audit log" })}
          showRefresh
          onRefresh={tabState.auditRefresh}
          showDocument={false}
          showMetadata={false}
          treeGroupBy="document"
        />
      )}
    </>
  );
}
