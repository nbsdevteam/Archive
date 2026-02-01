import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useArchiveUpload } from "../hooks";
import type { UploadDocumentParams } from "../types/archive.types";
import { Button, Icon } from "../../../shared/components/ui";

const ArchiveUpload = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    department_id: 1,
    document_type_id: 1,
    confidentiality_level: "internal",
  });

  // Use container with static data by default (useApi=false)
  const { handleUpload, uploading, error, uploadedDocument } = useArchiveUpload({ useApi: false });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      alert("Please select at least one file");
      return;
    }

    try {
      // Upload first file (can be extended to handle multiple files)
      const file = selectedFiles[0];
      const fileData = await convertFileToBase64(file);

      const uploadParams: UploadDocumentParams = {
        department_id: formData.department_id,
        document_type_id: formData.document_type_id,
        title: formData.title || file.name,
        file_data: fileData,
        file_name: file.name,
        confidentiality_level: formData.confidentiality_level,
      };

      await handleUpload(uploadParams);
      
      // Navigate to documents page on success
      if (uploadedDocument) {
        navigate(routes.archiveDocuments);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Upload</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Archive</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Upload
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">Upload Files or Folders</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Document Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter document title"
                />
              </div>

              <div className="border rounded p-4 text-center mb-3">
                <Icon name="upload" className="fs-1 text-primary mb-3" />
                <p className="mb-2">Drag and drop files here, or click to browse.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control"
                  multiple
                  onChange={handleFileChange}
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="text-muted mb-1">Selected files:</p>
                      {selectedFiles.length > 1 && (
                        <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={handleClearAllFiles}>
                          <Icon name="x" className="me-1" />
                          Remove all
                        </Button>
                      )}
                    </div>
                    <ul className="list-unstyled">
                      {selectedFiles.map((file, idx) => (
                        <li key={idx} className="text-start d-flex align-items-center justify-content-between gap-2">
                          <small>
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </small>
                          <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={() => handleRemoveFile(idx)}>
                            <Icon name="trash" className="me-1" />
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {uploadedDocument && (
                <div className="alert alert-success" role="alert">
                  File uploaded successfully!
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <Link to={routes.archiveDocuments} className="btn btn-light me-2">
                  Cancel
                </Link>
                <Button
                  type="submit"
                  variant="outline"
                  className="btn-outline-secondary"
                  isLoading={uploading}
                  disabled={uploading || selectedFiles.length === 0}
                >
                  Upload
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveUpload;
