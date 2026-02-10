import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { all_routes } from "../../../router/all_routes";
import { FilePreview } from "../../../shared/components/FilePreview";
import { Alert, Button, Icon, Spinner } from "../../../shared/components/ui";
import { documentsApi } from "../../../app/adapter/api/documents.api";
import "../styles/documents.css";

/**
 * Page to view a single attachment (preview) for a document.
 * Route: /documents/:id/attachments/:attachmentId
 */
const DocumentAttachmentViewPage = () => {
  const { t } = useTranslation();
  const { id, attachmentId } = useParams<{ id: string; attachmentId: string }>();
  const routes = all_routes;

  const docId = useMemo(() => {
    if (!id) return null;
    const n = parseInt(id, 10);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  const attachmentIdNum = useMemo(() => {
    if (!attachmentId) return null;
    const n = parseInt(attachmentId, 10);
    return Number.isFinite(n) ? n : null;
  }, [attachmentId]);

  const [attachment, setAttachment] = useState<{
    id: number;
    name: string;
    file_name: string;
    description?: string | null;
  } | null>(null);
  const [docTitle, setDocTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId || !attachmentIdNum) {
      setLoading(false);
      setError(t("errors.notFound", { defaultValue: "Not found." }));
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [docRes, attachmentsRes] = await Promise.all([
          documentsApi.getDocument(docId),
          documentsApi.listAttachments(docId),
        ]);
        if (cancelled) return;

        const docData = (docRes as { data?: { title?: string; name?: string } }).data;
        const list = (attachmentsRes as { data?: Array<{ id: number; name: string; file_name: string; description?: string | null }> }).data ?? [];
        const found = list.find((a) => a.id === attachmentIdNum);

        if (docData) {
          setDocTitle(docData.title ?? docData.name ?? null);
        }
        if (found) {
          setAttachment(found);
        } else {
          setError(t("errors.notFound", { defaultValue: "Attachment not found." }));
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error)?.message ?? t("errors.generic", { defaultValue: "Failed to load attachment." }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [docId, attachmentIdNum, t]);

  if (loading) {
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

  if (error || !docId || !attachmentIdNum || !attachment) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="warning">{error ?? t("errors.notFound", { defaultValue: "Not found." })}</Alert>
          <Link to={routes.documents} className="btn btn-secondary mt-2">
            <Icon name="arrow-left" className="me-1" />
            {t("common.back", { defaultValue: "Back" })}
          </Link>
        </div>
      </div>
    );
  }

  const documentDetailUrl = routes.documentDetail.replace(":id", String(docId));

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">
              {t("documents.viewAttachment", { defaultValue: "View attachment" })}
            </h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={routes.archiveDocuments}>{t("documents.title", { defaultValue: "Documents" })}</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={documentDetailUrl}>{docTitle ?? t("documents.details", { defaultValue: "Document" })}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {attachment.name || attachment.file_name}
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
            <Link to={documentDetailUrl} className="btn btn-outline-secondary btn-sm">
              <Icon name="arrow-left" className="me-1" />
              {t("documents.backToDocument", { defaultValue: "Back to document" })}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex flex-wrap align-items-center gap-2">
            <h5 className="card-title mb-0">{attachment.name || attachment.file_name}</h5>
            {attachment.description && (
              <span className="text-muted small">{attachment.description}</span>
            )}
          </div>
          <div className="card-body">
            <FilePreview
              documentId={docId}
              attachmentId={attachmentIdNum}
              fileName={attachment.file_name}
              notPreviewableMessage={t("documents.previewNotAvailable", { defaultValue: "Preview not available for this file type" })}
              errorMessage={t("documents.previewLoadFailed", { defaultValue: "Failed to load preview" })}
              maxHeight="70vh"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAttachmentViewPage;
