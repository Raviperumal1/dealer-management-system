import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { financeService } from '../../services/financeService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import {
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Building,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Percent,
  TrendingUp,
  Download,
  Printer,
  Award,
  FileCheck,
  Upload,
  FolderOpen,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import NocCertificateModal from './NocCertificateModal';

export function FinanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasPermission, isAdmin } = usePermission();
  const canPayEmi = isAdmin || hasPermission('FINANCE', 'EDIT');

  const [finance, setFinance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pay EMI modal / confirmation
  const [payingEmi, setPayingEmi] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [emiPaymentDate, setEmiPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [emiPaymentMethod, setEmiPaymentMethod] = useState('BANK_TRANSFER');
  const [emiPaymentRef, setEmiPaymentRef] = useState('');

  // Foreclosure Quote & Loan Closure Modal
  const [showForeclosureModal, setShowForeclosureModal] = useState(false);
  const [foreclosureQuote, setForeclosureQuote] = useState(null);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isClosingLoan, setIsClosingLoan] = useState(false);
  const [closurePaymentRef, setClosurePaymentRef] = useState('');
  const [closureRemarks, setClosureRemarks] = useState('');
  const [settlementAmountPaid, setSettlementAmountPaid] = useState('');
  const [authorizedWaiver, setAuthorizedWaiver] = useState('0');

  // Active Schedule Tab ('schedule' | 'history' | 'overdue' | 'ledger' | 'documents')
  const [detailTab, setDetailTab] = useState('schedule');
  const [loanLedger, setLoanLedger] = useState([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // In-tab Loan Documents
  const [loanDocs, setLoanDocs] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocCategory, setUploadDocCategory] = useState('LOAN');
  const [uploadDocType, setUploadDocType] = useState('AGREEMENT');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadDocNotes, setUploadDocNotes] = useState('');
  const [uploadDocFile, setUploadDocFile] = useState(null);

  const [eligibility, setEligibility] = useState(null);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);

  // NOC Eligibility & Issuance State
  const [nocEligibility, setNocEligibility] = useState(null);
  const [isCheckingNoc, setIsCheckingNoc] = useState(false);
  const [isIssuingNoc, setIsIssuingNoc] = useState(false);
  const [showNocModal, setShowNocModal] = useState(false);

  const fetchLoanDocs = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await financeService.getLoanDocuments({ loanId: id, size: 50 });
      setLoanDocs(res.content || []);
    } catch (err) {
      console.warn('Failed to load loan documents', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUploadLoanDoc = async (e) => {
    e.preventDefault();
    if (!uploadDocFile) {
      dispatch(addToast({ type: 'error', message: 'Please select a file to upload' }));
      return;
    }
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadDocFile);
      formData.append('category', uploadDocCategory);
      formData.append('documentType', uploadDocType);
      formData.append('title', uploadDocTitle || uploadDocFile.name);
      formData.append('notes', uploadDocNotes);

      await financeService.uploadLoanDocument(id, formData);
      dispatch(
        addToast({
          type: 'success',
          title: 'Document Uploaded',
          message: `${uploadDocTitle || uploadDocFile.name} added to loan vault.`,
        })
      );
      setShowUploadModal(false);
      setUploadDocFile(null);
      setUploadDocTitle('');
      setUploadDocNotes('');
      fetchLoanDocs();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to upload document' }));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const fetchFinanceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await financeService.getFinanceById(id);
      setFinance(data);
      if (data && data.status === 'ACTIVE') {
        setIsLoadingEligibility(true);
        financeService.getPreclosureEligibility(id)
          .then(setEligibility)
          .catch((e) => console.warn('Could not load preclosure eligibility', e))
          .finally(() => setIsLoadingEligibility(false));
      }
      if (data) {
        setIsCheckingNoc(true);
        financeService.checkNocEligibility(id)
          .then(setNocEligibility)
          .catch((e) => console.warn('Could not check NOC eligibility', e))
          .finally(() => setIsCheckingNoc(false));
      }
    } catch (err) {
      setError(err.message || 'Failed to load loan amortization schedule');
    } finally {
      setIsLoading(false);
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

  const handleIssueNoc = async () => {
    setIsIssuingNoc(true);
    try {
      const res = await financeService.issueNoc(id);
      dispatch(
        addToast({
          type: 'success',
          title: 'NOC Issued',
          message: `Official No Objection Certificate #${res.documentReference} issued successfully!`,
        })
      );
      setShowNocModal(false);
      fetchFinanceData();
      fetchLoanDocs();
      if (res.downloadUrl) {
        window.open(resolveDownloadUrl(res.downloadUrl), '_blank');
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to issue NOC' }));
    } finally {
      setIsIssuingNoc(false);
    }
  };

  const fetchLedgerData = async () => {
    setIsLoadingLedger(true);
    try {
      const ledgerEntries = await financeService.getLoanLedger(id);
      setLoanLedger(ledgerEntries || []);
    } catch (err) {
      console.error('Failed to load loan ledger', err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
    fetchLedgerData();
    fetchLoanDocs();
  }, [id]);

  const handleOpenPayModal = (emi) => {
    setPayingEmi(emi);
    setEmiPaymentDate(new Date().toISOString().split('T')[0]);
    setEmiPaymentMethod('BANK_TRANSFER');
    setEmiPaymentRef(`EMI-UTR-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmPayEmi = async () => {
    if (!payingEmi) return;
    setIsPaying(true);
    try {
      await financeService.recordDetailedEmiPayment(payingEmi.id, {
        amount: payingEmi.emiAmount,
        paymentDate: emiPaymentDate,
        paymentMethod: emiPaymentMethod,
        paymentReference: emiPaymentRef,
        notes: `Scheduled EMI #${payingEmi.installmentNumber} payment`,
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'EMI Paid',
          message: `EMI installment #${payingEmi.installmentNumber} recorded successfully with transaction ledger update.`,
        })
      );
      setPayingEmi(null);
      fetchFinanceData();
      fetchLedgerData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to record EMI payment' }));
    } finally {
      setIsPaying(false);
    }
  };

  // Generate foreclosure quote
  const handleOpenForeclosure = async () => {
    setShowForeclosureModal(true);
    setIsFetchingQuote(true);
    try {
      const quote = await financeService.getForeclosureQuote(id);
      setForeclosureQuote(quote);
      const rawPayable = Number(quote?.totalSettlementPayable ?? quote?.netSettlementAmount ?? 0);
      const roundedPayable = Math.round(rawPayable);
      setSettlementAmountPaid(String(roundedPayable));
      setAuthorizedWaiver('0');
      setClosurePaymentRef(`SETTLE-UTR-${Date.now().toString().slice(-6)}`);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to generate settlement quote' }));
    } finally {
      setIsFetchingQuote(false);
    }
  };

  // Execute full loan foreclosure & closure
  const handleExecuteClosure = async (e) => {
    e.preventDefault();
    if (!closurePaymentRef) {
      dispatch(addToast({ type: 'error', message: 'Please provide settlement transaction reference' }));
      return;
    }
    const payable = Math.round(Number(foreclosureQuote?.totalSettlementPayable ?? foreclosureQuote?.netSettlementAmount ?? 0));
    const paid = Math.round(Number(settlementAmountPaid || 0));
    const waiver = Math.round(Number(authorizedWaiver || 0));

    if (payable > 0 && paid + waiver < payable) {
      dispatch(addToast({
        type: 'error',
        title: 'Settlement Amount Mismatch',
        message: `Settlement payment (₹${paid}) + waiver (₹${waiver}) is less than required ₹${payable}. Zero or insufficient closure is prohibited.`
      }));
      return;
    }

    setIsClosingLoan(true);
    try {
      await financeService.closeLoan(id, {
        settlementPaymentReference: closurePaymentRef,
        settlementAmountPaid: paid,
        authorizedWaiver: waiver,
        closureRemarks: closureRemarks || 'Full loan foreclosure settlement received in showroom bank',
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Loan Account Closed',
          message: `Loan #${id} has been fully settled and closed with No-Dues clearance.`,
        })
      );
      setShowForeclosureModal(false);
      fetchFinanceData();
      fetchLedgerData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to close loan account' }));
    } finally {
      setIsClosingLoan(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loan Arrangement" subtitle="Loading amortization..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !finance) {
    return (
      <div>
        <PageHeader title="Loan Arrangement" />
        <ErrorState message={error || 'Loan arrangement not found'} onRetry={fetchFinanceData} />
      </div>
    );
  }

  const emiSchedule = finance.emiSchedule || [];
  const todayStr = new Date().toISOString().split('T')[0];

  const paidCount = emiSchedule.filter((e) => e.status === 'PAID').length;
  const overdueCount = emiSchedule.filter(
    (e) => e.status !== 'PAID' && e.dueDate && e.dueDate < todayStr
  ).length;

  const displayedEmis = emiSchedule.filter((emi) => {
    const isPaid = emi.status === 'PAID';
    const isOverdue = !isPaid && emi.dueDate && emi.dueDate < todayStr;
    if (detailTab === 'history') return isPaid;
    if (detailTab === 'overdue') return isOverdue;
    return true;
  });

  const progressPercent = finance.tenureMonths > 0 ? Math.round((paidCount / finance.tenureMonths) * 100) : 0;
  const isLoanActive = finance.status === 'ACTIVE';

  return (
    <div>
      <PageHeader
        title={`Vehicle Loan #${finance.id} — ${finance.financeCompany || finance.bankName || 'Dealership In-House Finance'}`}
        subtitle={`Customer: ${finance.customerName || 'N/A'} • Vehicle: ${formatRegNumber(finance.vehicleRegistrationNumber || finance.registrationNumber)} • Loan A/C: ${finance.loanAccountNumber || '—'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/finance' },
          { label: `#${finance.id}` },
        ]}
      >
        <div className="d-flex align-items-center gap-2">
          {/* Download Repayment Schedule PDF */}
          <a
            href={financeService.getRepaymentSchedulePdfUrl(finance.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 shadow-xs"
            title="Download printable Repayment Schedule PDF"
          >
            <Download size={14} /> Schedule PDF
          </a>

          {/* NOC Certificate Button */}
          {finance.status === 'CLOSED' ? (
            <button
              type="button"
              className="btn btn-sm btn-success d-flex align-items-center gap-1 shadow-xs text-white"
              onClick={() => setShowNocModal(true)}
              title="View or Issue No Objection Certificate (NOC)"
            >
              <Award size={14} /> {nocEligibility?.alreadyIssued ? 'View NOC Certificate' : 'Issue NOC Certificate'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-xs"
              onClick={() => setShowNocModal(true)}
              title="Check NOC Eligibility Requirements"
            >
              <Award size={14} /> Check NOC Status
            </button>
          )}

          {isLoanActive && canPayEmi && (
            <div className="d-inline-flex flex-column align-items-end">
              <button
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-1 shadow-xs ${
                  eligibility && !eligibility.eligible ? 'btn-outline-secondary' : 'btn-outline-danger'
                }`}
                disabled={eligibility ? !eligibility.eligible : false}
                title={eligibility && !eligibility.eligible ? eligibility.ineligibilityReason : 'Preclose & Settle Loan'}
                onClick={handleOpenForeclosure}
              >
                <ShieldCheck size={14} /> Preclose & Settle Loan
              </button>
            </div>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-xs"
            onClick={() => navigate('/finance')}
          >
            <ArrowLeft size={14} /> Back to Loans
          </button>
        </div>
      </PageHeader>

      {/* Preclosure Eligibility Status Banner */}
      {isLoanActive && eligibility && (
        <div className={`alert ${eligibility.eligible ? 'alert-info' : 'alert-warning'} py-2 px-3 rounded-3 mb-4 d-flex justify-content-between align-items-center shadow-xs border`} style={{ fontSize: '0.84rem' }}>
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={16} className={eligibility.eligible ? 'text-primary' : 'text-warning'} />
            <div>
              <strong>Preclosure Policy ({eligibility.policyVersion || 'v1.0'}): </strong>
              {eligibility.eligible ? (
                <span>
                  Account is eligible for early settlement through <strong>{formatDate(eligibility.eligibilityEndDate)}</strong> (Charge rate: {eligibility.applicableFeeRate}% on {eligibility.applicableFeeBasis?.toLowerCase()?.replace('_', ' ')}).
                </span>
              ) : (
                <span className="text-dark fw-semibold">
                  {eligibility.ineligibilityReason}
                </span>
              )}
            </div>
          </div>
          <span className={`badge ${eligibility.eligible ? 'bg-success' : 'bg-secondary'}`}>
            {eligibility.eligible ? 'ELIGIBLE' : 'WINDOW CLOSED'}
          </span>
        </div>
      )}

      {/* Summary KPI Cards — Uniform Premium Design Pattern */}
      <div className="row g-3 mb-4">
        {/* Card 1: Principal Outstanding */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-xs transition-all hover-lift"
            style={{ borderColor: '#e2e8f0', borderRadius: '16px' }}
          >
            <div>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted fw-semibold small text-uppercase tracking-wide" style={{ fontSize: '0.74rem' }}>
                  Principal Outstanding
                </span>
                <span className="p-2 bg-danger-subtle text-danger rounded-3 d-inline-flex align-items-center justify-content-center">
                  <CreditCard size={18} />
                </span>
              </div>
              <div className="fs-3 fw-bold text-danger font-monospace my-1">
                <MoneyDisplay amount={finance.principalOutstanding ?? finance.loanAmount} />
              </div>
            </div>
            <div className="pt-2 border-top mt-3 d-flex justify-content-between align-items-center text-muted small" style={{ fontSize: '0.78rem' }}>
              <span>Sanctioned Principal:</span>
              <span className="font-monospace fw-semibold text-dark">
                <MoneyDisplay amount={finance.loanAmount} />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly EMI */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-xs transition-all hover-lift"
            style={{ borderColor: '#e2e8f0', borderRadius: '16px' }}
          >
            <div>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted fw-semibold small text-uppercase tracking-wide" style={{ fontSize: '0.74rem' }}>
                  Monthly EMI Due
                </span>
                <span className="p-2 bg-primary-subtle text-primary rounded-3 d-inline-flex align-items-center justify-content-center">
                  <Calendar size={18} />
                </span>
              </div>
              <div className="fs-3 fw-bold text-primary font-monospace my-1">
                <MoneyDisplay amount={finance.emiAmount ?? finance.monthlyEmi} />
              </div>
            </div>
            <div className="pt-2 border-top mt-3 d-flex justify-content-between align-items-center text-muted small" style={{ fontSize: '0.78rem' }}>
              <span>Due: Day {finance.emiDueDay || 5}</span>
              <span className="badge bg-light text-dark border">
                {finance.interestRate}% p.a.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Repayment Progress */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-xs transition-all hover-lift"
            style={{ borderColor: '#e2e8f0', borderRadius: '16px' }}
          >
            <div>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted fw-semibold small text-uppercase tracking-wide" style={{ fontSize: '0.74rem' }}>
                  Amortization Progress
                </span>
                <span className="p-2 bg-success-subtle text-success rounded-3 d-inline-flex align-items-center justify-content-center">
                  <TrendingUp size={18} />
                </span>
              </div>
              <div className="d-flex align-items-baseline gap-2 my-1">
                <span className="fs-3 fw-bold text-dark font-monospace">
                  {paidCount} / {finance.tenureMonths}
                </span>
                <span className="small text-muted fw-semibold">EMIs ({progressPercent}%)</span>
              </div>
              <div className="progress mt-2" style={{ height: '7px', borderRadius: '4px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${progressPercent}%` }}
                  aria-valuenow={progressPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
            <div className="pt-2 border-top mt-3 d-flex justify-content-between align-items-center text-muted small" style={{ fontSize: '0.78rem' }}>
              <span>Remaining: <strong className="text-dark">{Math.max(0, finance.tenureMonths - paidCount)} EMIs</strong></span>
              <span>Paid: <strong className="text-success">{paidCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 4: Account Status */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-xs transition-all hover-lift"
            style={{ borderColor: '#e2e8f0', borderRadius: '16px' }}
          >
            <div>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted fw-semibold small text-uppercase tracking-wide" style={{ fontSize: '0.74rem' }}>
                  Account Status
                </span>
                <span className="p-2 bg-info-subtle text-info rounded-3 d-inline-flex align-items-center justify-content-center">
                  <Building size={18} />
                </span>
              </div>
              <div className="my-1 py-1">
                <StatusBadge status={finance.status} />
              </div>
            </div>
            <div className="pt-2 border-top mt-3 d-flex justify-content-between align-items-center text-muted small" style={{ fontSize: '0.78rem' }}>
              <span className="text-truncate" style={{ maxWidth: '140px' }}>
                {finance.financeCompany || 'In-House'}
              </span>
              <span className="font-monospace text-dark">
                {finance.status === 'CLOSED' ? `Closed ${formatDate(finance.closedDate)}` : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule & History Navigation Tabs */}
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn-sm ${detailTab === 'schedule' ? 'active shadow-xs' : 'text-muted'}`}
              onClick={() => setDetailTab('schedule')}
            >
              Amortization Schedule ({emiSchedule.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn-sm ${detailTab === 'history' ? 'active shadow-xs' : 'text-muted'}`}
              onClick={() => setDetailTab('history')}
            >
              Payment History Ledger ({paidCount})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn-sm ${detailTab === 'overdue' ? 'active shadow-xs' : 'text-muted'}`}
              onClick={() => setDetailTab('overdue')}
            >
              Overdue & Arrears ({overdueCount > 0 ? `${overdueCount}` : '0'})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn-sm ${detailTab === 'ledger' ? 'active shadow-xs' : 'text-muted'}`}
              onClick={() => setDetailTab('ledger')}
            >
              Loan Audit Ledger ({loanLedger.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn-sm ${detailTab === 'documents' ? 'active shadow-xs' : 'text-muted'}`}
              onClick={() => setDetailTab('documents')}
            >
              Loan & NOC Documents ({loanDocs.length})
            </button>
          </li>
        </ul>
        <span className="badge bg-light text-muted border">
          {paidCount} Settled • {emiSchedule.length - paidCount} Remaining
        </span>
      </div>

      {/* Content Table: Loan Audit Ledger, Documents Vault, or Amortization Schedule */}
      {detailTab === 'documents' ? (
        <div className="app-card">
          <div className="app-card-header d-flex justify-content-between align-items-center">
            <div>
              <h3 className="app-card-title mb-0">Loan & NOC Documents Vault</h3>
              <p className="text-muted small mb-0">
                Official agreements, payment receipts, customer KYC, and generated No Objection Certificates for this loan.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={fetchLoanDocs}
                disabled={isLoadingDocs}
              >
                <FolderOpen size={14} /> Refresh
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload size={14} /> Upload Document
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="app-table table mb-0 font-monospace small">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Document Title & Ref</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>File Spec</th>
                  <th>Upload Date</th>
                  <th>Verification</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingDocs ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted small">
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Loading loan documents repository...
                    </td>
                  </tr>
                ) : loanDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted small">
                      No documents uploaded or generated for this loan yet.
                    </td>
                  </tr>
                ) : (
                  loanDocs.map((doc, idx) => (
                    <tr key={doc.id || idx}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <div className="fw-semibold text-dark font-sans">{doc.title}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Ref: {doc.documentReference}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{doc.category}</span>
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          {doc.documentType}
                        </span>
                      </td>
                      <td>
                        <div className="text-dark">
                          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'PDF'}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.70rem' }}>
                          {doc.contentType || 'application/pdf'}
                        </div>
                      </td>
                      <td className="text-muted">{formatDate(doc.createdAt || doc.issueDate)}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {doc.verificationStatus || 'VERIFIED'}
                        </span>
                      </td>
                      <td className="text-end">
                        {doc.downloadUrl ? (
                          <a
                            href={resolveDownloadUrl(doc.downloadUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary py-0 px-2 d-inline-flex align-items-center gap-1"
                            title="Download / View Document"
                          >
                            <Download size={12} /> View
                          </a>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : detailTab === 'ledger' ? (
        <div className="app-card">
          <div className="app-card-header d-flex justify-content-between align-items-center">
            <div>
              <h3 className="app-card-title mb-0">Authoritative Loan Transaction Ledger</h3>
              <p className="text-muted small mb-0">
                Immutable double-entry transaction history verifying every disbursement, EMI, penal charge, and settlement.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={fetchLedgerData}
              disabled={isLoadingLedger}
            >
              {isLoadingLedger ? 'Refreshing...' : 'Refresh Ledger'}
            </button>
          </div>
          <div className="table-responsive">
            <table className="app-table table mb-0 font-monospace small">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Posting Time</th>
                  <th>Type</th>
                  <th>Dir</th>
                  <th className="text-end">Principal</th>
                  <th className="text-end">Interest</th>
                  <th className="text-end">Fee/Penalty</th>
                  <th className="text-end">Balance After</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loanLedger.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-muted small">
                      {isLoadingLedger ? 'Loading loan transaction ledger...' : 'No ledger entries recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  loanLedger.map((entry) => (
                    <tr key={entry.id}>
                      <td className="fw-bold text-dark">{entry.transactionId}</td>
                      <td className="text-muted">{formatDate(entry.effectiveDate)}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {entry.transactionType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${entry.entryDirection === 'CREDIT' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`}>
                          {entry.entryDirection}
                        </span>
                      </td>
                      <td className="text-end"><MoneyDisplay amount={entry.principalPortion} /></td>
                      <td className="text-end"><MoneyDisplay amount={entry.interestPortion} /></td>
                      <td className="text-end">
                        <MoneyDisplay amount={Number(entry.feePortion || 0) + Number(entry.penaltyPortion || 0)} />
                      </td>
                      <td className="text-end fw-bold text-dark">
                        <MoneyDisplay amount={entry.principalBalanceAfter} />
                      </td>
                      <td className="text-muted text-truncate" style={{ maxWidth: '140px' }} title={entry.paymentReference}>
                        {entry.paymentReference || '—'}
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="app-card">
          <div className="app-card-header d-flex justify-content-between align-items-center">
            <div>
              <h3 className="app-card-title mb-0">
                {detailTab === 'history'
                  ? 'Historical Receipts & Settle Log'
                  : detailTab === 'overdue'
                  ? 'Overdue & Pending Arrears'
                  : 'Monthly EMI Amortization Schedule'}
              </h3>
              <p className="text-muted small mb-0">
                {detailTab === 'history'
                  ? 'Verified customer repayment history for settled loan installments'
                  : detailTab === 'overdue'
                  ? 'Installments that have crossed due date and require customer follow-up'
                  : 'Compound reducing balance breakdown of principal and interest per month'}
              </p>
            </div>
            <span className="badge bg-light text-muted border">
              {displayedEmis.length} Displayed
            </span>
          </div>
          <div className="table-responsive">
            <table className="app-table table mb-0">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>EMI #</th>
                  <th>Due Date</th>
                  <th className="text-end">Principal</th>
                  <th className="text-end">Interest</th>
                  <th className="text-end">Total EMI</th>
                  <th>Paid Date</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedEmis.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted small">
                      {detailTab === 'history'
                        ? 'No EMI installments have been paid yet for this loan.'
                        : detailTab === 'overdue'
                        ? 'No overdue installments! Customer repayment is completely up to date.'
                        : 'No scheduled installments found.'}
                    </td>
                  </tr>
                ) : (
                  displayedEmis.map((emi) => {
                    const isPaid = emi.status === 'PAID';
                    const isOverdue = !isPaid && emi.dueDate && emi.dueDate < todayStr;
                    return (
                      <tr key={emi.id} className={isOverdue ? 'table-danger-subtle' : ''}>
                        <td className="fw-bold font-monospace">#{emi.installmentNumber}</td>
                        <td>
                          <span className={isOverdue ? 'text-danger fw-bold' : ''}>
                            {formatDate(emi.dueDate)}
                          </span>
                        </td>
                        <td className="text-end text-muted">
                          <MoneyDisplay amount={emi.principalAmount} />
                        </td>
                        <td className="text-end text-muted">
                          <MoneyDisplay amount={emi.interestAmount} />
                        </td>
                        <td className="text-end fw-bold text-dark font-monospace">
                          <MoneyDisplay amount={emi.emiAmount} />
                        </td>
                        <td>{emi.paidDate ? formatDate(emi.paidDate) : '—'}</td>
                        <td>
                          {isPaid ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              PAID
                            </span>
                          ) : isOverdue ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              OVERDUE
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          {canPayEmi && !isPaid && isLoanActive && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success py-1 px-2 d-inline-flex align-items-center gap-1"
                              onClick={() => handleOpenPayModal(emi)}
                            >
                              <CheckCircle2 size={13} /> Settle EMI
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay EMI Modal */}
      {payingEmi && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg rounded-3 border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">
                  Record Installment #{payingEmi.installmentNumber} Payment
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setPayingEmi(null)}
                  disabled={isPaying}
                />
              </div>
              <div className="modal-body p-4 small">
                <div className="alert alert-primary-subtle text-primary border border-primary-subtle rounded-3 p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold">Installment Due:</span>
                    <span className="font-monospace fw-bold fs-6">
                      <MoneyDisplay amount={payingEmi.emiAmount} />
                    </span>
                  </div>
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                    <span>Principal: <MoneyDisplay amount={payingEmi.principalAmount} /></span>
                    <span>Interest: <MoneyDisplay amount={payingEmi.interestAmount} /></span>
                    <span>Due: {formatDate(payingEmi.dueDate)}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="emiPayDate">Payment Date *</label>
                  <input
                    id="emiPayDate"
                    type="date"
                    className="form-control"
                    value={emiPaymentDate}
                    onChange={(e) => setEmiPaymentDate(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="emiPayMethod">Payment Mode *</label>
                  <select
                    id="emiPayMethod"
                    className="form-select"
                    value={emiPaymentMethod}
                    onChange={(e) => setEmiPaymentMethod(e.target.value)}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CASH">Showroom Cash Counter</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="emiPayRef">Transaction / UTR Reference</label>
                  <input
                    id="emiPayRef"
                    type="text"
                    className="form-control font-monospace"
                    placeholder="e.g. UTR-2026-998811"
                    value={emiPaymentRef}
                    onChange={(e) => setEmiPaymentRef(e.target.value)}
                  />
                </div>

                <div className="text-muted small">
                  <span className="fw-semibold text-dark">Loan Preservation Note:</span> Recording this regular installment updates principal and leaves the loan active until all installments or early foreclosure is executed.
                </div>
              </div>
              <div className="modal-footer bg-light border-0">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setPayingEmi(null)}
                  disabled={isPaying}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success d-flex align-items-center gap-1"
                  onClick={handleConfirmPayEmi}
                  disabled={isPaying}
                >
                  {isPaying ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                      Saving Receipt...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Confirm & Mark Installment Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORECLOSURE QUOTE & LOAN CLOSURE MODAL */}
      {showForeclosureModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form onSubmit={handleExecuteClosure}>
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title h6 fw-bold mb-0">Prepayment Foreclosure & Loan Settlement Quotation</h5>
                    <span className="text-muted small">
                      Authoritative quote calculated per verified contract & Indian regulatory directions
                    </span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setShowForeclosureModal(false)} />
                </div>
                <div className="modal-body small">
                  {isFetchingQuote ? (
                    <div className="text-center py-4">
                      <span className="spinner-border spinner-border-sm me-2" />
                      Generating authoritative settlement quotation...
                    </div>
                  ) : foreclosureQuote ? (
                    <div>
                      {/* Quotation Policy & Expiry Banner */}
                      <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded mb-3 border">
                        <div>
                          <span className="fw-semibold text-dark">Policy: </span>
                          <span className="badge bg-secondary font-monospace">
                            {foreclosureQuote.policyCode || 'IN_HOUSE_STD_2026'}
                          </span>
                          {foreclosureQuote.isRbiForeclosureExempt && (
                            <span className="badge bg-success ms-2">RBI Nil Foreclosure (Individual Floating Rate)</span>
                          )}
                        </div>
                        <div className="text-muted">
                          Quote ID: <span className="font-monospace fw-bold">{foreclosureQuote.quotationId || '—'}</span>
                        </div>
                      </div>

                      <div className="alert alert-info py-2 px-3 rounded-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="fw-semibold">Authoritative Net Payable to Settle:</span>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              Valid through {formatDate(foreclosureQuote.quotationExpiryDate || foreclosureQuote.effectiveSettlementDate)}
                            </div>
                          </div>
                          <strong className="fs-4 text-dark font-monospace">
                            <MoneyDisplay amount={foreclosureQuote.totalSettlementPayable ?? foreclosureQuote.netSettlementAmount} />
                          </strong>
                        </div>
                      </div>

                      {/* Calculation Breakdown Table */}
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <div className="p-2 border rounded bg-white">
                            <span className="text-muted d-block">Principal Outstanding</span>
                            <strong className="font-monospace fs-6">
                              <MoneyDisplay amount={foreclosureQuote.principalOutstanding} />
                            </strong>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-2 border rounded bg-white">
                            <span className="text-muted d-block">Accrued Interest (Through Settlement Date)</span>
                            <strong className="font-monospace fs-6">
                              <MoneyDisplay amount={foreclosureQuote.accruedInterest} />
                            </strong>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-2 border rounded bg-white">
                            <span className="text-muted d-block">
                              Foreclosure Prepayment Fee ({foreclosureQuote.foreclosureChargePercentage ?? 2}%)
                            </span>
                            <strong className="font-monospace fs-6">
                              <MoneyDisplay amount={foreclosureQuote.foreclosureChargeAmount ?? foreclosureQuote.foreclosureCharge ?? 0} />
                            </strong>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-2 border rounded bg-white">
                            <span className="text-muted d-block">Overdue Arrears & Penal Charges</span>
                            <strong className="font-monospace fs-6 text-danger">
                              <MoneyDisplay amount={(Number(foreclosureQuote.overdueScheduledPrincipal || 0) + Number(foreclosureQuote.overdueRegularInterest || 0) + Number(foreclosureQuote.eligiblePenalCharges || 0)) || foreclosureQuote.overdueAmount || 0} />
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Settlement Payment & Verification Inputs */}
                      <div className="card bg-light border p-3 mb-3">
                        <h6 className="fw-bold mb-2">Verified Settlement Collection</h6>
                        <div className="row g-2">
                          <div className="col-6">
                            <label className="form-label" htmlFor="settlementAmountPaid">
                              Settlement Amount Received (₹) *
                            </label>
                            <input
                              id="settlementAmountPaid"
                              type="number"
                              step="1"
                              className="form-control font-monospace"
                              value={settlementAmountPaid}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSettlementAmountPaid(val === '' ? '' : String(Math.round(Number(val))));
                              }}
                              required
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label" htmlFor="authorizedWaiver">
                              Approved Waiver (₹)
                            </label>
                            <input
                              id="authorizedWaiver"
                              type="number"
                              step="1"
                              className="form-control font-monospace"
                              value={authorizedWaiver}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAuthorizedWaiver(val === '' ? '' : String(Math.round(Number(val))));
                              }}
                            />
                          </div>
                        </div>

                        <div className="row g-2 mt-1">
                          <div className="col-6">
                            <label className="form-label" htmlFor="closurePayRef">
                              Settlement Receipt / Bank Reference (UTR) *
                            </label>
                            <input
                              id="closurePayRef"
                              type="text"
                              className="form-control font-monospace"
                              value={closurePaymentRef}
                              onChange={(e) => setClosurePaymentRef(e.target.value)}
                              placeholder="e.g. UTR-HDFC-99281726"
                              required
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label" htmlFor="closureRemarks">
                              Closure Remarks / No-Dues Notes
                            </label>
                            <input
                              id="closureRemarks"
                              type="text"
                              className="form-control"
                              placeholder="e.g. Account fully settled by customer"
                              value={closureRemarks}
                              onChange={(e) => setClosureRemarks(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reconciliation Guard Indicator */}
                      {Math.round(Number(foreclosureQuote.totalSettlementPayable ?? foreclosureQuote.netSettlementAmount ?? 0)) > 0 &&
                       (Math.round(Number(settlementAmountPaid || 0)) + Math.round(Number(authorizedWaiver || 0))) < Math.round(Number(foreclosureQuote.totalSettlementPayable ?? foreclosureQuote.netSettlementAmount ?? 0)) && (
                        <div className="alert alert-danger py-2 px-3 rounded-2 mb-0">
                          <strong>Settlement Mismatch:</strong> Total payable is ₹{Math.round(Number(foreclosureQuote.totalSettlementPayable ?? foreclosureQuote.netSettlementAmount ?? 0))}. A positive loan balance cannot be closed without verified payment or approved waiver.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-danger">Unable to load quotation.</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowForeclosureModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-danger"
                    disabled={
                      isClosingLoan ||
                      isFetchingQuote ||
                      !foreclosureQuote ||
                      (Math.round(Number(foreclosureQuote.totalSettlementPayable ?? foreclosureQuote.netSettlementAmount ?? 0)) > 0 &&
                       (Math.round(Number(settlementAmountPaid || 0)) + Math.round(Number(authorizedWaiver || 0))) < Math.round(Number(foreclosureQuote.totalSettlementPayable ?? foreclosureQuote.netSettlementAmount ?? 0)))
                    }
                  >
                    {isClosingLoan ? 'Processing Closure...' : 'Confirm Full Settlement & Close Loan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Professional Two-Panel NOC Document Workspace */}
      <NocCertificateModal
        isOpen={showNocModal}
        onClose={() => setShowNocModal(false)}
        loanId={finance.id}
        nocEligibility={nocEligibility}
        isLoadingEligibility={isCheckingNoc}
        isIssuing={isIssuingNoc}
        onIssueNoc={handleIssueNoc}
        resolveDownloadUrl={resolveDownloadUrl}
      />
      {/* In-Loan Upload Document Modal */}
      {showUploadModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleUploadLoanDoc}>
                <div className="modal-header border-bottom py-3">
                  <h5 className="modal-title fw-semibold" style={{ fontSize: '1.05rem' }}>
                    Upload Document for Loan #{finance.id}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)} />
                </div>
                <div className="modal-body p-4">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="loanDocCat">Category *</label>
                      <select
                        id="loanDocCat"
                        className="form-select form-select-sm"
                        value={uploadDocCategory}
                        onChange={(e) => setUploadDocCategory(e.target.value)}
                      >
                        <option value="LOAN">Loan Agreement</option>
                        <option value="CUSTOMER">Customer KYC</option>
                        <option value="VEHICLE">Vehicle RC / Insurance</option>
                        <option value="PAYMENT">Payment Receipt</option>
                        <option value="CLOSURE">Closure Settlement</option>
                        <option value="NOC">NOC Release</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="loanDocType">Document Type *</label>
                      <select
                        id="loanDocType"
                        className="form-select form-select-sm"
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                      >
                        <option value="AGREEMENT">Loan Agreement</option>
                        <option value="SANCTION_LETTER">Sanction Letter</option>
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="RC_COPY">RC Copy</option>
                        <option value="INSURANCE">Insurance Policy</option>
                        <option value="RECEIPT">Payment Receipt</option>
                        <option value="NOC">NOC Certificate</option>
                        <option value="OTHER">Other Proof</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="loanDocTitle">
                      Document Title / Name *
                    </label>
                    <input
                      id="loanDocTitle"
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Borrower Signed Sanction Letter"
                      value={uploadDocTitle}
                      onChange={(e) => setUploadDocTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="loanDocFile">
                      Choose Document File (PDF, Image) *
                    </label>
                    <input
                      id="loanDocFile"
                      type="file"
                      className="form-control form-control-sm"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => setUploadDocFile(e.target.files[0])}
                      required
                    />
                  </div>

                  <div className="mb-0">
                    <label className="form-label" htmlFor="loanDocNotes">Notes</label>
                    <textarea
                      id="loanDocNotes"
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="e.g. Scanned copy verified against originals"
                      value={uploadDocNotes}
                      onChange={(e) => setUploadDocNotes(e.target.value)}
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
                    disabled={isUploadingDoc}
                  >
                    {isUploadingDoc ? 'Uploading...' : 'Upload & Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceDetailPage;
