import { useTranslation } from "react-i18next";
import { Modal, Icon } from "@/shared/components/ui";
import type { UploadFileResult } from "@/app/adapter/api/documents.api";

export interface FailedUploadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  failedFiles: UploadFileResult[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? "N/A" : fileName.substring(lastDot + 1).toUpperCase();
}

export function FailedUploadsModal({ isOpen, onClose, failedFiles }: FailedUploadsModalProps) {
  const { t } = useTranslation();

  if (failedFiles.length === 0) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("documents.uploadFailedDetails", { defaultValue: "Files Failed to Upload" })}
      size="xl"
    >
      <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <div className="alert alert-danger d-flex align-items-center mb-3">
          <Icon name="alert-triangle" className="me-2" />
          <strong>
            {t("documents.failedFilesCount", { 
              count: failedFiles.length, 
              defaultValue: "{{count}} file(s) failed to upload" 
            })}
          </strong>
        </div>

        <div className="d-flex flex-column gap-3">
          {failedFiles.map((failedFile, index) => {
            const file = failedFile.file;
            const webkitPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
            const fullPath = webkitPath || file.name;
            const extension = getFileExtension(file.name);
            const lastModified = new Date(file.lastModified);
            
            return (
              <div key={index} className="card border-danger">
                <div className="card-header bg-danger bg-opacity-10 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <Icon name="file-text" className="text-danger" />
                    <h6 className="mb-0 fw-bold">
                      <span className="text-muted me-2">#{index + 1}</span>
                      {file.name}
                    </h6>
                  </div>
                  <span className="badge bg-danger">
                    <Icon name="x-circle" className="me-1" size={14} />
                    {t("documents.failed", { defaultValue: "Failed" })}
                  </span>
                </div>

                <div className="card-body">
                  <div className="row g-3">
                    {/* File Name */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-start gap-2">
                        <Icon name="file" className="text-muted mt-1" size={16} />
                        <div className="flex-grow-1">
                          <div className="small text-muted">{t("documents.fileName", { defaultValue: "File Name" })}</div>
                          <div className="fw-semibold text-break">{file.name}</div>
                        </div>
                      </div>
                    </div>

                    {/* File Extension */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-start gap-2">
                        <Icon name="tag" className="text-muted mt-1" size={16} />
                        <div className="flex-grow-1">
                          <div className="small text-muted">{t("documents.fileExtension", { defaultValue: "Extension" })}</div>
                          <div className="fw-semibold">
                            <span className="badge bg-secondary">{extension}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Size */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-start gap-2">
                        <Icon name="hard-drive" className="text-muted mt-1" size={16} />
                        <div className="flex-grow-1">
                          <div className="small text-muted">{t("documents.fileSize", { defaultValue: "File Size" })}</div>
                          <div className="fw-semibold">{formatFileSize(file.size)}</div>
                          <div className="small text-muted">{file.size.toLocaleString()} bytes</div>
                        </div>
                      </div>
                    </div>

                    {/* MIME Type */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-start gap-2">
                        <Icon name="code" className="text-muted mt-1" size={16} />
                        <div className="flex-grow-1">
                          <div className="small text-muted">{t("documents.mimeType", { defaultValue: "MIME Type" })}</div>
                          <div className="fw-semibold font-monospace small">
                            {file.type || t("documents.unknown", { defaultValue: "Unknown" })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Path / Location */}
                    <div className="col-12">
                      <div className="d-flex align-items-start gap-2">
                        <Icon name="folder" className="text-muted mt-1" size={16} />
                        <div className="flex-grow-1">
                          <div className="small text-muted">{t("documents.fileLocation", { defaultValue: "File Location" })}</div>
                          <div className="font-monospace small text-break bg-light p-2 rounded border">
                            {fullPath}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Last Modified */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-start gap-2">
                        <Icon name="clock" className="text-muted mt-1" size={16} />
                        <div className="flex-grow-1">
                          <div className="small text-muted">{t("documents.lastModified", { defaultValue: "Last Modified" })}</div>
                          <div className="fw-semibold">{lastModified.toLocaleString()}</div>
                          <div className="small text-muted">
                            {lastModified.toLocaleDateString()} at {lastModified.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Object Info */}
                    <div className="col-md-6">
                      <div className="d-flex align-items-start gap-2">
                        <Icon name="info" className="text-muted mt-1" size={16} />
                        <div className="flex-grow-1">
                          <div className="small text-muted">{t("documents.fileObjectInfo", { defaultValue: "File Object" })}</div>
                          <div className="small">
                            <div>Type: <span className="badge bg-info">{file.constructor.name}</span></div>
                            {file.webkitRelativePath && (
                              <div className="mt-1 text-muted">WebKit path available</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Error Details */}
                    {failedFile.error && (
                      <div className="col-12">
                        <div className="alert alert-danger mb-0">
                          <div className="d-flex align-items-start gap-2">
                            <Icon name="alert-circle" className="mt-1" size={18} />
                            <div className="flex-grow-1">
                              <strong className="d-block mb-2">
                                {t("documents.errorDetails", { defaultValue: "Error Details" })}:
                              </strong>
                              <div className="font-monospace small text-break bg-white p-2 rounded border border-danger">
                                {failedFile.error}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          <Icon name="x" className="me-1" size={16} />
          {t("common.close", { defaultValue: "Close" })}
        </button>
      </div>
    </Modal>
  );
}
