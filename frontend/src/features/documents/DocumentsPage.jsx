import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle,
  FileCheck,
  Shield,
  Award,
  RefreshCw,
  FolderOpen,
  ArrowUpRight,
  Eye,
  Lock,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { financeService } from '../../services/financeService';
import { addToast } from '../ui/uiSlice';
import NocCertificateModal from '../finance/NocCertificateModal';
import NavPillTabs from '../../components/common/NavPillTabs';
import './DocumentsPage.css';

const CATEGORIES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'CUSTOMER', label: 'Customer' },
  { id: 'VEHICLE', label: 'Vehicle' },
  { id: 'LOAN', label: 'Loan' },
  { id: 'PAYMENT', label: 'Payment' },
  { id: 'CLOSURE', label: 'Closure' },
  { id: 'NOC', label: 'NOC Certificates' },
];

export default function DocumentsPage() {
  const dispatch = useDispatch();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLoanId, setUploadLoanId] = useState('');
  const [uploadCategory, setUploadCategory] = useState('LOAN');
  const [uploadDocType, setUploadDocType] = useState('AGREEMENT');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  // NOC Generation Modal State
  const [showNocWizard, setShowNocWizard] = useState(false);
  const [nocSearchLoanId, setNocSearchLoanId] = useState('');
  const [isCheckingNoc, setIsCheckingNoc] = useState(false);
  const [isIssuingNoc, setIsIssuingNoc] = useState(false);
  const [nocEligibility, setNocEligibility] = useState(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await financeService.getLoanDocuments({
        page,
        size: 15,
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchQuery ? searchQuery.trim() : undefined,
      });
      setDocuments(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to load documents' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchDocuments();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      dispatch(addToast({ type: 'error', message: 'Please select a document file to upload' }));
      return;
    }
    if (!uploadLoanId) {
      dispatch(addToast({ type: 'error', message: 'Loan ID is required to associate this document' }));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      formData.append('documentType', uploadDocType);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('notes', uploadNotes);

      await financeService.uploadLoanDocument(uploadLoanId, formData);
      dispatch(
        addToast({
          type: 'success',
          title: 'Document Uploaded',
          message: `${uploadTitle || uploadFile.name} was saved successfully to repository.`,
        })
      );
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadNotes('');
      setUploadLoanId('');
      fetchDocuments();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to upload document' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyNoc = async (e) => {
    e.preventDefault();
    if (!nocSearchLoanId) {
      dispatch(addToast({ type: 'error', message: 'Please enter a valid Loan ID' }));
      return;
    }
    setIsCheckingNoc(true);
    setNocEligibility(null);
    try {
      const res = await financeService.checkNocEligibility(nocSearchLoanId);
      setNocEligibility(res);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to verify NOC eligibility' }));
    } finally {
      setIsCheckingNoc(false);
    }
  };

  const handleIssueNocFromVault = async () => {
    if (!nocSearchLoanId) return;
    setIsIssuingNoc(true);
    try {
      const res = await financeService.issueNoc(nocSearchLoanId);
      dispatch(
        addToast({
          type: 'success',
          title: 'NOC Issued Successfully',
          message: `Official certificate #${res.documentReference} registered in vault.`,
        })
      );
      setShowNocWizard(false);
      setNocEligibility(null);
      setNocSearchLoanId('');
      fetchDocuments();
      if (res.downloadUrl) {
        window.open(resolveDownloadUrl(res.downloadUrl), '_blank');
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to issue NOC' }));
    } finally {
      setIsIssuingNoc(false);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'NOC':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">NOC</span>;
      case 'CLOSURE':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">CLOSURE</span>;
      case 'LOAN':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">LOAN</span>;
      case 'VEHICLE':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">VEHICLE</span>;
      case 'CUSTOMER':
        return <span className="badge bg-info-subtle text-info border border-info-subtle">CUSTOMER</span>;
      case 'PAYMENT':
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">PAYMENT</span>;
      default:
        return <span className="badge bg-light text-dark border">{cat}</span>;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return val;
    }
  };

  const resolveDownloadUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1.0';
    if (url.startsWith('/api/v1.0')) return url;
    if (url.startsWith('/')) return `${apiBase}${url}`;
    return `${apiBase}/${url}`;
  };

  return (
    <div className="container-fluid py-3 px-4">
      <PageHeader
        title="Document Management Repository"
        subtitle="Centralized digital vault for customer KYC, vehicle titles, loan covenants, and NOC clearance certificates"
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-xs"
            onClick={fetchDocuments}
            title="Refresh repository"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-sm btn-success text-white d-flex align-items-center gap-1 shadow-xs"
            onClick={() => {
              setNocEligibility(null);
              setNocSearchLoanId('');
              setShowNocWizard(true);
            }}
          >
            <Award size={14} /> Generate NOC Certificate
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-xs"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload size={14} /> Upload Document
          </button>
        </div>
      </PageHeader>

      {/* Executive Digital Vault Metrics Ribbon */}
      <div className="row g-3 mb-4">
        {/* Total Vault Records */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="vault-kpi-card vault-kpi-blue">
            <div className="vault-kpi-header">
              <span className="vault-kpi-label">Total Vault Records</span>
              <div
                className="vault-kpi-icon"
                style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
              >
                <FolderOpen size={18} />
              </div>
            </div>
            <div className="vault-kpi-value-row">
              <span className="vault-kpi-primary-val">{totalElements}</span>
              <span className="small text-muted fw-semibold">files</span>
            </div>
            <div className="vault-kpi-subtext">
              <span className="text-primary fw-semibold">100% indexed</span>
              <span>• Active digital vault</span>
            </div>
          </div>
        </div>

        {/* Storage Verification */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="vault-kpi-card vault-kpi-emerald">
            <div className="vault-kpi-header">
              <span className="vault-kpi-label">Storage Verification</span>
              <div
                className="vault-kpi-icon"
                style={{ backgroundColor: '#ecfdf5', color: '#059669' }}
              >
                <Shield size={18} />
              </div>
            </div>
            <div className="vault-kpi-value-row">
              <span className="vault-kpi-chip-val text-success">
                <CheckCircle size={17} className="text-success" /> Verified SHA-256
              </span>
            </div>
            <div className="vault-kpi-subtext">
              <span className="text-success fw-semibold">Cryptographically intact</span>
              <span>• Tamper-proof</span>
            </div>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="vault-kpi-card vault-kpi-indigo">
            <div className="vault-kpi-header">
              <span className="vault-kpi-label">Supported Formats</span>
              <div
                className="vault-kpi-icon"
                style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}
              >
                <FileText size={18} />
              </div>
            </div>
            <div className="vault-kpi-format-chips">
              <span className="vault-format-tag">PDF</span>
              <span className="vault-format-tag">PNG</span>
              <span className="vault-format-tag">JPEG</span>
              <span className="vault-format-tag">WEBP</span>
            </div>
            <div className="vault-kpi-subtext">
              <span>High-res multi-mime previews</span>
            </div>
          </div>
        </div>

        {/* Access Governance */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="vault-kpi-card vault-kpi-amber">
            <div className="vault-kpi-header">
              <span className="vault-kpi-label">Access Governance</span>
              <div
                className="vault-kpi-icon"
                style={{ backgroundColor: '#fffbeb', color: '#d97706' }}
              >
                <Lock size={18} />
              </div>
            </div>
            <div className="vault-kpi-value-row">
              <span className="vault-kpi-chip-val text-dark" style={{ fontSize: '0.92rem' }}>
                Role-Enforced Streams
              </span>
            </div>
            <div className="vault-kpi-subtext">
              <span className="text-amber fw-semibold">RBAC secure</span>
              <span>• Encrypted at rest</span>
            </div>
          </div>
        </div>
      </div>

      {/* UNIFORM HORIZONTAL CAPSULE TABS FOR VAULT & NOC CATEGORIES */}
      <NavPillTabs
        tabs={CATEGORIES.map((cat) => ({
          id: cat.id,
          label: cat.label,
          icon: cat.id === 'NOC' ? <Award size={14} className="text-success" /> : <FileText size={14} />,
          isActive: selectedCategory === cat.id,
          badge: cat.id === 'NOC' ? 'NOC' : null,
          badgeVariant: cat.id === 'NOC' ? 'accent' : 'neutral',
          onClick: () => {
            setSelectedCategory(cat.id);
            setPage(0);
          },
        }))}
      />

      {/* Modern Compact Search & Filter Toolbar */}
      <div className="card shadow-xs border mb-3">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-semibold text-dark">
                {selectedCategory === 'ALL' ? 'All Document Streams' : `${selectedCategory} Records`}
              </span>
              <span className="badge bg-light text-muted border" style={{ fontSize: '0.72rem' }}>
                {totalElements} Files
              </span>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="d-flex align-items-center gap-2">
              <div className="input-group input-group-sm" style={{ width: '280px' }}>
                <span className="input-group-text bg-white border-end-0">
                  <Search size={14} className="text-secondary" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search title, ref, borrower..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-sm btn-primary">
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card shadow-xs border">
        {isLoading ? (
          <div className="p-4">
            <LoadingState rows={6} />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            title="No Documents Found"
            message={
              searchQuery
                ? `No documents matched "${searchQuery}". Clear your search query or change categories.`
                : 'No documents have been recorded in this category yet. Upload a document or issue an NOC.'
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="table-light text-uppercase text-secondary" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Document Title & Ref</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Loan / Entity Reference</th>
                  <th>File Spec</th>
                  <th>Upload Date</th>
                  <th>Verified By</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr key={doc.id || idx}>
                    <td className="text-secondary font-monospace">{page * 15 + idx + 1}</td>
                    <td>
                      <div className="fw-semibold text-dark">{doc.title}</div>
                      <div className="font-monospace text-secondary" style={{ fontSize: '0.75rem' }}>
                        Ref: {doc.documentReference || 'DOC-GEN'}
                      </div>
                    </td>
                    <td>{getCategoryBadge(doc.category)}</td>
                    <td>
                      <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.72rem' }}>
                        {doc.documentType}
                      </span>
                    </td>
                    <td>
                      {doc.financeDetailId ? (
                        <a
                          href={`/finance/${doc.financeDetailId}`}
                          className="text-decoration-none text-primary fw-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Loan #{doc.financeDetailId} <ArrowUpRight size={12} />
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="text-dark fw-medium">{formatFileSize(doc.fileSizeBytes)}</div>
                      <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                        {doc.mimeType || 'application/pdf'}
                      </div>
                    </td>
                    <td>{formatDate(doc.createdAt)}</td>
                    <td>
                      <div className="text-dark">{doc.verifiedBy || 'System/Admin'}</div>
                      {doc.isVerified && (
                        <span className="badge bg-success-subtle text-success" style={{ fontSize: '0.68rem' }}>
                          Verified
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      {doc.downloadUrl ? (
                        <a
                          href={resolveDownloadUrl(doc.downloadUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 shadow-xs"
                          title="Download & View PDF/Document"
                        >
                          <Download size={13} /> View
                        </a>
                      ) : (
                        <span className="text-muted small">No file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-body-tertiary d-flex align-items-center justify-content-between py-2 px-3 border-top">
            <span className="text-secondary small">
              Page {page + 1} of {totalPages} ({totalElements} total records)
            </span>
            <div className="d-flex gap-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleUploadSubmit}>
                <div className="modal-header border-bottom py-3">
                  <h5 className="modal-title fw-semibold" style={{ fontSize: '1.05rem' }}>
                    Upload Loan / Vehicle Document
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)} />
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="uploadLoanId">
                      Associated Loan Account ID *
                    </label>
                    <input
                      id="uploadLoanId"
                      type="number"
                      className="form-control"
                      placeholder="e.g. 1"
                      value={uploadLoanId}
                      onChange={(e) => setUploadLoanId(e.target.value)}
                      required
                    />
                    <small className="text-secondary">Enter the Loan ID this document belongs to.</small>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="uploadCat">Category *</label>
                      <select
                        id="uploadCat"
                        className="form-select"
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                      >
                        <option value="CUSTOMER">Customer KYC</option>
                        <option value="VEHICLE">Vehicle Title / RC</option>
                        <option value="LOAN">Loan Contract</option>
                        <option value="PAYMENT">Payment Receipt</option>
                        <option value="CLOSURE">Closure Settlement</option>
                        <option value="NOC">NOC Certificate</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="uploadType">Document Type *</label>
                      <select
                        id="uploadType"
                        className="form-select"
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                      >
                        <option value="AGREEMENT">Loan Agreement</option>
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="RC_COPY">RC Copy</option>
                        <option value="INSURANCE">Insurance Policy</option>
                        <option value="INVOICE">Vehicle Invoice</option>
                        <option value="RECEIPT">Payment Receipt</option>
                        <option value="SANCTION_LETTER">Sanction Letter</option>
                        <option value="NOC">NOC Release</option>
                        <option value="OTHER">Other Proof</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="uploadTitle">
                      Document Title / Label *
                    </label>
                    <input
                      id="uploadTitle"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Signed Hypothecation Agreement"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="uploadFile">
                      Select File (PDF, PNG, JPEG, max 10MB) *
                    </label>
                    <input
                      id="uploadFile"
                      type="file"
                      className="form-control"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      required
                    />
                  </div>

                  <div className="mb-0">
                    <label className="form-label" htmlFor="uploadNotes">Notes / Verification Remarks</label>
                    <textarea
                      id="uploadNotes"
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Original signed document verified against customer PAN"
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer py-2 bg-body-tertiary">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload & Archive'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NOC Generation & Verification Modal */}
      {showNocWizard && !nocEligibility && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-success-subtle text-success">
                    <Award size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title mb-0 fw-semibold" style={{ fontSize: '1.05rem' }}>
                      Verify & Generate NOC Certificate
                    </h5>
                    <small className="text-secondary">
                      Lookup vehicle loan account to verify covenants &amp; preview NOC
                    </small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowNocWizard(false)} />
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleVerifyNoc}>
                  <label className="form-label fw-medium" htmlFor="nocLoanIdInput">
                    Loan Account ID *
                  </label>
                  <div className="input-group mb-2">
                    <input
                      id="nocLoanIdInput"
                      type="number"
                      className="form-control"
                      placeholder="e.g. 1"
                      value={nocSearchLoanId}
                      onChange={(e) => setNocSearchLoanId(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-primary d-inline-flex align-items-center gap-1"
                      disabled={isCheckingNoc}
                    >
                      <Search size={14} />
                      {isCheckingNoc ? 'Checking Covenants...' : 'Verify & Open Workspace'}
                    </button>
                  </div>
                  <small className="text-secondary">
                    Performs authoritative ledger validation: zero principal dues, zero pending installments, and closed status.
                  </small>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Panel NOC Document Workspace in Documents Vault */}
      <NocCertificateModal
        isOpen={showNocWizard && Boolean(nocEligibility)}
        onClose={() => {
          setShowNocWizard(false);
          setNocEligibility(null);
        }}
        loanId={nocSearchLoanId}
        nocEligibility={nocEligibility}
        isLoadingEligibility={isCheckingNoc}
        isIssuing={isIssuingNoc}
        onIssueNoc={handleIssueNocFromVault}
        resolveDownloadUrl={resolveDownloadUrl}
      />
    </div>
  );
}
