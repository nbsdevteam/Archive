/**
 * Standalone Notes page for browsing all notes (document/folder/standalone)
 */

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Button, ConfirmModal, Icon, Modal } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useConfirmDialog } from "../../../shared/hooks";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsContext";
import { SHORTCUT_KEYS } from "@/shared/shortcuts/shortcutsRegistry";
import { useNotes, useNoteMutations } from "../hooks/useNotes";
import { useNoteEditorHandlers } from "../hooks/useNoteEditorHandlers";
import { NotesList, NoteEditor, NoteImageViewerModal } from "../components";
import type { NoteListItem } from "../types/notes.types";

const NotesPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();
  const { registerHandler } = useShortcuts();

  const {
    notes,
    loading,
    error,
    pagination,
    refresh,
    goToPage,
  } = useNotes({
    includePrivate: true,
    autoLoad: true,
    perPage: 50,
  });

  const {
    create: createNote,
    update: updateNote,
    remove: deleteNote,
    isCreating,
    isUpdating,
    isDeleting,
  } = useNoteMutations();

  const noteEditor = useNoteEditorHandlers({
    refreshNotes: refresh,
    createNote,
    updateNote,
    deleteNote,
    isCreating,
    isUpdating,
    isDeleting,
    createContext: undefined,
  });

  const noteDeleteDialog = useConfirmDialog<number>({ onConfirm: noteEditor.confirmDeleteNote });

  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.CREATE_NOTE, () => noteEditor.handleCreateNote());
    return () => registerHandler(SHORTCUT_KEYS.CREATE_NOTE, undefined);
  }, [registerHandler, noteEditor.handleCreateNote]);

  const handleDeleteNote = useCallback(
    (note: NoteListItem) => {
      noteDeleteDialog.open(note.id);
    },
    [noteDeleteDialog]
  );

  /** Navigate to document detail */
  const handleNavigateToDocument = useCallback(
    (documentId: number) => {
      navigate(routes.documentDetail.replace(":id", String(documentId)));
    },
    [navigate, routes.documentDetail]
  );

  /** Navigate to folder detail */
  const handleNavigateToFolder = useCallback(
    (folderId: number) => {
      navigate(routes.folderDetail.replace(":id", String(folderId)));
    },
    [navigate, routes.folderDetail]
  );

  const pageTitle = t("notes.title", { defaultValue: "Notes" });

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[]}
      homeTo={routes.dashboard}
      rightContent={
        <>
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={refresh}>
            <Icon name="refresh-cw" className="me-1" />
            {t("common.refresh", { defaultValue: "Refresh" })}
          </Button>
          <Button variant="secondary" size="sm" onClick={noteEditor.handleCreateNote}>
            <Icon name="upload" className="me-1" />
            {t("notes.createNote", { defaultValue: "Create note" })}
          </Button>
          <CollapseHeader />
        </>
      }
    >
        {/* Error alert */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Notes list card */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              {t("notes.allNotes", { defaultValue: "All notes" })}
            </h5>
            {pagination && pagination.total > 0 && (
              <span className="badge bg-secondary">
                {t("common.total", { defaultValue: "Total" })}: {pagination.total}
              </span>
            )}
          </div>
          <div className="card-body">
            <NotesList
              notes={notes}
              loading={loading}
              error={error}
              onEdit={noteEditor.handleEditNote}
              onDelete={handleDeleteNote}
              onViewImage={noteEditor.handleViewNoteImage}
              onFolderClick={handleNavigateToFolder}
              showDocument={true}
              showFolder={true}
              emptyMessage={t("notes.noNotes", {
                defaultValue: "No notes found.",
              })}
            />

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${pagination.page <= 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        {t("common.previous", { defaultValue: "Previous" })}
                      </button>
                    </li>
                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                      <li
                        key={page}
                        className={`page-item ${page === pagination.page ? "active" : ""}`}
                      >
                        <button className="page-link" onClick={() => goToPage(page)}>
                          {page}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        pagination.page >= pagination.total_pages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.total_pages}
                      >
                        {t("common.next", { defaultValue: "Next" })}
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Linked items helper */}
        {notes.length > 0 && (
          <div className="alert alert-info mt-3" role="alert">
            <strong>{t("notes.linkedItemsHelp", { defaultValue: "Tip:" })}</strong>
            {" "}
            {t("notes.linkedItemsHelpText", {
              defaultValue:
                "Click on document or folder badges in note cards to navigate to their detail pages.",
            })}
          </div>
        )}

      {/* Note editor modal */}
      <Modal
        isOpen={noteEditor.isNotesEditorOpen}
        onClose={noteEditor.handleCloseNoteEditor}
        title={
          noteEditor.editingNote
            ? t("notes.editNote", { defaultValue: "Edit note" })
            : t("notes.createNote", { defaultValue: "Create note" })
        }
        size="lg"
      >
        <NoteEditor
          note={noteEditor.editingNote}
          onSave={noteEditor.handleSaveNote}
          onCancel={noteEditor.handleCloseNoteEditor}
          isSaving={noteEditor.isCreatingNote || noteEditor.isUpdatingNote}
        />
      </Modal>

      {/* Note image viewer modal */}
      <NoteImageViewerModal
        isOpen={noteEditor.noteImageViewerId != null}
        onClose={noteEditor.handleCloseNoteImageViewer}
        noteId={noteEditor.noteImageViewerId}
        noteTitle={noteEditor.noteImageViewerTitle}
        imageFilename={noteEditor.noteImageViewerFilename}
      />

      {/* Note delete confirmation modal */}
      <ConfirmModal
        {...noteDeleteDialog.modalProps}
        title={t("notes.deleteNote", { defaultValue: "Delete note" })}
        message={t("notes.confirmDelete", {
          defaultValue: "Are you sure you want to delete this note? This action cannot be undone.",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />
    </PageLayout>
  );
};

export default NotesPage;
