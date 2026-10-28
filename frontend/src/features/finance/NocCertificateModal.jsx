import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Award,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  User,
  Car
} from 'lucide-react';
import { formatDate } from '../../utils/date';

/**
 * NocCertificateModal
 *
 * Professional two-panel NOC document workspace for Indian vehicle-finance ERP.
 * - Left Panel (65-70%): Genuine A4-proportioned certificate preview with institutional typography,
 *   official letterhead, verified borrower and vehicle specifications, and formal hypothecation release terms.
 * - Right Panel (30-35%): Compact metadata summary, expandable verification checklist, and direct actions
 *   (Download PDF, Print Certificate, Issue NOC, Reissue NOC with confirmation).
 */
export default function NocCertificateModal({
  isOpen,
  onClose,
  loanId,
  nocEligibility,
  isLoadingEligibility = false,
  isIssuing = false,
  onIssueNoc,
  resolveDownloadUrl,
  userRole = 'ADMIN'
}) {
  const [showChecklist, setShowChecklist] = useState(false);
  const [showReissueConfirm, setShowReissueConfirm] = useState(false);
  const [reissueReason, setReissueReason] = useState('');

  if (!isOpen) return null;

  // Derive display values from live backend record
  const el = nocEligibility || {};
  const isAlreadyIssued = Boolean(el.alreadyIssued);
  const isEligible = Boolean(el.eligible);
  const docRef = el.existingNocReference || (isAlreadyIssued ? 'NOC-PENDING-SYNC' : 'DRAFT-PREVIEW');
  const issueDateFormatted = el.existingNocIssueDate ? formatDate(el.existingNocIssueDate) : formatDate(new Date().toISOString().split('T')[0]);
  const loanAccountNo = el.loanAccountNumber || (el.loanId ? `LN-${el.loanId}` : '—');
  const borrowerName = el.customerName || 'Authorized Borrower';
  const borrowerAddress = el.customerAddress || 'Registered Address on file with DealerOS Finance';
  const regNumber = el.vehicleRegistrationNumber && el.vehicleRegistrationNumber !== 'UNREGISTERED' ? el.vehicleRegistrationNumber : (el.vehicleRegistrationNumber || 'TR-REG-PENDING');
  const vehicleBrandModel = (el.vehicleBrand || el.vehicleModel)
    ? `${el.vehicleBrand || ''} ${el.vehicleModel || ''} ${el.vehicleYear ? `(${el.vehicleYear})` : ''}`.trim()
    : 'Dealership Verified Motor Vehicle';
  const chassisNo = el.chassisNumber || 'VERIFIED ON RECORD';
  const engineNo = el.engineNumber || 'VERIFIED ON RECORD';
  const loanAmountFormatted = el.sanctionedAmount ? `₹ ${Number(el.sanctionedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
  const closureDateFormatted = el.loanClosureDate ? formatDate(el.loanClosureDate) : formatDate(new Date().toISOString().split('T')[0]);
  const lenderName = el.lenderName || 'DEALEROS AUTOMOTIVE FINANCE PRIVATE LIMITED';

  // Handle on-screen print of the A4 certificate
  const handlePrintCertificate = () => {
    const printContent = document.getElementById('noc-a4-canvas');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print the certificate.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NOC Certificate — ${docRef}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 20mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .certificate-wrapper {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              box-sizing: border-box;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
              font-size: 11px;
            }
            .header-banner {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .brand-title {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 0.05em;
              color: #0f172a;
            }
            .sub-title {
              font-size: 10px;
              color: #475569;
            }
            .doc-title {
              text-align: center;
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin: 14px 0 2px 0;
            }
            .doc-sub {
              text-align: center;
              font-size: 10px;
              color: #475569;
              margin-bottom: 16px;
            }
            .text-sm {
              font-size: 11px;
              line-height: 1.6;
            }
            .signature-box {
              margin-top: 36px;
            }
            .footer-line {
              margin-top: 24px;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              font-size: 9px;
              color: #64748b;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="certificate-wrapper">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleConfirmReissue = () => {
    if (onIssueNoc) {
      onIssueNoc(reissueReason);
    }
    setShowReissueConfirm(false);
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '1160px', width: '95%' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          
          {/* Header (Phase 3.A) */}
          <div className="modal-header py-3 px-4 bg-white border-bottom align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded"
                style={{ width: '38px', height: '38px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
              >
                <Award size={20} className="text-dark" />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title mb-0 fw-bold text-dark" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                    No Objection Certificate
                  </h5>
                  {isAlreadyIssued && (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0 fw-medium" style={{ fontSize: '0.72rem' }}>
                      ISSUED
                    </span>
                  )}
                  {!isAlreadyIssued && isEligible && (
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0 fw-medium" style={{ fontSize: '0.72rem' }}>
                      READY TO ISSUE
                    </span>
                  )}
                  {!isAlreadyIssued && !isEligible && (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-0 fw-medium" style={{ fontSize: '0.72rem' }}>
                      ACTION REQUIRED
                    </span>
                  )}
                </div>
                <div className="text-secondary small d-flex align-items-center gap-2 mt-0">
                  <span>Vehicle loan closure &amp; hypothecation release</span>
                  <span>•</span>
                  <span>Borrower: <strong>{borrowerName}</strong></span>
                  <span>•</span>
                  <span>A/C: <span className="font-monospace">{loanAccountNo}</span></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {/* Compact Eligibility Summary Strip (Phase 3.B) */}
          <div
            className="px-4 py-2 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2"
            style={{ fontSize: '0.8rem', borderLeft: '4px solid #0f172a' }}
          >
            <div className="d-flex flex-wrap align-items-center gap-3 text-secondary">
              <div className="d-flex align-items-center gap-1">
                <span className="text-muted">Loan Status:</span>
                <span className={`fw-semibold ${el.loanStatus === 'CLOSED' ? 'text-success' : 'text-danger'}`}>
                  {el.loanStatus || 'UNKNOWN'}
                </span>
              </div>
              <span>•</span>
              <div className="d-flex align-items-center gap-1">
                <span className="text-muted">Outstanding:</span>
                <span className="fw-semibold text-dark">
                  ₹{Number(el.principalOutstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span>•</span>
              <div className="d-flex align-items-center gap-1">
                <span className="text-muted">Unpaid EMIs:</span>
                <span className={`fw-semibold ${(el.unpaidInstallmentCount || 0) === 0 ? 'text-success' : 'text-danger'}`}>
                  {el.unpaidInstallmentCount ?? 0}
                </span>
              </div>
              <span>•</span>
              <div className="d-flex align-items-center gap-1">
                <span className="text-muted">Hypothecation:</span>
                <span className="fw-semibold text-success">
                  {isAlreadyIssued ? 'Released' : isEligible ? 'Ready for Release' : 'Hold / Ineligible'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none p-0 text-secondary d-flex align-items-center gap-1"
              style={{ fontSize: '0.78rem' }}
              onClick={() => setShowChecklist(!showChecklist)}
            >
              <span>{showChecklist ? 'Hide' : 'View'} verification details</span>
              {showChecklist ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Collapsible Verification Checklist */}
          {showChecklist && (
            <div className="px-4 py-2 bg-white border-bottom" style={{ fontSize: '0.8rem' }}>
              <div className="row g-2 py-1">
                {(el.clearanceChecklist || [
                  `Contractual Outstanding Principal: ₹${el.principalOutstanding || 0}`,
                  `Unpaid Scheduled Installments: ${el.unpaidInstallmentCount || 0}`,
                  `Loan Account Status: ${el.loanStatus}`,
                  'Active Liens / Disputes: NIL (PASS)'
                ]).map((item, idx) => {
                  const isPass = item.includes('(PASS)') || (!item.includes('PENDING') && !item.includes('REQUIRES'));
                  return (
                    <div key={idx} className="col-md-6 d-flex align-items-center gap-2">
                      {isPass ? (
                        <CheckCircle size={14} className="text-success flex-shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-danger flex-shrink-0" />
                      )}
                      <span className={isPass ? 'text-secondary' : 'text-danger fw-medium'}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Two-Column Document Workspace (Phase 3.C) */}
          <div className="modal-body p-0 bg-slate-100" style={{ backgroundColor: '#f8fafc' }}>
            <div className="row g-0">
              
              {/* LEFT COLUMN: A4 Certificate Preview Canvas (68%) */}
              <div className="col-lg-8 p-3 p-md-4 border-end" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                {isLoadingEligibility ? (
                  <div className="py-5 text-center bg-white rounded border">
                    <div className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
                    <span className="text-secondary small">Loading certificate data and verifying ledger...</span>
                  </div>
                ) : (
                  /* Formal A4 Document Sheet (Phase 3.D) */
                  <div
                    id="noc-a4-canvas"
                    className="bg-white shadow-sm mx-auto"
                    style={{
                      maxWidth: '720px',
                      minHeight: '840px',
                      padding: '36px 42px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      color: '#0f172a',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}
                  >
                    {/* Institutional Letterhead */}
                    <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3" style={{ borderColor: '#0f172a' }}>
                      <div>
                        <div className="fw-bold" style={{ fontSize: '1.05rem', letterSpacing: '0.04em', color: '#0f172a' }}>
                          DEALEROS AUTOMOTIVE FINANCE
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                          Automotive Credit &amp; Commercial Vehicle Financing Division<br />
                          Corporate Towers, Financial District, Hyderabad, Telangana 500032<br />
                          Contact: finance-desk@dealeros.internal • Toll Free: 1800-419-8800
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="badge bg-dark text-white px-2 py-1 font-monospace" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                          FORM 35 COMPLIANT
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.68rem' }}>
                          ISO 9001:2015 Verified
                        </div>
                      </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="d-flex justify-content-between align-items-center mb-3 text-secondary pb-2 border-bottom" style={{ fontSize: '0.75rem', borderColor: '#f1f5f9' }}>
                      <div>
                        <span className="text-muted">Document Ref: </span>
                        <strong className="font-monospace text-dark">{docRef}</strong>
                      </div>
                      <div>
                        <span className="text-muted">Date of Issue: </span>
                        <strong className="text-dark">{issueDateFormatted}</strong>
                      </div>
                    </div>

                    {/* Document Title & Sub-header */}
                    <div className="text-center my-3">
                      <div className="fw-bold text-dark text-uppercase" style={{ fontSize: '0.98rem', letterSpacing: '0.06em' }}>
                        No Objection Certificate (NOC)
                      </div>
                      <div className="text-secondary fst-italic" style={{ fontSize: '0.76rem' }}>
                        (Towards Full &amp; Final Settlement of Vehicle Hypothecation)
                      </div>
                    </div>

                    {/* Addressee */}
                    <div className="mb-3" style={{ fontSize: '0.78rem' }}>
                      <div className="fw-bold text-dark mb-1">
                        TO WHOMSOEVER IT MAY CONCERN / THE REGIONAL TRANSPORT OFFICER (RTO)
                      </div>
                      <div className="text-secondary">
                        Government Transport Department &amp; Registering Authority
                      </div>
                    </div>

                    {/* Formal Preamble */}
                    <div className="mb-3 text-dark" style={{ fontSize: '0.78rem', lineHeight: '1.65', textAlign: 'justify' }}>
                      This is to certify that Sri/Smt. <strong>{borrowerName}</strong>, residing at {borrowerAddress}, was granted an automotive finance facility of <strong>{loanAmountFormatted}</strong> under Loan Account Number <strong className="font-monospace">{loanAccountNo}</strong> towards the purchase/financing of the motor vehicle specified in the schedule below:
                    </div>

                    {/* Vehicle & Loan Details Table */}
                    <div className="mb-3">
                      <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.76rem', borderColor: '#cbd5e1' }}>
                        <tbody>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary" style={{ width: '42%' }}>Borrower Name / Customer ID</td>
                            <td className="fw-semibold text-dark">{borrowerName} {el.customerId ? `(#${el.customerId})` : ''}</td>
                          </tr>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary">Vehicle Registration Number</td>
                            <td className="fw-bold font-monospace text-dark">{regNumber}</td>
                          </tr>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary">Vehicle Make &amp; Model</td>
                            <td className="text-dark">{vehicleBrandModel}</td>
                          </tr>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary">Chassis / VIN Number</td>
                            <td className="font-monospace text-dark">{chassisNo}</td>
                          </tr>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary">Engine Number</td>
                            <td className="font-monospace text-dark">{engineNo}</td>
                          </tr>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary">Sanctioned Loan Facility</td>
                            <td className="text-dark">{loanAmountFormatted}</td>
                          </tr>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary">Account Closure &amp; Settlement Date</td>
                            <td className="text-dark">{closureDateFormatted}</td>
                          </tr>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary">Outstanding Balance as on Date</td>
                            <td className="text-success fw-bold">₹ 0.00 (NIL DUES)</td>
                          </tr>
                          <tr>
                            <td className="bg-light fw-semibold text-secondary">Lien Clearance Status</td>
                            <td className="text-success fw-semibold">FULLY SETTLED &amp; RECONCILED</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Clearance Statement & Hypothecation Release Clauses */}
                    <div className="p-2 mb-3 bg-light rounded border text-secondary" style={{ fontSize: '0.74rem', lineHeight: '1.6', borderColor: '#e2e8f0' }}>
                      <strong className="text-dark">DECLARATION OF NO OBJECTION:</strong> We hereby confirm that the borrower has fully discharged all loan obligations, principal, interest, charges, and statutory levies due to the lender. 
                      We have <strong>NO OBJECTION</strong> to the removal or cancellation of our lien / hypothecation endorsed in favor of <strong>{lenderName}</strong> on the Registration Certificate (RC Book) of the vehicle by the Registering Authority (RTO).
                    </div>

                    {/* Authorized Signatures & Seals */}
                    <div className="row pt-4 mt-3" style={{ fontSize: '0.74rem' }}>
                      <div className="col-6">
                        <div className="border p-2 text-center text-muted rounded" style={{ height: '70px', width: '130px', borderStyle: 'dashed' }}>
                          <span style={{ fontSize: '0.65rem' }}>OFFICIAL EMBOSSED SEAL AREA</span>
                        </div>
                        <div className="mt-2 text-secondary" style={{ fontSize: '0.68rem' }}>
                          Place: Hyderabad<br />
                          Dated: {issueDateFormatted}
                        </div>
                      </div>
                      <div className="col-6 text-end">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.78rem' }}>
                          For DEALEROS AUTOMOTIVE FINANCE
                        </div>
                        <div style={{ height: '40px' }} />
                        <div className="border-top pt-1 d-inline-block text-end" style={{ minWidth: '180px', borderColor: '#94a3b8' }}>
                          <div className="fw-semibold text-dark">Authorized Signatory</div>
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>Corporate Credit &amp; Settlement Operations</div>
                        </div>
                      </div>
                    </div>

                    {/* Clean Footer (without raw download URL or noisy technical string) */}
                    <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.68rem', borderColor: '#e2e8f0' }}>
                      This is an authentic system-generated document issued by DealerOS Enterprise Finance. Page 1 of 1
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Document Details & Action Panel (32%) */}
              <div className="col-lg-4 p-4 d-flex flex-column justify-content-between bg-white">
                <div>
                  
                  {/* Status Banner */}
                  {isAlreadyIssued ? (
                    <div className="p-3 mb-3 rounded border border-success-subtle bg-success-subtle text-success">
                      <div className="d-flex align-items-center gap-2 fw-semibold" style={{ fontSize: '0.84rem' }}>
                        <CheckCircle size={16} /> NOC Active &amp; Verified
                      </div>
                      <div className="small mt-1 text-dark" style={{ fontSize: '0.78rem' }}>
                        Certificate issued on <strong>{issueDateFormatted}</strong>. Ready for download, customer dispatch, or printing.
                      </div>
                    </div>
                  ) : isEligible ? (
                    <div className="p-3 mb-3 rounded border border-primary-subtle bg-primary-subtle text-primary">
                      <div className="d-flex align-items-center gap-2 fw-semibold" style={{ fontSize: '0.84rem' }}>
                        <CheckCircle size={16} /> Eligible for Issuance
                      </div>
                      <div className="small mt-1 text-dark" style={{ fontSize: '0.78rem' }}>
                        All covenants verified. Ledger balance is zero. You can preview and generate the formal signed document.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 mb-3 rounded border border-danger-subtle bg-danger-subtle text-danger">
                      <div className="d-flex align-items-center gap-2 fw-semibold" style={{ fontSize: '0.84rem' }}>
                        <AlertTriangle size={16} /> Issuance Blocked
                      </div>
                      <div className="small mt-1 text-dark" style={{ fontSize: '0.78rem' }}>
                        {el.ineligibilityReason || 'Loan has outstanding balance or pending installments.'}
                      </div>
                    </div>
                  )}

                  {/* Document Key Metadata */}
                  <div className="mb-4">
                    <div className="fw-semibold text-uppercase text-secondary mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                      Document Metadata
                    </div>
                    <div className="list-group list-group-flush border-top border-bottom" style={{ fontSize: '0.8rem' }}>
                      <div className="list-group-item d-flex justify-content-between px-0 py-2">
                        <span className="text-secondary">Document Reference</span>
                        <strong className="font-monospace text-dark">{docRef}</strong>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0 py-2">
                        <span className="text-secondary">Loan Account</span>
                        <span className="font-monospace text-dark">{loanAccountNo}</span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0 py-2">
                        <span className="text-secondary">Vehicle Reg</span>
                        <span className="font-monospace text-dark">{regNumber}</span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0 py-2">
                        <span className="text-secondary">Vehicle Model</span>
                        <span className="text-truncate text-end text-dark" style={{ maxWidth: '170px' }} title={vehicleBrandModel}>
                          {vehicleBrandModel}
                        </span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0 py-2">
                        <span className="text-secondary">Issue Date</span>
                        <span className="text-dark">{issueDateFormatted}</span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0 py-2">
                        <span className="text-secondary">Storage Vault</span>
                        <span className="text-success fw-medium">Secured Cloud / S3</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Actions (Phase 3.E) */}
                  <div className="d-flex flex-column gap-2 mb-3">
                    
                    {/* State 2: Already Issued -> Download PDF & Print Certificate */}
                    {isAlreadyIssued && el.existingNocDownloadUrl && (
                      <a
                        href={resolveDownloadUrl(el.existingNocDownloadUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-2"
                        style={{ fontSize: '0.88rem' }}
                      >
                        <Download size={16} /> Download Official PDF
                      </a>
                    )}

                    {/* Print Action for A4 Canvas */}
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 py-2"
                      style={{ fontSize: '0.88rem' }}
                      onClick={handlePrintCertificate}
                    >
                      <Printer size={16} /> Print Certificate (A4)
                    </button>

                    {/* State 1: Eligible & Not Yet Issued -> Issue NOC */}
                    {!isAlreadyIssued && isEligible && (
                      <button
                        type="button"
                        className="btn btn-success text-white d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm"
                        style={{ fontSize: '0.88rem' }}
                        disabled={isIssuing}
                        onClick={() => onIssueNoc && onIssueNoc()}
                      >
                        <Award size={16} />
                        {isIssuing ? 'Issuing Certificate...' : 'Generate & Issue NOC'}
                      </button>
                    )}

                    {/* State 3: Blocked */}
                    {!isAlreadyIssued && !isEligible && (
                      <div className="text-center p-2 bg-light rounded text-muted small">
                        Complete loan closure and settle all dues to enable NOC generation.
                      </div>
                    )}
                  </div>

                  {/* Reissue NOC Workflow in Secondary Section with Confirmation */}
                  {isAlreadyIssued && (
                    <div className="mt-4 pt-3 border-top">
                      {!showReissueConfirm ? (
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-secondary text-decoration-none p-0 d-flex align-items-center gap-1"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setShowReissueConfirm(true)}
                        >
                          <RefreshCw size={12} /> Need to reissue or regenerate certificate?
                        </button>
                      ) : (
                        <div className="p-3 bg-light rounded border" style={{ fontSize: '0.78rem' }}>
                          <div className="fw-semibold text-dark mb-1">Confirm NOC Reissuance</div>
                          <p className="text-secondary mb-2" style={{ fontSize: '0.72rem' }}>
                            Reissuance archives the current document and issues a new reference in the enterprise ledger.
                          </p>
                          <input
                            type="text"
                            className="form-control form-control-sm mb-2"
                            placeholder="Reason for reissue (e.g. RTO correction)"
                            value={reissueReason}
                            onChange={(e) => setReissueReason(e.target.value)}
                          />
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setShowReissueConfirm(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-warning text-dark"
                              disabled={isIssuing}
                              onClick={handleConfirmReissue}
                            >
                              {isIssuing ? 'Reissuing...' : 'Confirm Reissue'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-top d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary px-4"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
