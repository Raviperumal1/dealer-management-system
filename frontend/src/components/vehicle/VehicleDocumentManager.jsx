import React, { useState, useRef } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { FileText, Upload, Trash2, Download, AlertCircle, FileCheck, File } from 'lucide-react';
import { formatDate } from '../../utils/date';

export function VehicleDocumentManager({ vehicleId, documents = [], onDocumentsUpdated, canEdit = true }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('RC');
  const [documentName, setDocumentName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      if (!documentName) {
        const name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setDocumentName(name);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', documentType);
    formData.append('documentName', documentName || selectedFile.name);

    try {
      const updatedVehicle = await vehicleService.uploadDocument(vehicleId, formData);
      setSelectedFile(null);
      setDocumentName('');
      setDocumentType('RC');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onDocumentsUpdated) onDocumentsUpdated(updatedVehicle);
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const updatedVehicle = await vehicleService.deleteDocument(vehicleId, docId);
      if (onDocumentsUpdated) onDocumentsUpdated(updatedVehicle);
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const formatDocUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/documents/')) return `/api/v1.0${path}`;
    return `/api/v1.0/documents/${path}/download`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="app-card mb-4">
      <div className="app-card-header d-flex justify-content-between align-items-center">
        <h3 className="app-card-title d-flex align-items-center gap-2">
          <FileText size={18} className="text-primary" /> Vehicle Legal Documents & Records
        </h3>
        <span className="badge bg-secondary-subtle text-secondary font-monospace">
          {documents.length} {documents.length === 1 ? 'Doc' : 'Docs'}
        </span>
      </div>

      <div className="app-card-body">
        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3">
            <AlertCircle size={16} className="text-danger flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Form */}
        {canEdit && (
          <form onSubmit={handleUpload} className="p-3 border rounded-3 bg-light mb-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={isUploading}
                >
                  <option value="RC">RC Copy (Registration Certificate)</option>
                  <option value="INSURANCE">Insurance Policy</option>
                  <option value="POLLUTION">PUC Certificate</option>
                  <option value="SELLER_ID">Seller ID Proof</option>
                  <option value="INVOICE">Purchase / Workshop Invoice</option>
                  <option value="OTHER">Other Agreement / NOC</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Document Name (e.g. Smart Card Copy)"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div className="col-12 col-md-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="form-control form-control-sm"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>

              <div className="col-12 col-md-2 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-1"
                  disabled={isUploading || !selectedFile}
                >
                  <Upload size={14} />
                  {isUploading ? 'Uploading...' : 'Upload Doc'}
                </button>
              </div>
            </div>
            <div className="text-muted small mt-2" style={{ fontSize: '0.75rem' }}>
              Supported: PDF, JPEG, PNG (Max 10MB). Stored securely and linked to vehicle record.
            </div>
          </form>
        )}

        {/* Document List Table */}
        {documents.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Document Type</th>
                  <th>Document Name</th>
                  <th>Size</th>
                  <th>Uploaded Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const downloadUrl = formatDocUrl(doc.filePath);
                  const isPdf = doc.contentType === 'application/pdf' || doc.documentName?.toLowerCase().endsWith('.pdf');

                  return (
                    <tr key={doc.id}>
                      <td className="text-center">
                        {isPdf ? (
                          <FileText size={18} className="text-danger" />
                        ) : (
                          <FileCheck size={18} className="text-primary" />
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace">
                          {doc.documentType || 'DOCUMENT'}
                        </span>
                      </td>
                      <td className="fw-medium text-dark">{doc.documentName}</td>
                      <td className="text-muted font-monospace">{formatFileSize(doc.fileSize)}</td>
                      <td className="text-muted">{formatDate(doc.uploadedAt || doc.createdAt)}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary p-1 px-2 d-flex align-items-center gap-1"
                            title="Download or Preview Document"
                          >
                            <Download size={13} /> View
                          </a>
                          {canEdit && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger p-1"
                              onClick={() => handleDelete(doc.id)}
                              title="Delete Document"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed rounded-3 bg-light">
            <File size={36} className="text-muted mb-2 opacity-50" />
            <p className="text-muted small mb-0">No documents attached to this vehicle yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VehicleDocumentManager;
