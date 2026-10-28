import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { inventoryService } from '../../services/inventoryService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import SearchInput from '../../components/common/SearchInput';
import { formatPhone } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import {
  Truck,
  Plus,
  Mail,
  Phone,
  FileText,
  DollarSign,
  CreditCard,
  Ban,
  Building,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';

const supplierSchema = z.object({
  name: z.string().min(2, 'Agency / Business name is required'),
  supplierType: z.string().default('SPARE_PARTS'),
  contactPerson: z.string().optional(),
  mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
  alternateContact: z.string().optional(),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  bankDetails: z.string().optional(),
  openingOutstandingBalance: z.number().min(0).default(0),
  openingAdvanceBalance: z.number().min(0).default(0),
  creditEnabled: z.boolean().default(true),
  creditLimit: z.number().min(0).default(50000),
  creditPeriodDays: z.number().min(0).default(30),
  paymentTerms: z.string().default('CREDIT'),
  notes: z.string().optional(),
});

export function SupplierListPage() {
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('INVENTORY', 'ADD');
  const canEdit = hasPermission('INVENTORY', 'EDIT');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [activeFilter, setActiveFilter] = useState('');

  const {
    page,
    size,
    sortBy,
    sortDirection,
    handlePageChange,
    handleSizeChange,
    handleSort,
  } = usePagination(0, 10);

  const [suppliers, setSuppliers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add/Edit Supplier Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Supplier Ledger/Details Drawer
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ledger' | 'purchases'
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [statement, setStatement] = useState(null);

  // Purchase History for Selected Supplier
  const [supplierPurchases, setSupplierPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [purchaseStartDate, setPurchaseStartDate] = useState('');
  const [purchaseEndDate, setPurchaseEndDate] = useState('');

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplierType: 'SPARE_PARTS',
      openingOutstandingBalance: 0,
      openingAdvanceBalance: 0,
      creditEnabled: true,
      creditLimit: 100000,
      creditPeriodDays: 30,
      paymentTerms: 'CREDIT',
    },
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getAllSuppliers({
        page,
        size,
        sortBy,
        sortDirection,
        search: debouncedSearch || undefined,
        active: activeFilter !== '' ? activeFilter === 'true' : undefined,
      });
      setSuppliers(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, size, sortBy, sortDirection, debouncedSearch, activeFilter]);

  const handleOpenCreate = () => {
    setEditingSupplierId(null);
    reset({
      supplierType: 'SPARE_PARTS',
      openingOutstandingBalance: 0,
      openingAdvanceBalance: 0,
      creditEnabled: true,
      creditLimit: 100000,
      creditPeriodDays: 30,
      paymentTerms: 'CREDIT',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplierId(sup.id);
    reset({
      name: sup.name,
      supplierType: sup.supplierType || 'SPARE_PARTS',
      contactPerson: sup.contactPerson || '',
      mobile: sup.mobile || '',
      alternateContact: sup.alternateContact || '',
      email: sup.email || '',
      gstNumber: sup.gstNumber || '',
      panNumber: sup.panNumber || '',
      address: sup.address || '',
      city: sup.city || '',
      state: sup.state || '',
      pincode: sup.pincode || '',
      bankDetails: sup.bankDetails || '',
      openingOutstandingBalance: Number(sup.openingOutstandingBalance || 0),
      openingAdvanceBalance: Number(sup.openingAdvanceBalance || 0),
      creditEnabled: sup.creditEnabled !== false,
      creditLimit: Number(sup.creditLimit || 0),
      creditPeriodDays: Number(sup.creditPeriodDays || 30),
      paymentTerms: sup.paymentTerms || 'CREDIT',
      notes: sup.notes || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const onSubmitSupplier = async (data) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      const payload = {
        name: data.name,
        supplierType: data.supplierType,
        contactPerson: data.contactPerson || null,
        mobile: data.mobile,
        alternateContact: data.alternateContact || null,
        email: data.email || null,
        gstNumber: data.gstNumber || null,
        panNumber: data.panNumber || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        bankDetails: data.bankDetails || null,
        openingOutstandingBalance: Number(data.openingOutstandingBalance || 0),
        openingAdvanceBalance: Number(data.openingAdvanceBalance || 0),
        creditEnabled: Boolean(data.creditEnabled),
        creditLimit: Number(data.creditLimit || 0),
        creditPeriodDays: Number(data.creditPeriodDays || 30),
        paymentTerms: data.paymentTerms,
        notes: data.notes || null,
      };

      if (editingSupplierId) {
        await inventoryService.updateSupplier(editingSupplierId, payload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Supplier Updated',
            message: `${data.name} details successfully updated.`,
          })
        );
      } else {
        await inventoryService.createSupplier(payload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Supplier Registered',
            message: `${data.name} successfully registered.`,
          })
        );
      }

      setIsModalOpen(false);
      setEditingSupplierId(null);
      reset();
      fetchSuppliers();
    } catch (err) {
      setModalError(err.message || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate supplier "${name}"? Ledger history will be fully preserved.`)) return;
    try {
      await inventoryService.deactivateSupplier(id);
      dispatch(addToast({ type: 'info', title: 'Supplier Deactivated', message: `${name} is now inactive.` }));
      fetchSuppliers();
      if (selectedSupplier?.id === id) {
        setSelectedSupplier((prev) => ({ ...prev, active: false }));
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Action Failed', message: err.message }));
    }
  };

  const openSupplierDrawer = async (sup) => {
    setSelectedSupplier(sup);
    setActiveTab('overview');
    loadLedger(sup.id);
    loadPurchases(sup.id);
  };

  const loadPurchases = async (supId) => {
    setPurchasesLoading(true);
    try {
      const res = await inventoryService.getAllPurchaseInvoices({
        supplierId: supId,
        size: 50,
      });
      setSupplierPurchases(res.content || []);
    } catch (err) {
      console.error('Failed to load purchases', err);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const loadLedger = async (supId) => {
    setLedgerLoading(true);
    try {
      const [ledgerRes, stmtRes] = await Promise.all([
        inventoryService.getSupplierLedger(supId, { size: 50 }).catch(() => ({ content: [] })),
        inventoryService.getSupplierStatement(supId).catch(() => null),
      ]);
      setLedgerEntries(ledgerRes.content || []);
      setStatement(stmtRes);
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    setPaymentLoading(true);
    try {
      await inventoryService.recordSupplierPayment({
        supplierId: selectedSupplier.id,
        amount: Number(paymentAmount),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod,
        transactionReference: paymentRef,
        isAdvance: true,
        notes: paymentNotes || 'Advance payment to supplier account',
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Payment Recorded',
          message: `Payment of ₹${paymentAmount} logged to ${selectedSupplier.name}.`,
        })
      );
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      loadLedger(selectedSupplier.id);
      fetchSuppliers();
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Payment Failed', message: err.message }));
    } finally {
      setPaymentLoading(false);
    }
  };

  const columns = [
    {
      header: 'Supplier / Agency',
      field: 'name',
      sortable: true,
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{ width: '38px', height: '38px' }}
          >
            <Truck size={18} />
          </div>
          <div>
            <div className="fw-bold text-dark">{row.name}</div>
            <div className="text-muted small">
              <span className="font-monospace text-primary fw-semibold">{row.supplierCode || 'SUP-000'}</span>
              {' • '}
              {row.supplierType ? row.supplierType.replace(/_/g, ' ') : 'SPARE PARTS'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      field: 'mobile',
      render: (row) => (
        <div className="small">
          <div className="font-monospace text-dark">{formatPhone(row.mobile)}</div>
          <div className="text-muted">{row.contactPerson || 'Office'}</div>
        </div>
      ),
    },
    {
      header: 'GSTIN / City',
      field: 'gstNumber',
      render: (row) => (
        <div className="small">
          <div className="badge bg-light text-dark border font-monospace mb-1">{row.gstNumber || 'Unregistered'}</div>
          <div className="text-muted">{row.city ? `${row.city}, ${row.state || ''}` : 'Local'}</div>
        </div>
      ),
    },
    {
      header: 'Credit Policy',
      field: 'creditLimit',
      render: (row) => (
        <div className="small">
          <div>
            Limit: <strong className="font-monospace"><MoneyDisplay amount={row.creditLimit || 0} /></strong>
          </div>
          <div className="text-muted">{row.creditPeriodDays || 30} Days ({row.paymentTerms || 'Credit'})</div>
        </div>
      ),
    },
    {
      header: 'Outstanding Balance',
      field: 'outstandingAmount',
      render: (row) => (
        <div className="small">
          <div className={`fw-bold font-monospace ${Number(row.outstandingAmount || 0) > 0 ? 'text-danger' : 'text-success'}`}>
            <MoneyDisplay amount={row.outstandingAmount || 0} />
          </div>
          <div className="text-muted">Avail: <MoneyDisplay amount={row.availableCredit || 0} /></div>
        </div>
      ),
    },
    {
      header: 'Status',
      field: 'active',
      render: (row) => (
        <span className={`badge ${row.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      field: 'id',
      render: (row) => (
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary py-0 px-2"
            onClick={() => openSupplierDrawer(row)}
            title="View Details & Ledger"
          >
            <Eye size={13} className="me-1" /> View
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-2"
              onClick={() => handleOpenEdit(row)}
              title="Edit Supplier"
            >
              Edit
            </button>
          )}
          {row.active && canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-0 px-2"
              onClick={() => handleDeactivate(row.id, row.name)}
              title="Deactivate Supplier"
            >
              <Ban size={13} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Suppliers & Parts Agencies"
        subtitle="Manage registered parts suppliers, credit agreements, purchase history, and chronological ledger"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Suppliers' }]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-1"
            onClick={handleOpenCreate}
          >
            <Plus size={16} /> Register Agency
          </button>
        )}
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="app-card p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by supplier name, code, mobile or GSTIN..."
            />
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Statuses (Active & Inactive)</option>
              <option value="true">Active Agencies Only</option>
              <option value="false">Inactive Agencies</option>
            </select>
          </div>
          <div className="col-12 col-md text-md-end text-muted small">
            Found <strong>{totalElements}</strong> registered suppliers
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={suppliers}
        loading={isLoading}
        error={error}
        totalItems={totalElements}
        totalPages={totalPages}
        currentPage={page}
        pageSize={size}
        onPageChange={handlePageChange}
        onPageSizeChange={handleSizeChange}
        onSort={handleSort}
        sortBy={sortBy}
        sortDirection={sortDirection}
        emptyMessage="No suppliers registered. Click 'Register Agency' to add your first parts dealer."
      />

      {/* Supplier Ledger & Details Drawer / Modal */}
      {selectedSupplier && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4 bg-light">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary text-white p-2">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h5 className="modal-title h6 fw-bold mb-0 text-dark">
                      {selectedSupplier.name} ({selectedSupplier.supplierCode || 'SUP-000'})
                    </h5>
                    <div className="text-muted small">
                      {selectedSupplier.contactPerson || 'Office'} • {formatPhone(selectedSupplier.mobile)} • {selectedSupplier.city || 'Local'}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <DollarSign size={15} /> Make Payment
                  </button>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedSupplier(null)}
                  />
                </div>
              </div>

              {/* Sub-navigation Tabs */}
              <div className="border-bottom px-4 pt-2 bg-white d-flex gap-4">
                <button
                  type="button"
                  className={`btn btn-link text-decoration-none px-0 py-2 border-bottom border-2 ${
                    activeTab === 'overview' ? 'border-primary fw-bold text-primary' : 'border-transparent text-muted'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Account Overview
                </button>
                <button
                  type="button"
                  className={`btn btn-link text-decoration-none px-0 py-2 border-bottom border-2 ${
                    activeTab === 'ledger' ? 'border-primary fw-bold text-primary' : 'border-transparent text-muted'
                  }`}
                  onClick={() => setActiveTab('ledger')}
                >
                  Chronological Ledger ({ledgerEntries.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-link text-decoration-none px-0 py-2 border-bottom border-2 ${
                    activeTab === 'purchases' ? 'border-primary fw-bold text-primary' : 'border-transparent text-muted'
                  }`}
                  onClick={() => setActiveTab('purchases')}
                >
                  Purchase History ({supplierPurchases.length})
                </button>
              </div>

              <div className="modal-body p-4 bg-light-subtle">
                {activeTab === 'overview' && (
                  <div className="row g-4">
                    {/* Financial Summary Cards */}
                    <div className="col-12 col-md-3">
                      <div className="app-card p-3 border-start border-4 border-primary">
                        <div className="text-muted small text-uppercase fw-semibold">Total Purchases</div>
                        <div className="h4 fw-bold mb-0 font-monospace text-dark mt-1">
                          <MoneyDisplay amount={selectedSupplier.totalPurchases || 0} />
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div className="app-card p-3 border-start border-4 border-success">
                        <div className="text-muted small text-uppercase fw-semibold">Total Payments Made</div>
                        <div className="h4 fw-bold mb-0 font-monospace text-success mt-1">
                          <MoneyDisplay amount={selectedSupplier.totalPayments || 0} />
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div className="app-card p-3 border-start border-4 border-danger">
                        <div className="text-muted small text-uppercase fw-semibold">Net Outstanding</div>
                        <div className="h4 fw-bold mb-0 font-monospace text-danger mt-1">
                          <MoneyDisplay amount={selectedSupplier.outstandingAmount || 0} />
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div className="app-card p-3 border-start border-4 border-info">
                        <div className="text-muted small text-uppercase fw-semibold">Available Credit</div>
                        <div className="h4 fw-bold mb-0 font-monospace text-info mt-1">
                          <MoneyDisplay amount={selectedSupplier.availableCredit || 0} />
                        </div>
                      </div>
                    </div>

                    {/* Detailed info */}
                    <div className="col-12 col-md-6">
                      <div className="app-card p-3 h-100">
                        <h6 className="fw-bold mb-3">Credit & Terms Details</h6>
                        <div className="row g-2 small">
                          <div className="col-6 text-muted">Credit Limit:</div>
                          <div className="col-6 fw-bold font-monospace"><MoneyDisplay amount={selectedSupplier.creditLimit || 0} /></div>
                          <div className="col-6 text-muted">Credit Period:</div>
                          <div className="col-6 fw-semibold">{selectedSupplier.creditPeriodDays || 30} Days</div>
                          <div className="col-6 text-muted">Payment Terms:</div>
                          <div className="col-6 fw-semibold">{selectedSupplier.paymentTerms || 'Credit'}</div>
                          <div className="col-6 text-muted">GST Number:</div>
                          <div className="col-6 font-monospace">{selectedSupplier.gstNumber || 'Unregistered'}</div>
                          <div className="col-6 text-muted">PAN Number:</div>
                          <div className="col-6 font-monospace">{selectedSupplier.panNumber || '—'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="app-card p-3 h-100">
                        <h6 className="fw-bold mb-3">Bank Details & Address</h6>
                        <div className="small text-muted mb-2">
                          <strong>Address:</strong> {selectedSupplier.address || '—'}, {selectedSupplier.city || ''} {selectedSupplier.state || ''} {selectedSupplier.pincode || ''}
                        </div>
                        <div className="small text-muted mb-2">
                          <strong>Bank Account Reference:</strong>
                          <div className="p-2 bg-light rounded mt-1 font-monospace text-dark">
                            {selectedSupplier.bankDetails || 'No bank account records on file'}
                          </div>
                        </div>
                        {selectedSupplier.notes && (
                          <div className="small text-muted">
                            <strong>Notes:</strong> {selectedSupplier.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ledger' && (
                  <div>
                    {statement && (
                      <div className="app-card p-3 mb-3 bg-white d-flex justify-content-between align-items-center">
                        <div className="small">
                          Statement: <strong>{formatDate(statement.fromDate)}</strong> to <strong>{formatDate(statement.toDate)}</strong>
                        </div>
                        <div className="d-flex gap-4 small">
                          <div>Opening: <strong className="font-monospace"><MoneyDisplay amount={statement.openingBalance} /></strong></div>
                          <div>Total Debits: <strong className="font-monospace text-success"><MoneyDisplay amount={statement.totalDebits} /></strong></div>
                          <div>Total Credits: <strong className="font-monospace text-danger"><MoneyDisplay amount={statement.totalCredits} /></strong></div>
                          <div>Closing Balance: <strong className="font-monospace text-primary"><MoneyDisplay amount={statement.closingBalance} /></strong></div>
                        </div>
                      </div>
                    )}

                    <div className="app-card p-0 overflow-hidden bg-white">
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Reference / Type</th>
                            <th>Description</th>
                            <th className="text-end">Debit (₹ Paid)</th>
                            <th className="text-end">Credit (₹ Bill)</th>
                            <th className="text-end">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerLoading ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4 text-muted">Loading ledger entries...</td>
                            </tr>
                          ) : ledgerEntries.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4 text-muted">No transactions recorded for this supplier.</td>
                            </tr>
                          ) : (
                            ledgerEntries.map((e) => (
                              <tr key={e.id}>
                                <td>{formatDate(e.entryDate)}</td>
                                <td>
                                  <span className="badge bg-light text-dark border font-monospace me-1">{e.referenceNumber || '—'}</span>
                                  <span className="text-muted small">({e.referenceType})</span>
                                </td>
                                <td>{e.description}</td>
                                <td className="text-end font-monospace text-success">
                                  {Number(e.debitAmount) > 0 ? <MoneyDisplay amount={e.debitAmount} /> : '—'}
                                </td>
                                <td className="text-end font-monospace text-danger">
                                  {Number(e.creditAmount) > 0 ? <MoneyDisplay amount={e.creditAmount} /> : '—'}
                                </td>
                                <td className="text-end font-monospace fw-bold">
                                  <MoneyDisplay amount={e.runningBalance} />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'purchases' && (
                  <div>
                    {/* Filters Toolbar */}
                    <div className="app-card p-3 mb-3 bg-white">
                      <div className="row g-2 align-items-center">
                        <div className="col-12 col-md-5">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search by invoice # or purchase #"
                            value={purchaseSearchTerm}
                            onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                          />
                        </div>
                        <div className="col-6 col-md-3">
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            title="Start Date"
                            value={purchaseStartDate}
                            onChange={(e) => setPurchaseStartDate(e.target.value)}
                          />
                        </div>
                        <div className="col-6 col-md-3">
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            title="End Date"
                            value={purchaseEndDate}
                            onChange={(e) => setPurchaseEndDate(e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-1 text-end">
                          {(purchaseSearchTerm || purchaseStartDate || purchaseEndDate) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-muted p-0 small"
                              onClick={() => {
                                setPurchaseSearchTerm('');
                                setPurchaseStartDate('');
                                setPurchaseEndDate('');
                              }}
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="app-card p-0 overflow-hidden bg-white">
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Purchase #</th>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th className="text-end">Invoice Total</th>
                            <th className="text-end">Paid Amount</th>
                            <th className="text-end">Outstanding</th>
                            <th>Payment Status</th>
                            <th>Payment Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchasesLoading ? (
                            <tr>
                              <td colSpan="8" className="text-center py-4 text-muted">Loading purchase history...</td>
                            </tr>
                          ) : (
                            (() => {
                              const filtered = supplierPurchases.filter((p) => {
                                if (purchaseSearchTerm) {
                                  const term = purchaseSearchTerm.toLowerCase();
                                  const matchInv = p.supplierInvoiceNumber?.toLowerCase().includes(term);
                                  const matchPo = p.purchaseNumber?.toLowerCase().includes(term) || p.invoiceNumber?.toLowerCase().includes(term);
                                  if (!matchInv && !matchPo) return false;
                                }
                                if (purchaseStartDate && p.invoiceDate < purchaseStartDate) return false;
                                if (purchaseEndDate && p.invoiceDate > purchaseEndDate) return false;
                                return true;
                              });

                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan="8" className="text-center py-4 text-muted">
                                      No purchase bills match the selected criteria.
                                    </td>
                                  </tr>
                                );
                              }

                              return filtered.map((inv) => (
                                <tr key={inv.id}>
                                  <td className="font-monospace fw-semibold text-primary">{inv.purchaseNumber || inv.invoiceNumber}</td>
                                  <td className="font-monospace">{inv.supplierInvoiceNumber || '—'}</td>
                                  <td>{formatDate(inv.invoiceDate)}</td>
                                  <td className="text-end font-monospace fw-bold"><MoneyDisplay amount={inv.invoiceTotal || 0} /></td>
                                  <td className="text-end font-monospace text-success"><MoneyDisplay amount={inv.amountPaid || 0} /></td>
                                  <td className="text-end font-monospace text-danger">
                                    <MoneyDisplay amount={inv.amountOutstanding || 0} />
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      inv.paymentStatus === 'PAID'
                                        ? 'bg-success-subtle text-success'
                                        : inv.paymentStatus === 'PARTIALLY_PAID'
                                        ? 'bg-warning-subtle text-warning'
                                        : 'bg-danger-subtle text-danger'
                                    }`}>
                                      {inv.paymentStatus || 'UNPAID'}
                                    </span>
                                  </td>
                                  <td className="text-muted small">
                                    {inv.paymentMethod ? inv.paymentMethod.replace('_', ' ') : '—'}
                                  </td>
                                </tr>
                              ));
                            })()
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top py-2 px-4 bg-white">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedSupplier(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Record Supplier Payment</h5>
                <button type="button" className="btn-close" onClick={() => setIsPaymentModalOpen(false)} />
              </div>
              <form onSubmit={handleRecordPayment}>
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 px-3 small rounded-3 mb-3">
                    Recording payment for <strong>{selectedSupplier?.name}</strong>. This will reduce outstanding balance and debit the ledger.
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="payAmt">Payment Amount (₹)*</label>
                    <input
                      id="payAmt"
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="payMethod">Payment Method*</label>
                    <select
                      id="payMethod"
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="payRef">Transaction / UTR Reference</label>
                    <input
                      id="payRef"
                      type="text"
                      className="form-control"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. UTR12345678 or Chq #0045"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="payNotes">Notes / Narration</label>
                    <input
                      id="payNotes"
                      type="text"
                      className="form-control"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Optional payment notes"
                    />
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-success" disabled={paymentLoading}>
                    {paymentLoading ? 'Posting...' : 'Confirm & Post Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Register Agency Modal */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1050 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">
                  {editingSupplierId ? 'Edit Supplier Details' : 'Register Parts Agency / Supplier'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmit(onSubmitSupplier)}>
                <div className="modal-body p-4">
                  {modalError && <div className="alert alert-danger small py-2 px-3 mb-3">{modalError}</div>}

                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label" htmlFor="supName">Agency / Business Name*</label>
                      <input
                        id="supName"
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="e.g. Apex Auto Spares Pvt Ltd"
                        {...register('name')}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="supType">Supplier Type*</label>
                      <select id="supType" className="form-select" {...register('supplierType')}>
                        <option value="SPARE_PARTS">Spare Parts</option>
                        <option value="SERVICE_CENTRE">Service Centre</option>
                        <option value="MECHANIC">Mechanic</option>
                        <option value="TYRE_DEALER">Tyre Dealer</option>
                        <option value="BATTERY_DEALER">Battery Dealer</option>
                        <option value="OIL_LUBRICANT_DEALER">Oil & Lubricants</option>
                        <option value="ELECTRICAL_PARTS">Electrical Parts</option>
                        <option value="BODY_PARTS">Body Parts</option>
                        <option value="GENERAL_SUPPLIER">General Supplier</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="contactName">Contact Person Name</label>
                      <input
                        id="contactName"
                        type="text"
                        className="form-control"
                        placeholder="e.g. Ramesh Kumar"
                        {...register('contactPerson')}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="mobNo">Mobile Number*</label>
                      <input
                        id="mobNo"
                        type="tel"
                        className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                        placeholder="e.g. 9876543210"
                        {...register('mobile')}
                      />
                      {errors.mobile && <div className="invalid-feedback">{errors.mobile.message}</div>}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="altContact">Alternate Contact</label>
                      <input id="altContact" type="tel" className="form-control" placeholder="Optional phone" {...register('alternateContact')} />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="emailAddr">Email Address</label>
                      <input id="emailAddr" type="email" className="form-control" placeholder="orders@supplier.com" {...register('email')} />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="gstNo">GSTIN (Optional)</label>
                      <input id="gstNo" type="text" className="form-control font-monospace" placeholder="e.g. 33AABCA1234F1Z1" {...register('gstNumber')} />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="panNo">PAN (Optional)</label>
                      <input id="panNo" type="text" className="form-control font-monospace" placeholder="e.g. ABCDE1234F" {...register('panNumber')} />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="addr">Address</label>
                      <input id="addr" type="text" className="form-control" placeholder="Shop/Plot #, Industrial area" {...register('address')} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="city">City</label>
                      <input id="city" type="text" className="form-control" placeholder="City" {...register('city')} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="state">State</label>
                      <input id="state" type="text" className="form-control" placeholder="State" {...register('state')} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="pin">PIN Code</label>
                      <input id="pin" type="text" className="form-control" placeholder="e.g. 600001" {...register('pincode')} />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="bank">Bank / Payment Reference Details</label>
                      <textarea id="bank" rows="2" className="form-control" placeholder="Bank Name, A/C #, IFSC Code" {...register('bankDetails')} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="credLim">Credit Limit (₹)</label>
                      <input id="credLim" type="number" step="1000" className="form-control" {...register('creditLimit', { valueAsNumber: true })} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="credDays">Credit Period (Days)</label>
                      <input id="credDays" type="number" className="form-control" {...register('creditPeriodDays', { valueAsNumber: true })} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="payTerms">Payment Terms</label>
                      <select id="payTerms" className="form-select" {...register('paymentTerms')}>
                        <option value="CREDIT">Credit Terms</option>
                        <option value="IMMEDIATE">Immediate / Cash</option>
                        <option value="ADVANCE">Advance Required</option>
                        <option value="PARTIAL_PAYMENT">Partial Payment</option>
                        <option value="CUSTOM_TERMS">Custom Terms</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="openOut">Opening Outstanding Balance (₹)</label>
                      <input id="openOut" type="number" step="0.01" className="form-control" {...register('openingOutstandingBalance', { valueAsNumber: true })} />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="openAdv">Opening Advance Balance (₹)</label>
                      <input id="openAdv" type="number" step="0.01" className="form-control" {...register('openingAdvanceBalance', { valueAsNumber: true })} />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="notes">Notes</label>
                      <textarea id="notes" rows="2" className="form-control" placeholder="Special pricing, authorized contacts, etc." {...register('notes')} />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isSubmitting}>
                    {isSubmitting
                      ? editingSupplierId
                        ? 'Updating...'
                        : 'Registering...'
                      : editingSupplierId
                      ? 'Update Supplier'
                      : 'Register Supplier'}
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

export default SupplierListPage;
