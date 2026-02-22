/**
 * Standalone Notes page for browsing all notes (document/folder/standalone)
 */

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Button, ConfirmModal, Icon, SidePanel, MobileActionsMenu } from "../../../shared/components/ui";
import { PaginationSection } from "../../../shared/components/PaginationSection";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useConfirmDialog, usePaginationFromUrl } from "../../../shared/hooks";
import { useViewport } from "@/shared/hooks/useViewport";
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
  const { isDesktopView, isMobileView } = useViewport();
  const { registerHandler } = useShortcuts();
  const { page: urlPage, perPage: urlPerPage, setPage, setPerPage } = usePaginationFromUrl(50);

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
    perPage: urlPerPage,
    initialPage: urlPage,
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
    if (!isDesktopView) return;
    registerHandler(SHORTCUT_KEYS.CREATE_NOTE, () => noteEditor.handleCreateNote());
    return () => registerHandler(SHORTCUT_KEYS.CREATE_NOTE, undefined);
  }, [isDesktopView, registerHandler, noteEditor.handleCreateNote]);

  const handleDeleteNote = useCallback(
    (note: NoteListItem) => {
      noteDeleteDialog.open(note.id);
    },
    [noteDeleteDialog]
  );

  /** Navigate to folder detail */
  const handleNavigateToFolder = useCallback(
    (folderId: number) => {
      navigate(routes.folderDetail.replace(":id", String(folderId)));
    },
    [navigate, routes.folderDetail]
  );

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
      goToPage(p);
    },
    [setPage, goToPage]
  );

  const handlePerPageChange = useCallback(
    (pp: number) => {
      setPerPage(pp);
      // URL updates to page=1; useNotes effect will reload with new perPage
    },
    [setPerPage]
  );

  const pageTitle = t("notes.title", { defaultValue: "Notes" });

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[]}
      homeTo={routes.dashboard}
      rightContent={
        <>
          {isMobileView ? (
            <MobileActionsMenu
              title={t("common.actions", { defaultValue: "Actions" })}
              items={[
                {
                  id: "refresh",
                  icon: "refresh-cw",
                  label: t("common.refresh", { defaultValue: "Refresh" }),
                  onClick: refresh,
                },
                {
                  id: "create",
                  icon: "upload",
                  label: t("notes.createNote", { defaultValue: "Create note" }),
                  onClick: noteEditor.handleCreateNote,
                },
              ]}
              triggerAriaLabel={t("common.actions", { defaultValue: "Actions" })}
            />
          ) : (
            <>
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={refresh}>
                <Icon name="refresh-cw" className="me-1" />
                {t("common.refresh", { defaultValue: "Refresh" })}
              </Button>
              <Button variant="secondary" size="sm" onClick={noteEditor.handleCreateNote}>
                <Icon name="upload" className="me-1" />
                {t("notes.createNote", { defaultValue: "Create note" })}
              </Button>
            </>
          )}
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

            {pagination && pagination.total_pages > 0 && (
              <PaginationSection
                page={pagination.page}
                perPage={pagination.per_page}
                total={pagination.total}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                disabled={loading}
              />
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

      {/* Note editor sidebar (same pattern as Upload/Edit document sidebars) */}
      <SidePanel
        isOpen={noteEditor.isNotesEditorOpen}
        onClose={noteEditor.handleCloseNoteEditor}
        title={
          noteEditor.editingNote
            ? t("notes.editNote", { defaultValue: "Edit note" })
            : t("notes.createNote", { defaultValue: "Create note" })
        }
        width={isMobileView ? "100vw" : "50vw"}
        loading={noteEditor.isCreatingNote || noteEditor.isUpdatingNote}
        closeOnBackdropClick={false}
      >
        <NoteEditor
          note={noteEditor.editingNote}
          onSave={noteEditor.handleSaveNote}
          onCancel={noteEditor.handleCloseNoteEditor}
          isSaving={noteEditor.isCreatingNote || noteEditor.isUpdatingNote}
        />
      </SidePanel>

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
