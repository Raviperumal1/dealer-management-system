import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import documentService from '../../services/documentService';
import { formatFileSize } from '../../utils/formatters';

export function FileUpload({
  category = 'GENERAL',
  onUploadSuccess,
  label = 'Upload Document or Photo',
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  maxSizeMb = 10,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds limit of ${maxSizeMb} MB`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const response = await documentService.uploadFile(file, category);
      setUploadedDoc(response);
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setUploadedDoc(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="file-upload-component">
      {label && <label className="form-label">{label}</label>}

      {!uploadedDoc ? (
        <div
          className={`border border-2 border-dashed rounded-3 p-3 text-center bg-light position-relative ${
            error ? 'border-danger' : 'border-secondary-subtle'
          }`}
          style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="py-2">
              <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />
              <p className="small text-muted mb-0">Uploading and validating document...</p>
            </div>
          ) : (
            <div>
              <UploadCloud size={28} className="text-muted mb-1" />
              <p className="small fw-semibold text-dark mb-0">Click to upload file</p>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                JPEG, PNG, WEBP, PDF (Max {maxSizeMb}MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-3 p-2 bg-white d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <CheckCircle2 size={18} className="text-success flex-shrink-0" />
            <div className="text-truncate">
              <div className="small fw-semibold text-dark text-truncate">
                {uploadedDoc.originalFileName}
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                {formatFileSize(uploadedDoc.fileSize)} • Key: {uploadedDoc.fileKey?.slice(0, 8)}...
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link text-muted p-1"
            onClick={clearFile}
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="text-danger small mt-1 d-flex align-items-center gap-1">
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
