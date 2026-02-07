import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import { useArchiveUpload } from "../hooks";
import type { UploadDocumentParams } from "../types/archive.types";
import { fileToBase64 } from "../../../shared/utils/files/fileToBase64";

export const useArchiveUploadPageContainer = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert("Please select at least one file");
      return;
    }

    try {
      const file = selectedFiles[0];
      const fileData = await fileToBase64(file);

      const uploadParams: UploadDocumentParams = {
        department_id: formData.department_id,
        document_type_id: formData.document_type_id,
        title: formData.title || file.name,
        file_data: fileData,
        file_name: file.name,
        confidentiality_level: formData.confidentiality_level,
      };

      await handleUpload(uploadParams);

      if (uploadedDocument) {
        navigate(routes.archiveDocuments);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return {
    routes,
    fileInputRef,
    selectedFiles,
    formData,
    uploading,
    error,
    uploadedDocument,
    setFormData,
    handleFileChange,
    handleRemoveFile,
    handleClearAllFiles,
    handleSubmit,
  };
};
