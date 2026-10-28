import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { financeService } from '../../services/financeService';
import { customerService } from '../../services/customerService';
import { vehicleService } from '../../services/vehicleService';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import FilterBar from '../../components/common/FilterBar';
import SearchInput from '../../components/common/SearchInput';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import NavPillTabs from '../../components/common/NavPillTabs';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import {
  CreditCard,
  Eye,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Building,
  Calculator,
  ShieldCheck,
  TrendingUp,
  FileText,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
  XCircle,
  Settings,
  Sliders,
  Banknote,
} from 'lucide-react';
import './FinanceListPage.css';

export function FinanceListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View Tab: 'overview' | 'in-house' | 'applications' | 'overdue' | 'lenders' | 'calculator'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Shared Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination for in-house loans
  const {
    page,
    size,
    sortBy,
    sortDirection,
    handlePageChange,
    handleSizeChange,
    handleSort,
    resetPagination,
  } = usePagination(0, 10);

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [financeList, setFinanceList] = useState([]);
  const [overdueEmis, setOverdueEmis] = useState([]);
  const [applications, setApplications] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick Pay EMI state
  const [payingEmi, setPayingEmi] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  // Application workflow modal states
  const [sanctionModalApp, setSanctionModalApp] = useState(null);
  const [sanctionForm, setSanctionForm] = useState({
    sanctionedAmount: '',
    sanctionLetterRef: '',
    approvedRoi: '9.5',
    sanctionDate: new Date().toISOString().split('T')[0],
  });
  const [disburseModalApp, setDisburseModalApp] = useState(null);
  const [disburseForm, setDisburseForm] = useState({
    disbursedAmount: '',
    disbursementRef: '',
    dealerReceiptConfirmed: true,
    disbursementDate: new Date().toISOString().split('T')[0],
  });
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);

  // New Application Modal state
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [appForm, setAppForm] = useState({
    customerId: '',
    vehicleId: '',
    financeMethod: 'EXTERNAL_BANK',
    lenderId: '',
    applicantName: '',
    applicantPhone: '',
    panNumber: '',
    declaredIncome: '',
    employmentType: 'SALARIED',
    requestedLoanAmount: '',
    customerDownPayment: '',
    tenureMonths: '36',
    notes: '',
  });
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Standalone EMI Calculator state
  const [calcForm, setCalcForm] = useState({
    saleAmount: 650000,
    downPayment: 150000,
    tradeInCredit: 0,
    annualInterestRate: 9.5,
    tenureMonths: 36,
    processingFee: 5000,
    capitalizeFee: false,
  });
  const [calcResult, setCalcResult] = useState(null);

  // Policy Engine & Preclosure Rate Dashboard State
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState(false);

  // New Partner & Policy Modal States
  const [showNewLenderModal, setShowNewLenderModal] = useState(false);
  const [isCreatingLender, setIsCreatingLender] = useState(false);
  const [lenderForm, setLenderForm] = useState({
    name: '',
    lenderCode: '',
    lenderType: 'BANK',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    supportedVehicleTypes: 'ALL',
    minTenureMonths: 12,
    maxTenureMonths: 84,
    indicativeInterestRate: 8.75,
    processingFeePercentage: 1.0,
    dealerCommissionPercentage: 80.0,
    commissionPayoutBasis: 'PERCENTAGE_OF_PROCESSING_FEE',
    notes: '',
  });

  const [showNewPolicyModal, setShowNewPolicyModal] = useState(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    policyCode: '',
    policyVersion: '1.0',
    borrowerCategory: 'INDIVIDUAL',
    interestRateType: 'FIXED',
    foreclosureChargeRate: 2.0,
    annualRatePercentage: 24.0,
    gracePeriodDays: 3,
    perEventCap: 5000,
    minCharge: 100,
    preclosureEnabled: true,
    eligibilityPeriodMonths: 3,
    eligibilityStartBasis: 'COMMENCEMENT_DATE',
    inclusiveEndDateRule: true,
    feeCalculationBase: 'OUTSTANDING_PRINCIPAL',
    rbiFloatingRateForeclosureExempt: false,
    disclosureText: '',
  });

  // Lender Commission State
  const [commissions, setCommissions] = useState([]);
  const [commissionMetrics, setCommissionMetrics] = useState(null);
  const [showNewCommModal, setShowNewCommModal] = useState(false);
  const [isBookingComm, setIsBookingComm] = useState(false);
  const [selectedLenderFilter, setSelectedLenderFilter] = useState('');
  const [lenderApplications, setLenderApplications] = useState([]);
  const [isLoadingLenderApps, setIsLoadingLenderApps] = useState(false);
  const [commForm, setCommForm] = useState({
    lenderId: '',
    loanApplicationId: '',
    saleId: '',
    entryDate: new Date().toISOString().split('T')[0],
    calculationMethod: 'PERCENTAGE_OF_PROCESSING_FEE',
    baseAmount: '',
    commissionRatePercentage: '',
    fixedCommissionRate: '',
    tdsPercentage: 0,
    approvedAdjustments: 0,
    agreementReference: '',
    policyVersion: '1.0',
    entryMode: 'LOAN_LINKED',
    manualEntryReason: '',
    notes: '',
  });
  const [commPreview, setCommPreview] = useState(null);
  const [receiptModalComm, setReceiptModalComm] = useState(null);
  const [receiptForm, setReceiptForm] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    totalReceivedAmount: '',
    paymentMethod: 'BANK_TRANSFER',
    bankUtrReference: '',
    bankName: '',
    tdsDeductedByBank: 0,
    reconciliationNotes: '',
  });
  const [isRecordingReceipt, setIsRecordingReceipt] = useState(false);
  const [invoiceModalComm, setInvoiceModalComm] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
  });

  // Load KPI Metrics
  const loadMetrics = async () => {
    try {
      const data = await financeService.getFinanceMetrics();
      setMetrics(data);
    } catch (e) {
      console.warn('Could not load finance dashboard metrics', e);
    }
  };

  // Main Data Fetcher
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        await Promise.all([
          loadMetrics(),
          financeService.getOverdueEmis().then(setOverdueEmis).catch(() => []),
          financeService.getApplications({ page: 0, size: 5 }).then((res) => setApplications(res?.content || [])).catch(() => []),
          financeService.getAllFinance({ page: 0, size: 5 }).then((res) => setFinanceList(res?.content || [])).catch(() => []),
        ]);
      } else if (activeTab === 'in-house') {
        const res = await financeService.getAllFinance({
          status: statusFilter || undefined,
          search: searchTerm || undefined,
          page,
          size,
          sortBy,
          sortDirection,
        });
        setFinanceList(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      } else if (activeTab === 'applications') {
        const res = await financeService.getApplications({
          status: statusFilter || undefined,
          search: searchTerm || undefined,
          page,
          size,
        });
        setApplications(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      } else if (activeTab === 'overdue') {
        const data = await financeService.getOverdueEmis();
        setOverdueEmis(data || []);
      } else if (activeTab === 'lenders') {
        const data = await financeService.getLenders();
        setLenders(Array.isArray(data) ? data : data?.content || []);
      } else if (activeTab === 'policies') {
        const data = await financeService.getPolicies();
        setPolicies(data || []);
      } else if (activeTab === 'commissions') {
        const [commRes, metricsRes, lendersData] = await Promise.all([
          financeService.getCommissions({
            lenderId: selectedLenderFilter || undefined,
            status: statusFilter || undefined,
            search: searchTerm || undefined,
            page,
            size,
            sortBy,
            sortDirection,
          }),
          financeService.getCommissionMetrics().catch(() => null),
          lenders.length === 0 ? financeService.getLenders().catch(() => []) : Promise.resolve(lenders),
        ]);
        setCommissions(commRes?.content || []);
        setTotalPages(commRes?.totalPages || 1);
        setTotalElements(commRes?.totalElements || 0);
        if (metricsRes) setCommissionMetrics(metricsRes);
        if (lendersData && Array.isArray(lendersData) && lendersData.length > 0 && lenders.length === 0) {
          setLenders(lendersData);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load finance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, page, size, sortBy, sortDirection, statusFilter, searchTerm]);

  // Load vehicles and customers when opening new application modal
  useEffect(() => {
    if (showNewAppModal) {
      Promise.all([
        vehicleService.getAvailableVehicles({ size: 100 }),
        customerService.getAllCustomers({ size: 100 }),
        financeService.getLenders(),
      ]).then(([vRes, cRes, lRes]) => {
        setAvailableVehicles(vRes.content || []);
        setCustomers(cRes.content || []);
        const lendersList = Array.isArray(lRes) ? lRes : lRes?.content || [];
        setLenders(lendersList);
        if (lendersList.length > 0 && !appForm.lenderId) {
          setAppForm((prev) => ({ ...prev, lenderId: String(lendersList[0].id) }));
        }
      }).catch(console.error);
    }
  }, [showNewAppModal]);

  // Load applications for selected lender in commission booking modal
  const loadApplicationsForLender = async (lenderId) => {
    if (!lenderId) {
      setLenderApplications([]);
      return;
    }
    setIsLoadingLenderApps(true);
    try {
      const res = await financeService.getApplications({ size: 100 });
      const allApps = res?.content || (Array.isArray(res) ? res : []);
      // Filter for this partner and eligible states (DISBURSED or SANCTIONED)
      const matching = allApps.filter((app) => {
        const matchesLender = String(app.lenderId) === String(lenderId) ||
          (app.lenderName && lenders.find((l) => String(l.id) === String(lenderId))?.name === app.lenderName);
        return matchesLender && (app.status === 'DISBURSED' || app.status === 'SANCTIONED');
      });
      setLenderApplications(matching);
    } catch (err) {
      console.warn('Could not load applications for lender', err);
      setLenderApplications([]);
    } finally {
      setIsLoadingLenderApps(false);
    }
  };

  // Ensure lenders are fresh when opening Book Commission Modal
  useEffect(() => {
    if (showNewCommModal) {
      financeService.getLenders()
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.content || [];
          setLenders(list);
          if (list.length > 0 && !commForm.lenderId) {
            const first = list[0];
            setCommForm((prev) => ({
              ...prev,
              lenderId: String(first.id),
              commissionRatePercentage: first.dealerCommissionPercentage ? String(first.dealerCommissionPercentage) : '80',
              agreementReference: first.lenderCode ? `AGR-${first.lenderCode}` : '',
            }));
            loadApplicationsForLender(String(first.id));
          } else if (commForm.lenderId) {
            loadApplicationsForLender(commForm.lenderId);
          }
        })
        .catch((err) => console.error('Failed to load lenders for modal', err));
    }
  }, [showNewCommModal]);

  // EMI Calculator Live Execution with validation guard and debounce
  const runCalculator = async () => {
    const saleAmount = Number(calcForm.saleAmount);
    const downPayment = Number(calcForm.downPayment);
    const tradeInCredit = Number(calcForm.tradeInCredit || 0);
    const annualInterestRate = Number(calcForm.annualInterestRate);
    const tenureMonths = Number(calcForm.tenureMonths);
    const processingFee = Number(calcForm.processingFee || 0);

    // Prevent submitting invalid intermediate values (e.g. while typing, empty, negative, or zero price)
    if (!saleAmount || saleAmount <= 0 || isNaN(saleAmount)) return;
    if (isNaN(downPayment) || downPayment < 0) return;
    if (isNaN(annualInterestRate) || annualInterestRate < 0) return;
    if (!tenureMonths || tenureMonths < 1 || isNaN(tenureMonths)) return;

    try {
      const res = await financeService.calculateEmi({
        saleAmount,
        downPayment,
        tradeInCredit,
        annualInterestRate,
        tenureMonths,
        processingFee,
        capitalizeFee: Boolean(calcForm.capitalizeFee),
      });
      setCalcResult(res);
    } catch (err) {
      // Don't flood toasts on live calculator typing
      console.warn('Calculator evaluation failed', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'calculator') {
      const timer = setTimeout(() => {
        runCalculator();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTab, calcForm]);

  // Handle Quick Pay EMI
  const handleConfirmPayEmi = async () => {
    if (!payingEmi) return;
    setIsPaying(true);
    try {
      await financeService.recordEmiPayment(payingEmi.id);
      dispatch(
        addToast({
          type: 'success',
          title: 'EMI Settled',
          message: `EMI installment #${payingEmi.installmentNumber} marked as PAID.`,
        })
      );
      setPayingEmi(null);
      fetchData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Payment failed' }));
    } finally {
      setIsPaying(false);
    }
  };

  // Submit Sanction
  const handleSanctionSubmit = async (e) => {
    e.preventDefault();
    if (!sanctionModalApp) return;
    setIsSubmittingWorkflow(true);
    try {
      await financeService.sanctionApplication(sanctionModalApp.id, {
        sanctionedAmount: Number(sanctionForm.sanctionedAmount),
        sanctionLetterReference: sanctionForm.sanctionLetterRef,
        approvedRoi: Number(sanctionForm.approvedRoi),
        sanctionDate: sanctionForm.sanctionDate,
      });
      dispatch(addToast({ type: 'success', title: 'Application Sanctioned', message: `Loan sanctioned successfully for ₹${sanctionForm.sanctionedAmount}` }));
      setSanctionModalApp(null);
      fetchData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Sanction failed' }));
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  // Submit Disbursement
  const handleDisburseSubmit = async (e) => {
    e.preventDefault();
    if (!disburseModalApp) return;
    setIsSubmittingWorkflow(true);
    try {
      await financeService.disburseApplication(disburseModalApp.id, {
        disbursedAmount: Number(disburseForm.disbursedAmount),
        disbursementReference: disburseForm.disbursementRef,
        dealerReceiptConfirmed: Boolean(disburseForm.dealerReceiptConfirmed),
        disbursementDate: disburseForm.disbursementDate,
      });
      dispatch(addToast({ type: 'success', title: 'Disbursement Recorded', message: `Lender funds of ₹${disburseForm.disbursedAmount} recorded into dealership settlement.` }));
      setDisburseModalApp(null);
      fetchData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Disbursement recording failed' }));
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  // Submit New Finance Application
  const handleNewAppSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingWorkflow(true);
    try {
      await financeService.createApplication({
        customerId: Number(appForm.customerId),
        vehicleId: appForm.vehicleId ? Number(appForm.vehicleId) : null,
        financeMethod: appForm.financeMethod,
        lenderId: appForm.lenderId ? Number(appForm.lenderId) : null,
        applicantName: appForm.applicantName,
        applicantPhone: appForm.applicantPhone,
        panNumber: appForm.panNumber,
        declaredIncome: appForm.declaredIncome ? Number(appForm.declaredIncome) : null,
        employmentType: appForm.employmentType,
        requestedLoanAmount: Number(appForm.requestedLoanAmount),
        customerDownPayment: Number(appForm.customerDownPayment || 0),
        tenureMonths: Number(appForm.tenureMonths),
        notes: appForm.notes,
      });
      dispatch(addToast({ type: 'success', title: 'Application Created', message: 'Customer finance file submitted for verification and sanction.' }));
      setShowNewAppModal(false);
      handleTabChange('applications');
      fetchData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to submit finance application' }));
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Automotive Finance & Loan Operations"
        subtitle="In-house loan amortization, external lender approvals, EMI collections, and settlement closures"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance' },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-xs"
          onClick={() => setShowNewAppModal(true)}
        >
          <Plus size={14} /> New Finance File
        </button>
      </PageHeader>

      {/* UNIFORM HORIZONTAL CAPSULE TAB NAVIGATION */}
      <NavPillTabs
        tabs={[
          {
            id: 'overview',
            label: 'Finance Overview',
            icon: <Layers size={14} />,
            isActive: activeTab === 'overview',
            onClick: () => handleTabChange('overview'),
          },
          {
            id: 'in-house',
            label: 'In-House Loans',
            icon: <CreditCard size={14} />,
            isActive: activeTab === 'in-house',
            onClick: () => handleTabChange('in-house'),
            badge: Number(metrics?.activeInHouseLoans || metrics?.activeLoans || 0) > 0
              ? (metrics?.activeInHouseLoans || metrics?.activeLoans)
              : null,
            badgeVariant: 'neutral',
          },
          {
            id: 'applications',
            label: 'Bank / NBFC Files',
            icon: <Briefcase size={14} />,
            isActive: activeTab === 'applications',
            onClick: () => handleTabChange('applications'),
            badge: Number(metrics?.pendingApplications || 0) > 0 ? metrics?.pendingApplications : null,
            badgeVariant: 'neutral',
          },
          {
            id: 'overdue',
            label: 'Overdue EMIs',
            icon: <AlertTriangle size={14} />,
            isActive: activeTab === 'overdue',
            onClick: () => handleTabChange('overdue'),
            badge: Number(metrics?.overdueInHouseInstalments || metrics?.overdueEmisCount || 0) > 0
              ? (metrics?.overdueInHouseInstalments || metrics?.overdueEmisCount)
              : null,
            badgeVariant: 'accent', // Red notification badge
          },
          {
            id: 'lenders',
            label: 'Lenders & Partners',
            icon: <Building size={14} />,
            isActive: activeTab === 'lenders',
            onClick: () => handleTabChange('lenders'),
          },
          {
            id: 'calculator',
            label: 'EMI Engine',
            icon: <Calculator size={14} />,
            isActive: activeTab === 'calculator',
            onClick: () => handleTabChange('calculator'),
          },
          {
            id: 'commissions',
            label: 'Lender Commissions',
            icon: <DollarSign size={14} />,
            isActive: activeTab === 'commissions',
            onClick: () => handleTabChange('commissions'),
          },
          {
            id: 'policies',
            label: 'Policies & Preclosure',
            icon: <Sliders size={14} />,
            isActive: activeTab === 'policies',
            onClick: () => handleTabChange('policies'),
          },
        ]}
      />

      {/* Main Tab Content Panel */}
      <div className="finance-tab-content mb-4">

      {/* TAB 1: OVERVIEW & PORTFOLIO KPIS */}
      {activeTab === 'overview' && (
        <div>
          {/* Executive Finance Portfolio Metrics Ribbon */}
          <div className="finance-kpi-grid">
            {/* 1. Active In-House Portfolio */}
            <div className="finance-kpi-card kpi-blue">
              <div>
                <div className="finance-kpi-header">
                  <span className="finance-kpi-title">Active In-House Portfolio</span>
                  <span className="finance-kpi-badge badge-neutral">In-House</span>
                </div>
                <div className="finance-kpi-value-row">
                  <div className="finance-kpi-amount">
                    <MoneyDisplay amount={metrics?.totalPrincipalOutstanding ?? metrics?.totalInHousePrincipalOutstanding ?? 0} />
                  </div>
                  <div className="finance-kpi-icon-pill" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                    <CreditCard size={18} />
                  </div>
                </div>
              </div>
              <div className="finance-kpi-footer">
                <span>Active: <strong>{metrics?.activeLoans ?? metrics?.activeInHouseLoans ?? 0}</strong></span>
                <span>Closed: <strong>{metrics?.closedLoans ?? 0}</strong></span>
              </div>
            </div>

            {/* 2. EMI Collections */}
            <div className="finance-kpi-card kpi-emerald">
              <div>
                <div className="finance-kpi-header">
                  <span className="finance-kpi-title">EMI Collection This Month</span>
                  <span className="finance-kpi-badge badge-success">Repayments</span>
                </div>
                <div className="finance-kpi-value-row">
                  <div className="finance-kpi-amount amount-success">
                    <MoneyDisplay amount={metrics?.totalCollectionsThisMonth ?? 0} />
                  </div>
                  <div className="finance-kpi-icon-pill" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                    <TrendingUp size={18} />
                  </div>
                </div>
              </div>
              <div className="finance-kpi-footer">
                <span>Lifetime Repaid</span>
                <strong><MoneyDisplay amount={metrics?.totalAmountRepaidCumulative ?? 0} /></strong>
              </div>
            </div>

            {/* 3. Bank Disbursements Received */}
            <div className="finance-kpi-card kpi-cyan">
              <div>
                <div className="finance-kpi-header">
                  <span className="finance-kpi-title">Disbursements Received</span>
                  <span className="finance-kpi-badge badge-neutral">External</span>
                </div>
                <div className="finance-kpi-value-row">
                  <div className="finance-kpi-amount">
                    <MoneyDisplay amount={metrics?.totalDisbursedThisMonth ?? 0} />
                  </div>
                  <div className="finance-kpi-icon-pill" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
                    <Building size={18} />
                  </div>
                </div>
              </div>
              <div className="finance-kpi-footer">
                <span>Awaiting Disbursal</span>
                <strong>{metrics?.pendingApplications ?? 0} files</strong>
              </div>
            </div>

            {/* 4. Overdue Portfolio At Risk */}
            <div className="finance-kpi-card kpi-rose">
              <div>
                <div className="finance-kpi-header">
                  <span className="finance-kpi-title">Overdue Portfolio at Risk</span>
                  <span className="finance-kpi-badge badge-danger">Arrears</span>
                </div>
                <div className="finance-kpi-value-row">
                  <div className={`finance-kpi-amount ${Number(metrics?.overdueAmount ?? metrics?.totalOverdueAmount ?? 0) > 0 ? 'amount-danger' : ''}`}>
                    <MoneyDisplay amount={metrics?.overdueAmount ?? metrics?.totalOverdueAmount ?? 0} />
                  </div>
                  <div className="finance-kpi-icon-pill" style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
                    <AlertTriangle size={18} />
                  </div>
                </div>
              </div>
              <div className="finance-kpi-footer">
                <span>Attention Required</span>
                <span className="alert-tag">
                  <AlertTriangle size={13} />
                  {metrics?.overdueEmisCount ?? metrics?.overdueInHouseInstalments ?? 0} overdue
                </span>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Quick In-House Active Loans */}
            <div className="col-12 col-lg-7">
              <div className="app-card h-100">
                <div className="app-card-header d-flex justify-content-between align-items-center">
                  <h3 className="app-card-title mb-0">Active Dealership Loans</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none p-0"
                    onClick={() => handleTabChange('in-house')}
                  >
                    View All Loans <ArrowRight size={14} />
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="app-table table mb-0 small">
                    <thead>
                      <tr>
                        <th>Loan #</th>
                        <th>Customer</th>
                        <th>Financed Principal</th>
                        <th>Monthly EMI</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            No active in-house loans recorded yet.
                          </td>
                        </tr>
                      ) : (
                        financeList.slice(0, 5).map((row) => (
                          <tr key={row.id}>
                            <td className="fw-bold font-monospace">#{row.id}</td>
                            <td>
                              <div className="fw-semibold text-dark">{row.customerName}</div>
                              <div className="text-muted font-monospace">{formatRegNumber(row.vehicleRegistrationNumber)}</div>
                            </td>
                            <td className="fw-semibold">
                              <MoneyDisplay amount={row.loanAmount} />
                            </td>
                            <td className="text-primary font-monospace fw-semibold">
                              <MoneyDisplay amount={row.emiAmount ?? row.monthlyEmi} />
                            </td>
                            <td>
                              <StatusBadge status={row.status} />
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-2"
                                onClick={() => navigate(`/finance/${row.id}`)}
                              >
                                View Schedule
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent External Applications */}
            <div className="col-12 col-lg-5">
              <div className="app-card h-100">
                <div className="app-card-header d-flex justify-content-between align-items-center">
                  <h3 className="app-card-title mb-0">Bank Loan Files Underway</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none p-0"
                    onClick={() => handleTabChange('applications')}
                  >
                    View Applications <ArrowRight size={14} />
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="app-table table mb-0 small">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Lender</th>
                        <th>Requested</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted">
                            No external loan files submitted yet.
                          </td>
                        </tr>
                      ) : (
                        applications.slice(0, 5).map((app) => (
                          <tr key={app.id}>
                            <td>
                              <div className="fw-semibold text-dark">{app.applicantName}</div>
                              <small className="text-muted font-monospace">{app.applicationNumber}</small>
                            </td>
                            <td>{app.lenderName || 'External Bank'}</td>
                            <td className="fw-semibold">
                              <MoneyDisplay amount={app.requestedLoanAmount} />
                            </td>
                            <td>
                              <span className={`badge ${
                                app.status === 'SANCTIONED'
                                  ? 'bg-info-subtle text-info border'
                                  : app.status === 'DISBURSED'
                                  ? 'bg-success-subtle text-success border'
                                  : 'bg-warning-subtle text-warning border'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IN-HOUSE LOANS */}
      {activeTab === 'in-house' && (
        <div>
          <div className="bg-white border rounded-4 p-3 mb-4 shadow-xs">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex flex-wrap align-items-center gap-3 flex-grow-1" style={{ maxWidth: '650px' }}>
                <div className="flex-grow-1" style={{ minWidth: '280px' }}>
                  <SearchInput
                    placeholder="Search by customer, loan account, vehicle reg..."
                    value={searchTerm}
                    onChange={(val) => {
                      setSearchTerm(val);
                      resetPagination();
                    }}
                  />
                </div>
                <div style={{ minWidth: '180px' }}>
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      resetPagination();
                    }}
                  >
                    <option value="">All Loan Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="DEFAULTED">DEFAULTED</option>
                    <option value="SETTLED">SETTLED</option>
                  </select>
                </div>
              </div>

              {Boolean(searchTerm || statusFilter) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    resetPagination();
                  }}
                >
                  <RotateCcw size={13} /> Reset Filters
                </button>
              )}
            </div>
          </div>


          <DataTable
            columns={[
              {
                header: 'Loan ID / Account',
                field: 'id',
                sortable: true,
                render: (row) => (
                  <div>
                    <div className="fw-bold text-dark font-monospace">#{row.id}</div>
                    <div className="small text-muted font-monospace">{row.loanAccountNumber || '—'}</div>
                  </div>
                ),
              },
              {
                header: 'Customer',
                field: 'customerName',
                render: (row) => (
                  <div>
                    <div className="fw-semibold text-dark">{row.customerName}</div>
                    {row.saleNumber && <div className="text-muted small">Sale #{row.saleNumber}</div>}
                  </div>
                ),
              },
              {
                header: 'Vehicle Reg',
                field: 'vehicleRegistrationNumber',
                render: (row) => (
                  <span className="badge bg-light text-dark border font-monospace">
                    {formatRegNumber(row.vehicleRegistrationNumber || row.registrationNumber)}
                  </span>
                ),
              },
              {
                header: 'Principal Financed',
                field: 'loanAmount',
                sortable: true,
                render: (row) => (
                  <div>
                    <div className="fw-bold"><MoneyDisplay amount={row.loanAmount} /></div>
                    <small className="text-muted">Down: <MoneyDisplay amount={row.downPayment || 0} /></small>
                  </div>
                ),
              },
              {
                header: 'Monthly EMI',
                field: 'emiAmount',
                render: (row) => (
                  <div>
                    <div className="fw-bold text-primary font-monospace">
                      <MoneyDisplay amount={row.emiAmount ?? row.monthlyEmi} />
                    </div>
                    <small className="text-muted">Due day: {row.emiDueDay || 5}th</small>
                  </div>
                ),
              },
              {
                header: 'Tenure & ROI',
                field: 'tenureMonths',
                render: (row) => (
                  <span>{row.tenureMonths} Mo @ {row.interestRate}% p.a.</span>
                ),
              },
              {
                header: 'Status',
                field: 'status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                header: 'Actions',
                field: 'actions',
                render: (row) => (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    onClick={() => navigate(`/finance/${row.id}`)}
                  >
                    <Eye size={13} /> Schedule & Pay
                  </button>
                ),
              },
            ]}
            data={financeList}
            isLoading={isLoading}
            error={error}
            onRetry={fetchData}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            pagination={{
              currentPage: page,
              totalPages,
              totalElements,
              pageSize: size,
              onPageChange: handlePageChange,
              onSizeChange: handleSizeChange,
            }}
            emptyTitle="No in-house loans found"
            emptyDescription="Create an in-house financed sale to generate compound monthly amortization schedules."
          />
        </div>
      )}

      {/* TAB 3: EXTERNAL BANK / NBFC APPLICATIONS */}
      {activeTab === 'applications' && (
        <div>
          <div className="bg-white border rounded-4 p-3 mb-4 shadow-xs">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex flex-wrap align-items-center gap-3 flex-grow-1" style={{ maxWidth: '650px' }}>
                <div className="flex-grow-1" style={{ minWidth: '280px' }}>
                  <SearchInput
                    placeholder="Search by applicant name, app #, PAN..."
                    value={searchTerm}
                    onChange={(val) => setSearchTerm(val)}
                  />
                </div>
                <div style={{ minWidth: '180px' }}>
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Application Statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="SANCTIONED">SANCTIONED</option>
                    <option value="DISBURSED">DISBURSED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              {Boolean(searchTerm || statusFilter) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                  }}
                >
                  <RotateCcw size={13} /> Reset Filters
                </button>
              )}
            </div>
          </div>

          <DataTable
            columns={[
              {
                header: 'Application #',
                field: 'applicationNumber',
                render: (row) => (
                  <div>
                    <div className="fw-bold font-monospace text-dark">{row.applicationNumber}</div>
                    <small className="text-muted">{formatDate(row.createdAt || row.applicationDate)}</small>
                  </div>
                ),
              },
              {
                header: 'Applicant Details',
                field: 'applicantName',
                render: (row) => (
                  <div>
                    <div className="fw-bold text-dark">{row.applicantName}</div>
                    <div className="text-muted small">{row.applicantPhone} • PAN: {row.panNumber || '—'}</div>
                  </div>
                ),
              },
              {
                header: 'Financing Partner',
                field: 'lenderName',
                render: (row) => (
                  <div>
                    <div className="fw-semibold text-dark">{row.lenderName || 'External Bank'}</div>
                    <small className="text-muted font-monospace">{row.sanctionLetterReference || 'No Sanction Ref'}</small>
                  </div>
                ),
              },
              {
                header: 'Requested / Sanctioned',
                field: 'requestedLoanAmount',
                render: (row) => (
                  <div>
                    <div>Req: <MoneyDisplay amount={row.requestedLoanAmount} /></div>
                    {row.sanctionedAmount && (
                      <div className="fw-bold text-info">Sanc: <MoneyDisplay amount={row.sanctionedAmount} /></div>
                    )}
                  </div>
                ),
              },
              {
                header: 'Disbursed to Dealer',
                field: 'disbursedAmount',
                render: (row) => (
                  <div>
                    <div className="fw-bold text-success">
                      <MoneyDisplay amount={row.disbursedAmount || 0} />
                    </div>
                    {row.disbursementReference && (
                      <small className="text-muted font-monospace">{row.disbursementReference}</small>
                    )}
                  </div>
                ),
              },
              {
                header: 'Status',
                field: 'status',
                render: (row) => (
                  <span className={`badge ${
                    row.status === 'SANCTIONED'
                      ? 'bg-info-subtle text-info border'
                      : row.status === 'DISBURSED'
                      ? 'bg-success-subtle text-success border'
                      : row.status === 'REJECTED'
                      ? 'bg-danger-subtle text-danger border'
                      : 'bg-warning-subtle text-warning border'
                  }`}>
                    {row.status}
                  </span>
                ),
              },
              {
                header: 'Workflow Actions',
                field: 'actions',
                render: (row) => (
                  <div className="d-flex align-items-center gap-1 justify-content-end">
                    {row.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info py-1 px-2"
                        onClick={() => {
                          setSanctionModalApp(row);
                          setSanctionForm({
                            sanctionedAmount: String(row.requestedLoanAmount || ''),
                            sanctionLetterRef: `SANC-${Date.now().toString().slice(-6)}`,
                            approvedRoi: '9.5',
                            sanctionDate: new Date().toISOString().split('T')[0],
                          });
                        }}
                      >
                        Sanction
                      </button>
                    )}

                    {row.status === 'SANCTIONED' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success py-1 px-2"
                        onClick={() => {
                          setDisburseModalApp(row);
                          setDisburseForm({
                            disbursedAmount: String(row.sanctionedAmount || row.requestedLoanAmount || ''),
                            disbursementRef: `DISB-UTR-${Date.now().toString().slice(-6)}`,
                            dealerReceiptConfirmed: true,
                            disbursementDate: new Date().toISOString().split('T')[0],
                          });
                        }}
                      >
                        Disburse Funds
                      </button>
                    )}

                    {row.status === 'DISBURSED' && (
                      <span className="text-success small fw-semibold d-inline-flex align-items-center gap-1">
                        <CheckCircle2 size={13} /> Complete
                      </span>
                    )}
                  </div>
                ),
              },
            ]}
            data={applications}
            isLoading={isLoading}
            error={error}
            onRetry={fetchData}
            emptyTitle="No external loan applications found"
            emptyDescription="Submit a new customer finance application file for bank sanction and disbursement tracking."
          />
        </div>
      )}

      {/* TAB 4: OVERDUE EMIS */}
      {activeTab === 'overdue' && (
        <div>
          <DataTable
            columns={[
              {
                header: 'Installment #',
                field: 'installmentNumber',
                render: (row) => (
                  <span className="fw-bold font-monospace">#{row.installmentNumber}</span>
                ),
              },
              {
                header: 'Customer',
                field: 'customerName',
                render: (row) => (
                  <div>
                    <div className="fw-semibold text-dark">{row.customerName}</div>
                    <div className="text-muted small">{row.customerPhone}</div>
                  </div>
                ),
              },
              {
                header: 'Vehicle Reg',
                field: 'registrationNumber',
                render: (row) => (
                  <span className="badge bg-light text-dark border font-monospace">
                    {formatRegNumber(row.registrationNumber)}
                  </span>
                ),
              },
              {
                header: 'Scheduled Due Date',
                field: 'dueDate',
                render: (row) => (
                  <span className="text-danger fw-bold">{formatDate(row.dueDate)}</span>
                ),
              },
              {
                header: 'Overdue Amount',
                field: 'emiAmount',
                render: (row) => (
                  <span className="fw-bold text-danger font-monospace">
                    <MoneyDisplay amount={row.emiAmount} />
                  </span>
                ),
              },
              {
                header: 'Action',
                field: 'action',
                render: (row) => (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success py-1 px-2 d-inline-flex align-items-center gap-1"
                    onClick={() => setPayingEmi(row)}
                  >
                    <CheckCircle2 size={13} /> Settle Overdue
                  </button>
                ),
              },
            ]}
            data={overdueEmis}
            isLoading={isLoading}
            error={error}
            onRetry={fetchData}
            emptyTitle="No overdue installments"
            emptyDescription="All in-house loan repayment accounts are up to date with zero outstanding arrears."
          />
        </div>
      )}

      {/* TAB 5: LENDERS & FINANCE PARTNERS */}
      {activeTab === 'lenders' && (
        <div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h3 className="h6 fw-bold text-dark text-uppercase mb-1">
                Banking & NBFC Finance Partners
              </h3>
              <p className="text-muted small mb-0">
                Authoritative institutional financiers, direct disbursement partners, and underwriting guidelines.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchData}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh Partners'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-xs"
                onClick={() => {
                  setLenderForm({
                    name: '',
                    lenderCode: '',
                    lenderType: 'BANK',
                    contactPerson: '',
                    contactPhone: '',
                    contactEmail: '',
                    supportedVehicleTypes: 'ALL',
                    minTenureMonths: 12,
                    maxTenureMonths: 84,
                    indicativeInterestRate: 8.75,
                    processingFeePercentage: 1.0,
                    notes: '',
                  });
                  setShowNewLenderModal(true);
                }}
              >
                <Plus size={15} /> Add Finance Partner
              </button>
            </div>
          </div>

          <div className="row g-4">
            {lenders.map((lender) => (
              <div key={lender.id} className="col-12 col-md-6 col-xl-4">
                <div className="app-card h-100 p-4 border rounded-3 shadow-xs d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-primary-subtle text-primary rounded-3">
                          <Building size={20} />
                        </div>
                        <div>
                          <h4 className="h6 fw-bold mb-0 text-dark">{lender.name}</h4>
                          <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '0.68rem' }}>
                            {lender.lenderCode || `LND-#${lender.id}`}
                          </span>
                        </div>
                      </div>
                      <span className={`badge ${lender.isActive !== false ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary'}`}>
                        {lender.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="small border-top pt-3 d-flex flex-column gap-2 mb-3">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Institution Type:</span>
                        <strong className="text-dark">{lender.lenderType || 'BANK'}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Indicative ROI:</span>
                        <strong className="text-primary font-monospace">{lender.indicativeInterestRate ? `${lender.indicativeInterestRate}% p.a.` : '9.5% p.a.'}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Processing Fee:</span>
                        <span className="text-dark font-monospace">{lender.processingFeePercentage ? `${lender.processingFeePercentage}%` : '1.0%'}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Dealer Commission:</span>
                        <strong className="text-success font-monospace">{lender.dealerCommissionPercentage ? `${lender.dealerCommissionPercentage}% Share` : '80.0% Share'}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Tenure Range:</span>
                        <strong className="text-dark">{lender.minTenureMonths || 12} to {lender.maxTenureMonths || 84} Months</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Contact Officer:</span>
                        <span className="text-dark">{lender.contactPerson || 'Dealership Channel Manager'}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Official Phone:</span>
                        <span className="font-monospace text-dark">{lender.contactPhone || '—'}</span>
                      </div>
                      {lender.contactEmail && (
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Official Email:</span>
                          <span className="text-truncate text-dark" style={{ maxWidth: '170px' }}>{lender.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex gap-2 border-top pt-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary flex-grow-1"
                      onClick={() => {
                        setAppForm((prev) => ({ ...prev, lenderId: String(lender.id) }));
                        setShowNewAppModal(true);
                      }}
                    >
                      Submit Customer Loan File
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      title={`Add dedicated penalty/preclosure policy for ${lender.name}`}
                      onClick={() => {
                        setPolicyForm({
                          name: `${lender.name} Lending Policy`,
                          policyCode: `${(lender.lenderCode || 'LND').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_POL_2026`,
                          policyVersion: '1.0',
                          borrowerCategory: 'INDIVIDUAL',
                          interestRateType: lender.lenderType === 'BANK' ? 'FLOATING' : 'FIXED',
                          foreclosureChargeRate: lender.lenderType === 'BANK' ? 0.0 : 2.0,
                          annualRatePercentage: 24.0,
                          gracePeriodDays: 3,
                          perEventCap: 5000,
                          minCharge: 100,
                          preclosureEnabled: true,
                          eligibilityPeriodMonths: 3,
                          eligibilityStartBasis: 'COMMENCEMENT_DATE',
                          inclusiveEndDateRule: true,
                          feeCalculationBase: 'OUTSTANDING_PRINCIPAL',
                          rbiFloatingRateForeclosureExempt: lender.lenderType === 'BANK',
                          disclosureText: `Direct contract policy for ${lender.name}.`,
                        });
                        setShowNewPolicyModal(true);
                      }}
                    >
                      <Plus size={14} /> Policy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STANDALONE EMI CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="app-card p-4">
              <h3 className="h6 fw-bold text-dark text-uppercase mb-3">
                Reducing-Balance Amortization Calculator
              </h3>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="calcSaleAmt">Vehicle Sale Price (₹) *</label>
                  <input
                    id="calcSaleAmt"
                    type="number"
                    className="form-control"
                    value={calcForm.saleAmount}
                    onChange={(e) => setCalcForm({ ...calcForm, saleAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="calcDownPay">Down Payment (₹) *</label>
                  <input
                    id="calcDownPay"
                    type="number"
                    className="form-control"
                    value={calcForm.downPayment}
                    onChange={(e) => setCalcForm({ ...calcForm, downPayment: Number(e.target.value) })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="calcTradeIn">Trade-In Credit (₹)</label>
                  <input
                    id="calcTradeIn"
                    type="number"
                    className="form-control"
                    value={calcForm.tradeInCredit}
                    onChange={(e) => setCalcForm({ ...calcForm, tradeInCredit: Number(e.target.value) })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="calcProcFee">Processing Fee (₹)</label>
                  <input
                    id="calcProcFee"
                    type="number"
                    className="form-control"
                    value={calcForm.processingFee}
                    onChange={(e) => setCalcForm({ ...calcForm, processingFee: Number(e.target.value) })}
                  />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input
                      id="calcCapFee"
                      type="checkbox"
                      className="form-check-input"
                      checked={calcForm.capitalizeFee}
                      onChange={(e) => setCalcForm({ ...calcForm, capitalizeFee: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="calcCapFee">
                      Include processing fee in financed principal
                    </label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="calcRoi">Interest Rate (% p.a.) *</label>
                  <input
                    id="calcRoi"
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={calcForm.annualInterestRate}
                    onChange={(e) => setCalcForm({ ...calcForm, annualInterestRate: Number(e.target.value) })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="calcTenure">Tenure (Months) *</label>
                  <select
                    id="calcTenure"
                    className="form-select"
                    value={calcForm.tenureMonths}
                    onChange={(e) => setCalcForm({ ...calcForm, tenureMonths: Number(e.target.value) })}
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="18">18 Months (1.5 Years)</option>
                    <option value="24">24 Months (2 Years)</option>
                    <option value="36">36 Months (3 Years)</option>
                    <option value="48">48 Months (4 Years)</option>
                    <option value="60">60 Months (5 Years)</option>
                    <option value="84">84 Months (7 Years)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            {calcResult ? (
              <div className="app-card p-4">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                  <div>
                    <h3 className="h6 fw-bold mb-0 text-dark">Simulation Results</h3>
                    <small className="text-muted">Compound reducing balance formula calculation</small>
                  </div>
                  <div className="text-end">
                    <span className="small text-muted d-block">Monthly EMI</span>
                    <strong className="fs-4 text-primary font-monospace">
                      <MoneyDisplay amount={calcResult.monthlyEmi} />
                    </strong>
                  </div>
                </div>

                <div className="row g-3 mb-4 small">
                  <div className="col-6 col-md-3">
                    <span className="text-muted d-block">Principal Financed</span>
                    <strong className="text-dark"><MoneyDisplay amount={calcResult.amountFinanced} /></strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted d-block">Total Interest</span>
                    <strong className="text-danger"><MoneyDisplay amount={calcResult.totalScheduledInterest} /></strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted d-block">Total Repayment</span>
                    <strong className="text-dark"><MoneyDisplay amount={calcResult.totalScheduledRepayment} /></strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted d-block">Total Borrowing Cost</span>
                    <strong className="text-dark"><MoneyDisplay amount={calcResult.totalBorrowingCost} /></strong>
                  </div>
                </div>

                <h4 className="h6 fw-bold text-dark mb-2">First 6 Months Sample Schedule</h4>
                <div className="table-responsive">
                  <table className="app-table table mb-0 small">
                    <thead>
                      <tr>
                        <th>EMI #</th>
                        <th>Due Date</th>
                        <th className="text-end">Principal</th>
                        <th className="text-end">Interest</th>
                        <th className="text-end">Total EMI</th>
                        <th className="text-end">Closing Principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(calcResult.schedule || []).slice(0, 6).map((item) => (
                        <tr key={item.installmentNumber}>
                          <td className="font-monospace fw-bold">#{item.installmentNumber}</td>
                          <td>{formatDate(item.dueDate)}</td>
                          <td className="text-end text-muted"><MoneyDisplay amount={item.principalComponent} /></td>
                          <td className="text-end text-muted"><MoneyDisplay amount={item.interestComponent} /></td>
                          <td className="text-end fw-bold text-dark"><MoneyDisplay amount={item.scheduledEmi} /></td>
                          <td className="text-end font-monospace"><MoneyDisplay amount={item.closingPrincipal} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="app-card p-4 text-center text-muted">
                Run the simulation to inspect compound amortization.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: PRECLOSURE & PENALTY POLICIES CONFIGURATION DASHBOARD */}
      {activeTab === 'policies' && (
        <div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h3 className="h6 fw-bold text-dark text-uppercase mb-1">
                Loan Foreclosure & Penal Policy Configuration Engine
              </h3>
              <p className="text-muted small mb-0">
                Configure preclosure rates, RBI floating-rate exemptions, grace periods, and overdue monthly penal charges.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchData}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh Policies'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-xs"
                onClick={() => {
                  setPolicyForm({
                    name: '',
                    policyCode: '',
                    policyVersion: '1.0',
                    borrowerCategory: 'INDIVIDUAL',
                    interestRateType: 'FIXED',
                    foreclosureChargeRate: 2.0,
                    annualRatePercentage: 24.0,
                    gracePeriodDays: 3,
                    perEventCap: 5000,
                    minCharge: 100,
                    preclosureEnabled: true,
                    eligibilityPeriodMonths: 3,
                    eligibilityStartBasis: 'COMMENCEMENT_DATE',
                    inclusiveEndDateRule: true,
                    feeCalculationBase: 'OUTSTANDING_PRINCIPAL',
                    rbiFloatingRateForeclosureExempt: false,
                    disclosureText: '',
                  });
                  setShowNewPolicyModal(true);
                }}
              >
                <Plus size={15} /> Add Loan Policy
              </button>
            </div>
          </div>

          <div className="row g-4">
            {policies.map((p) => (
              <div key={p.id} className="col-12 col-md-6 col-xl-4">
                <div className="app-card h-100 p-4 border rounded-3 shadow-xs d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary-subtle text-primary border font-monospace">
                        {p.policyCode}
                      </span>
                      <span className={`badge ${p.isActive ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <h4 className="h6 fw-bold text-dark mb-1">{p.name}</h4>
                    <p className="text-muted small mb-3">{p.disclosureText || 'Configured dealership terms.'}</p>

                    <div className="bg-light p-3 rounded-3 mb-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small">Preclosure / Foreclosure Rate:</span>
                        <strong className="fs-5 text-danger font-monospace">
                          {p.foreclosureChargeRate}%
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="text-muted">Overdue Penal Rate:</span>
                        <span className="fw-semibold text-dark">{p.annualRatePercentage}% p.a. (2% p.m.)</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="text-muted">Grace Period:</span>
                        <span className="fw-semibold text-dark">{p.gracePeriodDays} Days</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="text-muted">Rate Type / Category:</span>
                        <span className="fw-semibold text-dark">{p.interestRateType} • {p.borrowerCategory}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center small">
                        <span className="text-muted">RBI Floating Exemption:</span>
                        <span className={`badge ${p.rbiFloatingRateForeclosureExempt ? 'bg-success' : 'bg-secondary'}`}>
                          {p.rbiFloatingRateForeclosureExempt ? 'EXEMPT (0%)' : 'STANDARD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1 mt-2"
                    onClick={() => setEditingPolicy({ ...p })}
                  >
                    <Sliders size={14} /> Edit Preclosure Rate & Terms
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: LENDER COMMISSION & PARTNER SETTLEMENT MANAGEMENT */}
      {activeTab === 'commissions' && (
        <div>
          {/* Commission Dashboard Header & KPIs */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h3 className="h6 fw-bold text-dark text-uppercase mb-1 d-flex align-items-center gap-2">
                <DollarSign size={18} className="text-success" />
                Lender Commission Accounting & Settlement Manager
              </h3>
              <p className="text-muted small mb-0">
                Track sourcing fees, processing fee revenue share, GST invoices, and bank UTR settlements.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-xs"
                onClick={fetchData}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh Entries'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-success text-white d-flex align-items-center gap-1 shadow-xs fw-semibold"
                onClick={() => {
                  const initialLenderId = lenders[0]?.id ? String(lenders[0].id) : '';
                  setCommForm({
                    lenderId: initialLenderId,
                    loanApplicationId: '',
                    saleId: '',
                    entryDate: new Date().toISOString().split('T')[0],
                    calculationMethod: 'PERCENTAGE_OF_PROCESSING_FEE',
                    baseAmount: '',
                    commissionRatePercentage: lenders[0]?.dealerCommissionPercentage ? String(lenders[0].dealerCommissionPercentage) : '80',
                    fixedCommissionRate: '',
                    tdsPercentage: 0,
                    approvedAdjustments: 0,
                    agreementReference: lenders[0]?.lenderCode ? `AGR-${lenders[0].lenderCode}` : '',
                    policyVersion: '1.0',
                    entryMode: 'LOAN_LINKED',
                    manualEntryReason: '',
                    notes: '',
                  });
                  setCommPreview(null);
                  setShowNewCommModal(true);
                  if (initialLenderId) {
                    loadApplicationsForLender(initialLenderId);
                  }
                }}
              >
                <Plus size={15} /> Book Lender Commission
              </button>
            </div>
          </div>

          {/* 4 Database-Driven Commission Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-xs">
                <div>
                  <span className="text-muted fw-semibold small text-uppercase tracking-wide" style={{ fontSize: '0.74rem' }}>
                    Gross Commission Booked
                  </span>
                  <div className="fs-3 fw-bold text-primary font-monospace my-1">
                    <MoneyDisplay amount={commissionMetrics?.grossCommissionThisMonth ?? 0} />
                  </div>
                </div>
                <div className="pt-2 border-top mt-3 text-muted small" style={{ fontSize: '0.78rem' }}>
                  <span>Current Month Bookings</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-xs">
                <div>
                  <span className="text-muted fw-semibold small text-uppercase tracking-wide" style={{ fontSize: '0.74rem' }}>
                    Outstanding Receivable
                  </span>
                  <div className="fs-3 fw-bold text-danger font-monospace my-1">
                    <MoneyDisplay amount={commissionMetrics?.outstandingCommissionReceivable ?? 0} />
                  </div>
                </div>
                <div className="pt-2 border-top mt-3 text-muted small" style={{ fontSize: '0.78rem' }}>
                  <span>Unsettled Partner Balance</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-xs">
                <div>
                  <span className="text-muted fw-semibold small text-uppercase tracking-wide" style={{ fontSize: '0.74rem' }}>
                    Bank Receipts Received
                  </span>
                  <div className="fs-3 fw-bold text-success font-monospace my-1">
                    <MoneyDisplay amount={commissionMetrics?.commissionReceivedThisMonth ?? 0} />
                  </div>
                </div>
                <div className="pt-2 border-top mt-3 text-muted small" style={{ fontSize: '0.78rem' }}>
                  <span>Realized to Dealership Bank</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-xs">
                <div>
                  <span className="text-muted fw-semibold small text-uppercase tracking-wide" style={{ fontSize: '0.74rem' }}>
                    TDS Withheld (Sec 194H)
                  </span>
                  <div className="fs-3 fw-bold text-dark font-monospace my-1">
                    <MoneyDisplay amount={commissionMetrics?.tdsWithheldThisMonth ?? 0} />
                  </div>
                </div>
                <div className="pt-2 border-top mt-3 text-muted small" style={{ fontSize: '0.78rem' }}>
                  <span>Form 26AS Tax Credit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border rounded-4 p-3 mb-4 shadow-xs">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex flex-wrap align-items-center gap-3 flex-grow-1" style={{ maxWidth: '750px' }}>
                <div className="flex-grow-1" style={{ minWidth: '260px' }}>
                  <SearchInput
                    placeholder="Search commission #, partner, customer, reg #..."
                    value={searchTerm}
                    onChange={(val) => {
                      setSearchTerm(val);
                      resetPagination();
                    }}
                  />
                </div>
                <div style={{ minWidth: '180px' }}>
                  <select
                    className="form-select form-select-sm"
                    value={selectedLenderFilter}
                    onChange={(e) => {
                      setSelectedLenderFilter(e.target.value);
                      resetPagination();
                    }}
                  >
                    <option value="">All Finance Partners</option>
                    {lenders.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ minWidth: '160px' }}>
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      resetPagination();
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="ACCRUED">ACCRUED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="INVOICED">INVOICED</option>
                    <option value="PARTIALLY_SETTLED">PARTIALLY_SETTLED</option>
                    <option value="SETTLED">SETTLED</option>
                    <option value="REVERSED">REVERSED</option>
                  </select>
                </div>
              </div>

              {Boolean(searchTerm || statusFilter || selectedLenderFilter) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setSelectedLenderFilter('');
                    resetPagination();
                  }}
                >
                  <RotateCcw size={13} /> Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Commission Transactions DataTable */}
          <DataTable
            columns={[
              {
                header: 'Commission Ref',
                field: 'commissionReference',
                render: (row) => (
                  <div>
                    <div className="fw-bold font-monospace text-primary">{row.commissionReference}</div>
                    <small className="text-muted">{formatDate(row.entryDate)} • {row.entryMode}</small>
                  </div>
                ),
              },
              {
                header: 'Finance Partner',
                field: 'lenderName',
                render: (row) => (
                  <div>
                    <strong className="text-dark">{row.lenderName}</strong>
                    <div className="text-muted small">{row.agreementReference || 'Direct Tie-Up'}</div>
                  </div>
                ),
              },
              {
                header: 'Linked Vehicle & Customer',
                field: 'customerName',
                render: (row) => (
                  <div>
                    <div className="fw-semibold text-dark">{row.customerName || 'Direct DSA Entry'}</div>
                    <small className="text-muted font-monospace">{row.vehicleRegNumber ? formatRegNumber(row.vehicleRegNumber) : (row.loanApplicationNumber || '—')}</small>
                  </div>
                ),
              },
              {
                header: 'Base & Method',
                field: 'calculationMethod',
                render: (row) => (
                  <div>
                    <div className="small fw-semibold text-dark">
                      {row.calculationMethod === 'PERCENTAGE_OF_PROCESSING_FEE' ? 'Proc Fee Share' : row.calculationMethod === 'PERCENTAGE_OF_DISBURSEMENT' ? 'Loan Disbursed %' : 'Fixed Sourcing'}
                    </div>
                    <small className="text-muted">
                      Base: <MoneyDisplay amount={row.commissionBaseAmount} /> @ {row.commissionRatePercentage}%
                    </small>
                  </div>
                ),
              },
              {
                header: 'Gross Commission',
                field: 'grossCommission',
                render: (row) => (
                  <div>
                    <div className="fw-bold text-dark font-monospace"><MoneyDisplay amount={row.grossCommission} /></div>
                    <small className="text-muted">GST: Excluded</small>
                  </div>
                ),
              },
              {
                header: 'Net Receivable',
                field: 'netReceivable',
                render: (row) => (
                  <div>
                    <strong className="fs-6 text-success font-monospace"><MoneyDisplay amount={row.netReceivable} /></strong>
                    <div className="small text-danger">TDS: -<MoneyDisplay amount={row.tdsWithheld} /></div>
                  </div>
                ),
              },
              {
                header: 'Status & Invoice',
                field: 'status',
                render: (row) => (
                  <div>
                    <span className={`badge ${
                      row.status === 'SETTLED' ? 'bg-success-subtle text-success border' :
                      row.status === 'APPROVED' || row.status === 'INVOICED' ? 'bg-info-subtle text-info border' :
                      row.status === 'REVERSED' ? 'bg-danger-subtle text-danger border' : 'bg-warning-subtle text-warning border'
                    }`}>
                      {row.status}
                    </span>
                    {row.invoiceNumber && <div className="small text-muted font-monospace mt-0.5">{row.invoiceNumber}</div>}
                  </div>
                ),
              },
              {
                header: 'Actions',
                field: 'actions',
                render: (row) => (
                  <div className="d-flex align-items-center gap-1">
                    {row.status === 'ACCRUED' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success py-0.5 px-2 small"
                        title="Approve Commission"
                        onClick={async () => {
                          try {
                            await financeService.approveCommission(row.id, 'Verified and Approved');
                            dispatch(addToast({ type: 'success', message: 'Commission Approved' }));
                            fetchData();
                          } catch (err) {
                            dispatch(addToast({ type: 'error', message: err.message }));
                          }
                        }}
                      >
                        Approve
                      </button>
                    )}

                    {(row.status === 'APPROVED' || row.status === 'ACCRUED') && !row.invoiceNumber && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-0.5 px-2 small"
                        title="Raise GST Invoice"
                        onClick={() => {
                          setInvoiceModalComm(row);
                          setInvoiceForm({
                            invoiceNumber: `INV-COMM-${row.id}-${new Date().getFullYear()}`,
                            invoiceDate: new Date().toISOString().split('T')[0],
                          });
                        }}
                      >
                        Invoice
                      </button>
                    )}

                    {row.status !== 'SETTLED' && row.status !== 'REVERSED' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success text-white py-0.5 px-2 small"
                        title="Record Partner Settlement Receipt"
                        onClick={() => {
                          setReceiptModalComm(row);
                          setReceiptForm({
                            receiptDate: new Date().toISOString().split('T')[0],
                            totalReceivedAmount: String(row.outstandingBalance || row.netReceivable),
                            paymentMethod: 'BANK_TRANSFER',
                            bankUtrReference: '',
                            bankName: row.lenderName || 'HDFC Bank',
                            tdsDeductedByBank: String(row.tdsWithheld || 0),
                            reconciliationNotes: `Settlement for ${row.commissionReference}`,
                          });
                        }}
                      >
                        Receive
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            data={commissions}
            isLoading={isLoading}
            error={error}
            onRetry={fetchData}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            pagination={{
              currentPage: page,
              totalPages,
              totalElements,
              pageSize: size,
              onPageChange: handlePageChange,
              onSizeChange: handleSizeChange,
            }}
            emptyTitle="No lender commissions booked"
            emptyDescription="Record manual or loan-linked partner commission receivables from external vehicle financiers."
          />
        </div>
      )}

      {/* EDIT PRECLOSURE & PENALTY POLICY MODAL */}
      {editingPolicy && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsUpdatingPolicy(true);
                  try {
                    await financeService.updatePolicy(editingPolicy.id, {
                      foreclosureChargeRate: Number(editingPolicy.foreclosureChargeRate),
                      annualRatePercentage: Number(editingPolicy.annualRatePercentage),
                      gracePeriodDays: Number(editingPolicy.gracePeriodDays),
                      perEventCap: Number(editingPolicy.perEventCap || 0),
                      rbiFloatingRateForeclosureExempt: Boolean(editingPolicy.rbiFloatingRateForeclosureExempt),
                      disclosureText: editingPolicy.disclosureText,
                    });
                    dispatch(
                      addToast({
                        type: 'success',
                        title: 'Policy Updated',
                        message: `Preclosure rate for policy [${editingPolicy.policyCode}] updated to ${editingPolicy.foreclosureChargeRate}%.`,
                      })
                    );
                    setEditingPolicy(null);
                    fetchData();
                  } catch (err) {
                    dispatch(addToast({ type: 'error', message: err.message || 'Failed to update policy' }));
                  } finally {
                    setIsUpdatingPolicy(false);
                  }
                }}
              >
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title h6 fw-bold mb-0">Configure Preclosure Rate & Penal Terms</h5>
                    <small className="text-muted font-monospace">{editingPolicy.policyCode} • {editingPolicy.name}</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setEditingPolicy(null)} />
                </div>
                <div className="modal-body small">
                  <div className="alert alert-info py-2 px-3 rounded-2 mb-3">
                    Editing this policy immediately updates the live calculation engine when generating settlement quotations.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold" htmlFor="editFcRate">
                      Preclosure / Foreclosure Rate (% on Principal Outstanding) *
                    </label>
                    <div className="input-group">
                      <input
                        id="editFcRate"
                        type="number"
                        step="0.05"
                        min="0"
                        max="10"
                        className="form-control font-monospace fs-6 fw-bold"
                        value={editingPolicy.foreclosureChargeRate}
                        onChange={(e) => setEditingPolicy({ ...editingPolicy, foreclosureChargeRate: e.target.value })}
                        required
                      />
                      <span className="input-group-text">%</span>
                    </div>
                    <small className="text-muted">Standard Indian NBFC rate is 2% to 3%. Set to 0% for nil charge.</small>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="editGraceDays">Grace Period (Days) *</label>
                      <input
                        id="editGraceDays"
                        type="number"
                        min="0"
                        max="30"
                        className="form-control"
                        value={editingPolicy.gracePeriodDays}
                        onChange={(e) => setEditingPolicy({ ...editingPolicy, gracePeriodDays: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="editPenalRate">Annual Penal Rate (% p.a.)</label>
                      <input
                        id="editPenalRate"
                        type="number"
                        step="0.5"
                        className="form-control"
                        value={editingPolicy.annualRatePercentage}
                        onChange={(e) => setEditingPolicy({ ...editingPolicy, annualRatePercentage: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      id="rbiExemptCheck"
                      type="checkbox"
                      className="form-check-input"
                      checked={Boolean(editingPolicy.rbiFloatingRateForeclosureExempt)}
                      onChange={(e) =>
                        setEditingPolicy({ ...editingPolicy, rbiFloatingRateForeclosureExempt: e.target.checked })
                      }
                    />
                    <label className="form-check-label" htmlFor="rbiExemptCheck">
                      Enforce RBI Prepayment Directions (0% charge for floating-rate individual loans)
                    </label>
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="editDisclosure">Customer Policy Disclosure Text</label>
                    <textarea
                      id="editDisclosure"
                      rows="3"
                      className="form-control small"
                      value={editingPolicy.disclosureText || ''}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, disclosureText: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingPolicy(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isUpdatingPolicy}>
                    {isUpdatingPolicy ? 'Saving Changes...' : 'Save & Apply Preclosure Rate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW FINANCE PARTNER MODAL */}
      {showNewLenderModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsCreatingLender(true);
                  try {
                    const payload = {
                      name: lenderForm.name.trim(),
                      lenderCode: lenderForm.lenderCode ? lenderForm.lenderCode.trim().toUpperCase() : undefined,
                      lenderType: lenderForm.lenderType,
                      contactPerson: lenderForm.contactPerson.trim(),
                      contactPhone: lenderForm.contactPhone.trim(),
                      contactEmail: lenderForm.contactEmail.trim(),
                      supportedVehicleTypes: lenderForm.supportedVehicleTypes,
                      minTenureMonths: Number(lenderForm.minTenureMonths),
                      maxTenureMonths: Number(lenderForm.maxTenureMonths),
                      indicativeInterestRate: Number(lenderForm.indicativeInterestRate),
                      processingFeePercentage: Number(lenderForm.processingFeePercentage),
                      dealerCommissionPercentage: Number(lenderForm.dealerCommissionPercentage || 0),
                      commissionPayoutBasis: lenderForm.commissionPayoutBasis || 'PERCENTAGE_OF_PROCESSING_FEE',
                      notes: lenderForm.notes,
                    };
                    const res = await financeService.createLender(payload);
                    dispatch(
                      addToast({
                        type: 'success',
                        title: 'Finance Partner Added',
                        message: `Partner [${res?.name || lenderForm.name}] successfully registered in database.`,
                      })
                    );
                    setShowNewLenderModal(false);
                    fetchData();
                  } catch (err) {
                    dispatch(addToast({ type: 'error', message: err.message || 'Failed to add finance partner' }));
                  } finally {
                    setIsCreatingLender(false);
                  }
                }}
              >
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title h6 fw-bold mb-0">Register New Banking / NBFC Finance Partner</h5>
                    <small className="text-muted">Direct underwriting integration and dealer loan file submission</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setShowNewLenderModal(false)} />
                </div>
                <div className="modal-body small">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-bold" htmlFor="partnerName">
                        Partner Institution Name *
                      </label>
                      <input
                        id="partnerName"
                        type="text"
                        className="form-control"
                        placeholder="e.g. Axis Bank Auto Finance, Tata Capital, Cholamandalam"
                        value={lenderForm.name}
                        onChange={(e) => setLenderForm({ ...lenderForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="partnerType">
                        Institution Type *
                      </label>
                      <select
                        id="partnerType"
                        className="form-select"
                        value={lenderForm.lenderType}
                        onChange={(e) => setLenderForm({ ...lenderForm, lenderType: e.target.value })}
                        required
                      >
                        <option value="BANK">Commercial Bank</option>
                        <option value="NBFC">NBFC / Financier</option>
                        <option value="CAPTIVE">OEM Captive Finance</option>
                        <option value="IN_HOUSE">Dealership In-House</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="partnerCode">
                        Partner Code (Optional)
                      </label>
                      <input
                        id="partnerCode"
                        type="text"
                        className="form-control font-monospace text-uppercase"
                        placeholder="e.g. AXIS-AUTO"
                        value={lenderForm.lenderCode}
                        onChange={(e) => setLenderForm({ ...lenderForm, lenderCode: e.target.value })}
                      />
                      <small className="text-muted">Auto-generated if empty.</small>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="partnerRoi">
                        Indicative ROI (% p.a.) *
                      </label>
                      <div className="input-group">
                        <input
                          id="partnerRoi"
                          type="number"
                          step="0.05"
                          min="0"
                          max="30"
                          className="form-control font-monospace"
                          value={lenderForm.indicativeInterestRate}
                          onChange={(e) => setLenderForm({ ...lenderForm, indicativeInterestRate: e.target.value })}
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-bold" htmlFor="partnerCommPct">
                        Dealer Commission Share (%)
                      </label>
                      <div className="input-group">
                        <input
                          id="partnerCommPct"
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          className="form-control font-monospace fw-bold text-success"
                          placeholder="e.g. 70, 80, 85"
                          value={lenderForm.dealerCommissionPercentage}
                          onChange={(e) => setLenderForm({ ...lenderForm, dealerCommissionPercentage: e.target.value })}
                          required
                        />
                        <span className="input-group-text bg-success-subtle text-success fw-bold">%</span>
                      </div>
                      <small className="text-muted">E.g., 70% or 85% of bank processing fee</small>
                    </div>

                    {/* Dynamic Commission Calculator Preview */}
                    <div className="col-12">
                      <div className="p-3 rounded-3 bg-light border border-success-subtle">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="text-dark small d-flex align-items-center gap-1">
                            <Percent size={14} className="text-success" /> Dealer Commission Simulation (Sample ₹1,00,000 Loan)
                          </strong>
                          <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace">
                            {Number(lenderForm.dealerCommissionPercentage || 0)}% Dealership Payout
                          </span>
                        </div>
                        <div className="row g-2 mt-1 small">
                          <div className="col-4">
                            <span className="text-muted d-block">Sample Loan:</span>
                            <span className="fw-semibold text-dark font-monospace">₹1,00,000</span>
                          </div>
                          <div className="col-4">
                            <span className="text-muted d-block">Bank Processing Fee ({Number(lenderForm.processingFeePercentage || 0)}%):</span>
                            <span className="fw-semibold text-primary font-monospace">
                              ₹{((100000 * Number(lenderForm.processingFeePercentage || 0)) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="col-4">
                            <span className="text-muted d-block">Dealer Commission Receivable:</span>
                            <strong className="fs-6 text-success font-monospace">
                              ₹{(((100000 * Number(lenderForm.processingFeePercentage || 0)) / 100) * (Number(lenderForm.dealerCommissionPercentage || 0) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="partnerMinTenure">
                        Min Tenure (Months)
                      </label>
                      <input
                        id="partnerMinTenure"
                        type="number"
                        min="1"
                        max="84"
                        className="form-control"
                        value={lenderForm.minTenureMonths}
                        onChange={(e) => setLenderForm({ ...lenderForm, minTenureMonths: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="partnerMaxTenure">
                        Max Tenure (Months)
                      </label>
                      <input
                        id="partnerMaxTenure"
                        type="number"
                        min="6"
                        max="84"
                        className="form-control"
                        value={lenderForm.maxTenureMonths}
                        onChange={(e) => setLenderForm({ ...lenderForm, maxTenureMonths: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="partnerOfficer">
                        Relationship / Channel Officer
                      </label>
                      <input
                        id="partnerOfficer"
                        type="text"
                        className="form-control"
                        placeholder="Name of bank executive"
                        value={lenderForm.contactPerson}
                        onChange={(e) => setLenderForm({ ...lenderForm, contactPerson: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="partnerPhone">
                        Official Phone
                      </label>
                      <input
                        id="partnerPhone"
                        type="text"
                        className="form-control font-monospace"
                        placeholder="10-digit mobile or direct line"
                        value={lenderForm.contactPhone}
                        onChange={(e) => setLenderForm({ ...lenderForm, contactPhone: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="partnerEmail">
                        Official Email
                      </label>
                      <input
                        id="partnerEmail"
                        type="email"
                        className="form-control"
                        placeholder="desk@financier.com"
                        value={lenderForm.contactEmail}
                        onChange={(e) => setLenderForm({ ...lenderForm, contactEmail: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="partnerNotes">
                        Underwriting & Agreement Notes
                      </label>
                      <textarea
                        id="partnerNotes"
                        rows="2"
                        className="form-control"
                        placeholder="Special sanction SLA, instant pre-approval guidelines, or documentation requirements"
                        value={lenderForm.notes}
                        onChange={(e) => setLenderForm({ ...lenderForm, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowNewLenderModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isCreatingLender}>
                    {isCreatingLender ? 'Saving to Database...' : 'Register Partner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW POLICY MODAL */}
      {showNewPolicyModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsCreatingPolicy(true);
                  try {
                    const payload = {
                      name: policyForm.name.trim(),
                      policyCode: policyForm.policyCode ? policyForm.policyCode.trim().toUpperCase() : undefined,
                      policyVersion: policyForm.policyVersion || '1.0',
                      borrowerCategory: policyForm.borrowerCategory,
                      interestRateType: policyForm.interestRateType,
                      foreclosureChargeRate: Number(policyForm.foreclosureChargeRate),
                      annualRatePercentage: Number(policyForm.annualRatePercentage),
                      gracePeriodDays: Number(policyForm.gracePeriodDays),
                      perEventCap: Number(policyForm.perEventCap || 0),
                      minCharge: Number(policyForm.minCharge || 0),
                      preclosureEnabled: Boolean(policyForm.preclosureEnabled),
                      eligibilityPeriodMonths: Number(policyForm.eligibilityPeriodMonths || 3),
                      eligibilityStartBasis: policyForm.eligibilityStartBasis,
                      inclusiveEndDateRule: Boolean(policyForm.inclusiveEndDateRule),
                      feeCalculationBase: policyForm.feeCalculationBase,
                      rbiFloatingRateForeclosureExempt: Boolean(policyForm.rbiFloatingRateForeclosureExempt),
                      disclosureText: policyForm.disclosureText,
                    };
                    const res = await financeService.createPolicy(payload);
                    dispatch(
                      addToast({
                        type: 'success',
                        title: 'Policy Created',
                        message: `Loan policy [${res?.policyCode || policyForm.policyCode}] successfully registered in database.`,
                      })
                    );
                    setShowNewPolicyModal(false);
                    fetchData();
                  } catch (err) {
                    dispatch(addToast({ type: 'error', message: err.message || 'Failed to create loan policy' }));
                  } finally {
                    setIsCreatingPolicy(false);
                  }
                }}
              >
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title h6 fw-bold mb-0">Create Loan Preclosure & Penal Policy</h5>
                    <small className="text-muted">Authoritative contract terms, lock-in period, and RBI direction rules</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setShowNewPolicyModal(false)} />
                </div>
                <div className="modal-body small">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-bold" htmlFor="newPolName">
                        Policy Title *
                      </label>
                      <input
                        id="newPolName"
                        type="text"
                        className="form-control"
                        placeholder="e.g. HDFC Bank Retail Floating Policy, In-House Commercial Policy"
                        value={policyForm.name}
                        onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newPolCode">
                        Policy Code *
                      </label>
                      <input
                        id="newPolCode"
                        type="text"
                        className="form-control font-monospace text-uppercase"
                        placeholder="e.g. HDFC_FLOAT_2026"
                        value={policyForm.policyCode}
                        onChange={(e) => setPolicyForm({ ...policyForm, policyCode: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newPolCategory">
                        Borrower Category
                      </label>
                      <select
                        id="newPolCategory"
                        className="form-select"
                        value={policyForm.borrowerCategory}
                        onChange={(e) => setPolicyForm({ ...policyForm, borrowerCategory: e.target.value })}
                      >
                        <option value="INDIVIDUAL">Individual Consumer</option>
                        <option value="COMMERCIAL">Commercial Entity / Fleet</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newPolRateType">
                        Interest Structure
                      </label>
                      <select
                        id="newPolRateType"
                        className="form-select"
                        value={policyForm.interestRateType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPolicyForm({
                            ...policyForm,
                            interestRateType: val,
                            rbiFloatingRateForeclosureExempt: val === 'FLOATING',
                            foreclosureChargeRate: val === 'FLOATING' ? 0.0 : policyForm.foreclosureChargeRate,
                          });
                        }}
                      >
                        <option value="FIXED">Fixed Rate</option>
                        <option value="FLOATING">Floating / Variable Rate</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-bold" htmlFor="newPolFcRate">
                        Preclosure Fee Rate (%) *
                      </label>
                      <div className="input-group">
                        <input
                          id="newPolFcRate"
                          type="number"
                          step="0.05"
                          min="0"
                          max="10"
                          className="form-control font-monospace fw-bold"
                          value={policyForm.foreclosureChargeRate}
                          onChange={(e) => setPolicyForm({ ...policyForm, foreclosureChargeRate: e.target.value })}
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newPolGraceDays">
                        Overdue Grace Period (Days)
                      </label>
                      <input
                        id="newPolGraceDays"
                        type="number"
                        min="0"
                        max="30"
                        className="form-control"
                        value={policyForm.gracePeriodDays}
                        onChange={(e) => setPolicyForm({ ...policyForm, gracePeriodDays: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newPolPenalRate">
                        Annual Penal Rate (% p.a.)
                      </label>
                      <input
                        id="newPolPenalRate"
                        type="number"
                        step="0.5"
                        min="0"
                        className="form-control font-monospace"
                        value={policyForm.annualRatePercentage}
                        onChange={(e) => setPolicyForm({ ...policyForm, annualRatePercentage: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newPolEligMonths">
                        Eligibility Window (Months)
                      </label>
                      <input
                        id="newPolEligMonths"
                        type="number"
                        min="1"
                        max="36"
                        className="form-control"
                        value={policyForm.eligibilityPeriodMonths}
                        onChange={(e) => setPolicyForm({ ...policyForm, eligibilityPeriodMonths: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="form-check mt-2">
                        <input
                          id="newPolRbiExempt"
                          type="checkbox"
                          className="form-check-input"
                          checked={Boolean(policyForm.rbiFloatingRateForeclosureExempt)}
                          onChange={(e) => setPolicyForm({ ...policyForm, rbiFloatingRateForeclosureExempt: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="newPolRbiExempt">
                          Enforce RBI Nil-Foreclosure Regulation (Mandatory for retail floating loans)
                        </label>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="form-check mt-2">
                        <input
                          id="newPolPrecloseEnabled"
                          type="checkbox"
                          className="form-check-input"
                          checked={Boolean(policyForm.preclosureEnabled)}
                          onChange={(e) => setPolicyForm({ ...policyForm, preclosureEnabled: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="newPolPrecloseEnabled">
                          Preclosure Enabled for this Product
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="newPolDisclosure">
                        Customer Disclosure & Policy Note
                      </label>
                      <textarea
                        id="newPolDisclosure"
                        rows="2"
                        className="form-control"
                        placeholder="Regulatory reference, lender sanction contract clauses, and foreclosure lock-in terms."
                        value={policyForm.disclosureText}
                        onChange={(e) => setPolicyForm({ ...policyForm, disclosureText: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowNewPolicyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isCreatingPolicy}>
                    {isCreatingPolicy ? 'Saving to Database...' : 'Register Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SANCTION MODAL */}
      {sanctionModalApp && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSanctionSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title h6 fw-bold">Record Lender Loan Sanction</h5>
                  <button type="button" className="btn-close" onClick={() => setSanctionModalApp(null)} />
                </div>
                <div className="modal-body small">
                  <div className="mb-2">
                    <span className="text-muted">Applicant:</span> <strong>{sanctionModalApp.applicantName}</strong>
                  </div>
                  <div className="mb-3">
                    <span className="text-muted">Requested Amount:</span> <strong><MoneyDisplay amount={sanctionModalApp.requestedLoanAmount} /></strong>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="sancAmtInput">Approved / Sanctioned Amount (₹) *</label>
                    <input
                      id="sancAmtInput"
                      type="number"
                      className="form-control fw-bold"
                      value={sanctionForm.sanctionedAmount}
                      onChange={(e) => setSanctionForm({ ...sanctionForm, sanctionedAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="sancRefInput">Bank Sanction Letter Reference *</label>
                    <input
                      id="sancRefInput"
                      type="text"
                      className="form-control font-monospace"
                      value={sanctionForm.sanctionLetterRef}
                      onChange={(e) => setSanctionForm({ ...sanctionForm, sanctionLetterRef: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label" htmlFor="sancRoiInput">Approved ROI (% p.a.)</label>
                      <input
                        id="sancRoiInput"
                        type="number"
                        step="0.1"
                        className="form-control"
                        value={sanctionForm.approvedRoi}
                        onChange={(e) => setSanctionForm({ ...sanctionForm, approvedRoi: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="sancDateInput">Sanction Date</label>
                      <input
                        id="sancDateInput"
                        type="date"
                        className="form-control"
                        value={sanctionForm.sanctionDate}
                        onChange={(e) => setSanctionForm({ ...sanctionForm, sanctionDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSanctionModalApp(null)}>Cancel</button>
                  <button type="submit" className="btn btn-sm btn-info" disabled={isSubmittingWorkflow}>
                    {isSubmittingWorkflow ? 'Recording...' : 'Confirm Loan Sanction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DISBURSEMENT MODAL */}
      {disburseModalApp && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleDisburseSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title h6 fw-bold">Record Lender Fund Disbursement to Dealership</h5>
                  <button type="button" className="btn-close" onClick={() => setDisburseModalApp(null)} />
                </div>
                <div className="modal-body small">
                  <div className="mb-2">
                    <span className="text-muted">Applicant:</span> <strong>{disburseModalApp.applicantName}</strong>
                  </div>
                  <div className="mb-3">
                    <span className="text-muted">Sanctioned:</span> <strong><MoneyDisplay amount={disburseModalApp.sanctionedAmount || disburseModalApp.requestedLoanAmount} /></strong>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="disbAmtInput">Disbursed Amount to Showroom (₹) *</label>
                    <input
                      id="disbAmtInput"
                      type="number"
                      className="form-control fw-bold font-monospace"
                      value={disburseForm.disbursedAmount}
                      onChange={(e) => setDisburseForm({ ...disburseForm, disbursedAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="disbRefInput">Disbursement UTR / Bank Reference *</label>
                    <input
                      id="disbRefInput"
                      type="text"
                      className="form-control font-monospace"
                      value={disburseForm.disbursementRef}
                      onChange={(e) => setDisburseForm({ ...disburseForm, disbursementRef: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="disbDateInput">Disbursement Date</label>
                    <input
                      id="disbDateInput"
                      type="date"
                      className="form-control"
                      value={disburseForm.disbursementDate}
                      onChange={(e) => setDisburseForm({ ...disburseForm, disbursementDate: e.target.value })}
                    />
                  </div>
                  <div className="form-check">
                    <input
                      id="dealerConfirmCheck"
                      type="checkbox"
                      className="form-check-input"
                      checked={disburseForm.dealerReceiptConfirmed}
                      onChange={(e) => setDisburseForm({ ...disburseForm, dealerReceiptConfirmed: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="dealerConfirmCheck">
                      Confirmed received in dealership bank account
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDisburseModalApp(null)}>Cancel</button>
                  <button type="submit" className="btn btn-sm btn-success" disabled={isSubmittingWorkflow}>
                    {isSubmittingWorkflow ? 'Saving...' : 'Record Disbursement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NEW FINANCE APPLICATION MODAL */}
      {showNewAppModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleNewAppSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title h6 fw-bold">Open Customer Finance File</h5>
                  <button type="button" className="btn-close" onClick={() => setShowNewAppModal(false)} />
                </div>
                <div className="modal-body small">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="newAppCustomer">Select Customer *</label>
                      <select
                        id="newAppCustomer"
                        className="form-select"
                        value={appForm.customerId}
                        onChange={(e) => {
                          const cid = e.target.value;
                          const c = customers.find((cust) => String(cust.id) === cid);
                          setAppForm({
                            ...appForm,
                            customerId: cid,
                            applicantName: c ? c.name || c.fullName : '',
                            applicantPhone: c ? c.mobile || c.mobileNumber : '',
                            panNumber: c ? c.panNumber || c.idProofNumber : '',
                          });
                        }}
                        required
                      >
                        <option value="">Choose customer...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.fullName} ({c.mobile || c.mobileNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="newAppVehicle">Vehicle to Finance</label>
                      <select
                        id="newAppVehicle"
                        className="form-select"
                        value={appForm.vehicleId}
                        onChange={(e) => {
                          const vid = e.target.value;
                          const v = availableVehicles.find((veh) => String(veh.id) === vid);
                          const price = v ? Number(v.sellingPrice || v.purchasePrice || 500000) : 0;
                          setAppForm({
                            ...appForm,
                            vehicleId: vid,
                            requestedLoanAmount: String(Math.max(0, price - Number(appForm.customerDownPayment || 100000))),
                          });
                        }}
                      >
                        <option value="">Select available stock...</option>
                        {availableVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)}) — ₹{v.sellingPrice}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newAppMethod">Finance Channel</label>
                      <select
                        id="newAppMethod"
                        className="form-select"
                        value={appForm.financeMethod}
                        onChange={(e) => setAppForm({ ...appForm, financeMethod: e.target.value })}
                      >
                        <option value="EXTERNAL_BANK">External Bank / NBFC</option>
                        <option value="IN_HOUSE_DEALEROS">DEALEROS In-House</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newAppLender">Lender / Partner</label>
                      <select
                        id="newAppLender"
                        className="form-select"
                        value={appForm.lenderId}
                        onChange={(e) => setAppForm({ ...appForm, lenderId: e.target.value })}
                      >
                        {lenders.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newAppPan">Applicant PAN / ID</label>
                      <input
                        id="newAppPan"
                        type="text"
                        className="form-control font-monospace"
                        value={appForm.panNumber}
                        onChange={(e) => setAppForm({ ...appForm, panNumber: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newAppReqAmt">Requested Loan (₹) *</label>
                      <input
                        id="newAppReqAmt"
                        type="number"
                        className="form-control fw-bold"
                        value={appForm.requestedLoanAmount}
                        onChange={(e) => setAppForm({ ...appForm, requestedLoanAmount: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newAppDownPay">Customer Margin Money (₹)</label>
                      <input
                        id="newAppDownPay"
                        type="number"
                        className="form-control"
                        value={appForm.customerDownPayment}
                        onChange={(e) => setAppForm({ ...appForm, customerDownPayment: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="newAppTenure">Requested Tenure</label>
                      <select
                        id="newAppTenure"
                        className="form-select"
                        value={appForm.tenureMonths}
                        onChange={(e) => setAppForm({ ...appForm, tenureMonths: e.target.value })}
                      >
                        <option value="12">12 Months (1 Year)</option>
                        <option value="24">24 Months (2 Years)</option>
                        <option value="36">36 Months (3 Years)</option>
                        <option value="48">48 Months (4 Years)</option>
                        <option value="60">60 Months (5 Years)</option>
                        <option value="84">84 Months (7 Years)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowNewAppModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isSubmittingWorkflow}>
                    {isSubmittingWorkflow ? 'Submitting...' : 'Register Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PAY EMI CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(payingEmi)}
        title="Settle EMI Installment"
        message={
          payingEmi
            ? `Record payment for EMI #${payingEmi.installmentNumber} (${payingEmi.customerName || 'Customer'}) of amount ₹${Number(payingEmi.emiAmount).toLocaleString('en-IN')}? This will mark the installment as PAID.`
            : ''
        }
        confirmLabel="Record Payment"
        confirmVariant="success"
        isLoading={isPaying}
        onConfirm={handleConfirmPayEmi}
        onCancel={() => setPayingEmi(null)}
      />

      </div> {/* End folder-tab-panel */}

      {/* MODAL 1: BOOK LENDER COMMISSION */}
      {showNewCommModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light">
                <h5 className="modal-title h6 fw-bold text-dark d-flex align-items-center gap-2">
                  <DollarSign size={18} className="text-success" />
                  Book Lender Commission Receivable
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowNewCommModal(false)}></button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsBookingComm(true);
                  try {
                    const payload = {
                      lenderId: Number(commForm.lenderId),
                      loanApplicationId: commForm.loanApplicationId ? Number(commForm.loanApplicationId) : null,
                      saleId: commForm.saleId ? Number(commForm.saleId) : null,
                      entryDate: commForm.entryDate,
                      calculationMethod: commForm.calculationMethod,
                      baseAmount: commForm.baseAmount ? Number(commForm.baseAmount) : null,
                      commissionRatePercentage: commForm.commissionRatePercentage ? Number(commForm.commissionRatePercentage) : null,
                      fixedCommissionRate: commForm.fixedCommissionRate ? Number(commForm.fixedCommissionRate) : null,
                      taxPercentage: 0,
                      tdsPercentage: Number(commForm.tdsPercentage || 0),
                      approvedAdjustments: Number(commForm.approvedAdjustments || 0),
                      agreementReference: commForm.agreementReference || 'AGR-' + (commForm.lenderId || 'GEN'),
                      policyVersion: commForm.policyVersion || '1.0',
                      entryMode: commForm.entryMode,
                      manualEntryReason: commForm.manualEntryReason,
                      notes: commForm.notes,
                    };
                    await financeService.createCommissionEntry(payload);
                    dispatch(addToast({ type: 'success', title: 'Commission Booked', message: 'Lender commission receivable accrued successfully.' }));
                    setShowNewCommModal(false);
                    fetchData();
                  } catch (err) {
                    dispatch(addToast({ type: 'error', message: err.message || 'Failed to book commission' }));
                  } finally {
                    setIsBookingComm(false);
                  }
                }}
              >
                <div className="modal-body p-4">
                  {/* Mode Selector */}
                  <div className="d-flex gap-3 mb-4 p-2 bg-light rounded-3 border">
                    <label className="d-flex align-items-center gap-2 flex-grow-1 cursor-pointer p-2 rounded bg-white border">
                      <input
                        type="radio"
                        name="commEntryMode"
                        value="LOAN_LINKED"
                        checked={commForm.entryMode === 'LOAN_LINKED'}
                        onChange={(e) => {
                          setCommForm({ ...commForm, entryMode: e.target.value, loanApplicationId: '', baseAmount: '' });
                          setCommPreview(null);
                        }}
                      />
                      <div>
                        <div className="fw-semibold small">Mode A: Loan-Linked Commission</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Auto-fetch loan disbursement, processing fee, customer & vehicle</div>
                      </div>
                    </label>
                    <label className="d-flex align-items-center gap-2 flex-grow-1 cursor-pointer p-2 rounded bg-white border">
                      <input
                        type="radio"
                        name="commEntryMode"
                        value="MANUAL"
                        checked={commForm.entryMode === 'MANUAL'}
                        onChange={(e) => {
                          setCommForm({ ...commForm, entryMode: e.target.value, loanApplicationId: '', baseAmount: '' });
                          setCommPreview(null);
                        }}
                      />
                      <div>
                        <div className="fw-semibold small">Mode B: Manual Commission Entry</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>DSA / Sourcing incentive entry requiring justification</div>
                      </div>
                    </label>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Banking / NBFC Partner *</label>
                      <select
                        className="form-select form-select-sm"
                        value={commForm.lenderId}
                        required
                        onChange={(e) => {
                          const chosenId = e.target.value;
                          const found = lenders.find((l) => String(l.id) === String(chosenId));
                          setCommForm({
                            ...commForm,
                            lenderId: chosenId,
                            loanApplicationId: '',
                            baseAmount: '',
                            commissionRatePercentage: found?.dealerCommissionPercentage ? String(found?.dealerCommissionPercentage) : commForm.commissionRatePercentage,
                            agreementReference: found?.lenderCode ? `AGR-${found.lenderCode}` : '',
                          });
                          setCommPreview(null);
                          loadApplicationsForLender(chosenId);
                        }}
                      >
                        <option value="">{lenders.length === 0 ? 'No active finance partners found' : 'Select Partner...'}</option>
                        {lenders.map((l) => (
                          <option key={l.id} value={l.id}>{l.name} ({l.lenderType || 'BANK'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Entry / Booking Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={commForm.entryDate}
                        required
                        onChange={(e) => setCommForm({ ...commForm, entryDate: e.target.value })}
                      />
                    </div>

                    {commForm.entryMode === 'LOAN_LINKED' && (
                      <div className="col-12">
                        <label className="form-label small fw-semibold">
                          Select Disbursed / Sanctioned Loan Application *
                          {isLoadingLenderApps && <span className="ms-2 text-primary small">(Loading partner applications...)</span>}
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={commForm.loanApplicationId}
                          required
                          disabled={!commForm.lenderId || isLoadingLenderApps}
                          onChange={(e) => {
                            const appId = e.target.value;
                            const foundApp = lenderApplications.find((a) => String(a.id) === String(appId));
                            if (foundApp) {
                              const calcBase = commForm.calculationMethod === 'PERCENTAGE_OF_DISBURSEMENT'
                                ? (foundApp.disbursedAmount || foundApp.sanctionedAmount || foundApp.requestedLoanAmount)
                                : (foundApp.processingFee || 5000);
                              setCommForm({
                                ...commForm,
                                loanApplicationId: appId,
                                baseAmount: String(calcBase),
                              });
                            } else {
                              setCommForm({ ...commForm, loanApplicationId: appId, baseAmount: '' });
                            }
                            setCommPreview(null);
                          }}
                        >
                          <option value="">
                            {!commForm.lenderId
                              ? 'Select a finance partner first...'
                              : lenderApplications.length === 0
                              ? 'No eligible disbursed or sanctioned loans found for this partner'
                              : 'Choose loan application...'}
                          </option>
                          {lenderApplications.map((a) => (
                            <option key={a.id} value={a.id}>
                              #{a.id} ({a.applicationNumber || 'APP-' + a.id}) - {a.applicantName} | {a.status} | Disbursed: ₹{(a.disbursedAmount || 0).toLocaleString('en-IN')} | Proc Fee: ₹{(a.processingFee || 0).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                          Only loans registered with the selected partner in SANCTIONED or DISBURSED status are eligible.
                        </small>
                      </div>
                    )}

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Calculation Method *</label>
                      <select
                        className="form-select form-select-sm"
                        value={commForm.calculationMethod}
                        onChange={(e) => {
                          const newMethod = e.target.value;
                          let newBase = commForm.baseAmount;
                          if (commForm.loanApplicationId) {
                            const foundApp = lenderApplications.find((a) => String(a.id) === String(commForm.loanApplicationId));
                            if (foundApp) {
                              newBase = newMethod === 'PERCENTAGE_OF_DISBURSEMENT'
                                ? String(foundApp.disbursedAmount || foundApp.sanctionedAmount || 0)
                                : String(foundApp.processingFee || 5000);
                            }
                          }
                          setCommForm({ ...commForm, calculationMethod: newMethod, baseAmount: newBase });
                          setCommPreview(null);
                        }}
                      >
                        <option value="PERCENTAGE_OF_PROCESSING_FEE">Method A: % of Eligible Processing Fee</option>
                        <option value="PERCENTAGE_OF_DISBURSEMENT">Method B: % of Actual Loan Disbursement</option>
                        <option value="FIXED_PER_LOAN">Method C: Fixed Commission per Disbursed Loan</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        {commForm.calculationMethod === 'FIXED_PER_LOAN' ? 'Fixed Commission Amount (₹) *' : 'Base Amount (Disbursement / Fee) (₹) *'}
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="e.g. 5000"
                        value={commForm.baseAmount}
                        required
                        onChange={(e) => {
                          setCommForm({ ...commForm, baseAmount: e.target.value });
                          setCommPreview(null);
                        }}
                      />
                    </div>

                    {commForm.calculationMethod !== 'FIXED_PER_LOAN' && (
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Commission Rate (%) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm"
                          placeholder="e.g. 80.00"
                          value={commForm.commissionRatePercentage}
                          required
                          onChange={(e) => {
                            setCommForm({ ...commForm, commissionRatePercentage: e.target.value });
                            setCommPreview(null);
                          }}
                        />
                      </div>
                    )}

                    <div className={commForm.calculationMethod === 'FIXED_PER_LOAN' ? 'col-md-6' : 'col-md-6'}>
                      <label className="form-label small fw-semibold">
                        Approved TDS Withholding (%) <span className="text-muted fw-normal">(0% if exempt / not configured)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm"
                        placeholder="0.00"
                        value={commForm.tdsPercentage}
                        onChange={(e) => {
                          setCommForm({ ...commForm, tdsPercentage: e.target.value });
                          setCommPreview(null);
                        }}
                      />
                    </div>

                    {commForm.entryMode === 'MANUAL' && (
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-danger">Reason for Manual Booking *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Audit justification for manual DSA / partner commission..."
                          value={commForm.manualEntryReason}
                          required
                          onChange={(e) => setCommForm({ ...commForm, manualEntryReason: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted fw-semibold">Calculation Breakdown Preview (GST Excluded)</span>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-primary py-0.5 px-2"
                          disabled={!commForm.baseAmount || Number(commForm.baseAmount) <= 0}
                          onClick={async () => {
                            try {
                              const preview = await financeService.calculateCommissionPreview({
                                calculationMethod: commForm.calculationMethod,
                                baseAmount: Number(commForm.baseAmount || 0),
                                commissionRatePercentage: Number(commForm.commissionRatePercentage || 0),
                                fixedCommissionRate: Number(commForm.fixedCommissionRate || commForm.baseAmount || 0),
                                taxPercentage: 0,
                                tdsPercentage: Number(commForm.tdsPercentage || 0),
                                approvedAdjustments: Number(commForm.approvedAdjustments || 0),
                              });
                              setCommPreview(preview);
                            } catch (err) {
                              dispatch(addToast({ type: 'error', message: 'Calculation preview failed' }));
                            }
                          }}
                        >
                          Calculate Breakdown
                        </button>
                      </div>

                      {commPreview && (
                        <div className="p-3 bg-light rounded-3 border">
                          <div className="row text-center g-2 small">
                            <div className="col-4">
                              <div className="text-muted">Gross Commission</div>
                              <div className="fs-6 fw-bold text-dark font-monospace">₹{Number(commPreview.grossCommission).toLocaleString('en-IN')}</div>
                            </div>
                            <div className="col-4">
                              <div className="text-muted">TDS Withheld ({commPreview.tdsPercentage}%)</div>
                              <div className="fs-6 fw-bold text-danger font-monospace">
                                {Number(commPreview.tdsWithheld) > 0 ? `-₹${Number(commPreview.tdsWithheld).toLocaleString('en-IN')}` : '₹0 (0%)'}
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="text-muted">Net Receivable</div>
                              <div className="fs-6 fw-bold text-success font-monospace">₹{Number(commPreview.netReceivable).toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowNewCommModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-success text-white" disabled={isBookingComm}>
                    {isBookingComm ? 'Accruing...' : 'Confirm & Book Commission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RAISE GST COMMISSION INVOICE */}
      {invoiceModalComm && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title h6 fw-bold text-dark">Raise Commission Invoice to Lender</h5>
                <button type="button" className="btn-close" onClick={() => setInvoiceModalComm(null)}></button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await financeService.generateCommissionInvoice(invoiceModalComm.id, invoiceForm.invoiceNumber);
                    dispatch(addToast({ type: 'success', title: 'Invoice Raised', message: `Invoice ${invoiceForm.invoiceNumber} registered.` }));
                    setInvoiceModalComm(null);
                    fetchData();
                  } catch (err) {
                    dispatch(addToast({ type: 'error', message: err.message || 'Invoice generation failed' }));
                  }
                }}
              >
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Commission Reference</label>
                    <input type="text" className="form-control form-control-sm font-monospace" readOnly value={invoiceModalComm.commissionReference} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Lender / NBFC Partner</label>
                    <input type="text" className="form-control form-control-sm" readOnly value={invoiceModalComm.lenderName || 'External Partner'} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Invoice Number *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={invoiceForm.invoiceNumber}
                      required
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Invoice Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={invoiceForm.invoiceDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                    />
                  </div>
                  <div className="p-3 bg-light rounded-3 small">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Gross Commission:</span>
                      <strong>₹{Number(invoiceModalComm.grossCommission).toLocaleString('en-IN')}</strong>
                    </div>
                    {Number(invoiceModalComm.tdsWithheld) > 0 && (
                      <div className="d-flex justify-content-between mb-1 text-danger">
                        <span>TDS Withheld ({invoiceModalComm.tdsPercentage}%):</span>
                        <strong>-₹{Number(invoiceModalComm.tdsWithheld).toLocaleString('en-IN')}</strong>
                      </div>
                    )}
                    <div className="d-flex justify-content-between pt-1 border-top">
                      <span>Net Receivable Value:</span>
                      <strong className="text-primary fs-6 font-monospace">
                        ₹{Number(invoiceModalComm.netReceivable).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setInvoiceModalComm(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Register Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD BANK SETTLEMENT RECEIPT */}
      {receiptModalComm && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title h6 fw-bold text-dark d-flex align-items-center gap-2">
                  <CheckCircle size={18} className="text-success" />
                  Record Partner Bank Settlement
                </h5>
                <button type="button" className="btn-close" onClick={() => setReceiptModalComm(null)}></button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsRecordingReceipt(true);
                  try {
                    await financeService.recordCommissionReceipt(receiptModalComm.id, {
                      receiptDate: receiptForm.receiptDate,
                      totalReceivedAmount: Number(receiptForm.totalReceivedAmount),
                      paymentMethod: receiptForm.paymentMethod,
                      bankUtrReference: receiptForm.bankUtrReference,
                      bankName: receiptForm.bankName,
                      tdsDeductedByBank: Number(receiptForm.tdsDeductedByBank || 0),
                      reconciliationNotes: receiptForm.reconciliationNotes,
                    });
                    dispatch(addToast({ type: 'success', title: 'Payment Reconciled', message: `Settlement receipt recorded and reconciled against commission.` }));
                    setReceiptModalComm(null);
                    fetchData();
                  } catch (err) {
                    dispatch(addToast({ type: 'error', message: err.message || 'Settlement recording failed' }));
                  } finally {
                    setIsRecordingReceipt(false);
                  }
                }}
              >
                <div className="modal-body p-4">
                  <div className="mb-2 p-2 bg-light rounded border small">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Commission Ref:</span>
                      <strong className="font-monospace">{receiptModalComm.commissionReference}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Net Receivable:</span>
                      <strong className="text-success font-monospace">₹{Number(receiptModalComm.netReceivable).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Outstanding Balance:</span>
                      <strong className="text-danger font-monospace">
                        ₹{Number(receiptModalComm.outstandingBalance ?? receiptModalComm.netReceivable).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Settlement / Receipt Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={receiptForm.receiptDate}
                        required
                        onChange={(e) => setReceiptForm({ ...receiptForm, receiptDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Net Amount Received (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm font-monospace fw-bold"
                        value={receiptForm.totalReceivedAmount}
                        required
                        onChange={(e) => setReceiptForm({ ...receiptForm, totalReceivedAmount: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Payment Mode *</label>
                      <select
                        className="form-select form-select-sm"
                        value={receiptForm.paymentMethod}
                        onChange={(e) => setReceiptForm({ ...receiptForm, paymentMethod: e.target.value })}
                      >
                        <option value="BANK_TRANSFER">NEFT / RTGS / IMPS</option>
                        <option value="CHEQUE">Bank Cheque</option>
                        <option value="UPI">Direct UPI Transfer</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Bank UTR / Ref Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        placeholder="e.g. UTR987654321"
                        value={receiptForm.bankUtrReference}
                        required
                        onChange={(e) => setReceiptForm({ ...receiptForm, bankUtrReference: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Lender Remitting Bank</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={receiptForm.bankName}
                        onChange={(e) => setReceiptForm({ ...receiptForm, bankName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">TDS Deducted By Bank (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm"
                        value={receiptForm.tdsDeductedByBank}
                        onChange={(e) => setReceiptForm({ ...receiptForm, tdsDeductedByBank: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Reconciliation Notes</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={receiptForm.reconciliationNotes}
                        onChange={(e) => setReceiptForm({ ...receiptForm, reconciliationNotes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setReceiptModalComm(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-success text-white" disabled={isRecordingReceipt}>
                    {isRecordingReceipt ? 'Recording...' : 'Confirm Bank Settlement'}
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

export default FinanceListPage;
