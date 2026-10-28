import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { inventoryService } from '../../services/inventoryService';
import { vehicleService } from '../../services/vehicleService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/date';
import {
  Plus,
  CheckCircle2,
  Trash2,
  Eye,
  FileText,
  DollarSign,
  Truck,
  Car,
  Ban,
  AlertTriangle,
  Receipt,
  CreditCard,
} from 'lucide-react';

export function PurchaseInvoicesPage() {
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('INVENTORY', 'ADD');
  const canEdit = hasPermission('INVENTORY', 'EDIT');

  const {
    page,
    size,
    sortBy,
    sortDirection,
    handlePageChange,
    handleSizeChange,
    handleSort,
  } = usePagination(0, 10);

  const [invoices, setInvoices] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Suppliers, Parts & Vehicles
  const [suppliers, setSuppliers] = useState([]);
  const [parts, setParts] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Create Invoice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [branchWarehouse, setBranchWarehouse] = useState('Main Warehouse');
  const [vehicleId, setVehicleId] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [freightCharge, setFreightCharge] = useState('0');
  const [otherCharges, setOtherCharges] = useState('0');
  const [notes, setNotes] = useState('');

  // Payment Options (Full, Partial, or Credit)
  const [paymentMode, setPaymentMode] = useState('CREDIT'); // 'CREDIT' | 'FULL' | 'PARTIAL'
  const [amountPaidNow, setAmountPaidNow] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');

  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Quick Add Supplier Modal inside Purchase Form
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = useState(false);
  const [quickSupplierName, setQuickSupplierName] = useState('');
  const [quickSupplierContact, setQuickSupplierContact] = useState('');
  const [quickSupplierMobile, setQuickSupplierMobile] = useState('');
  const [quickSupplierTerms, setQuickSupplierTerms] = useState('CREDIT');
  const [quickSupplierSubmitting, setQuickSupplierSubmitting] = useState(false);
  const [quickSupplierError, setQuickSupplierError] = useState(null);

  // View Invoice Detail Drawer
  const [viewInvoice, setViewInvoice] = useState(null);

  // Post / Receive Confirmation Dialog
  const [postingInvoiceId, setPostingInvoiceId] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  // Pay / Settle Invoice Modal
  const [payInvoice, setPayInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getAllPurchaseInvoices({
        page,
        size,
        sortBy,
        sortDirection,
      });
      setInvoices(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load purchase invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, size, sortBy, sortDirection]);

  const handleOpenCreate = async () => {
    try {
      const [suppRes, partsRes, vehRes] = await Promise.allSettled([
        inventoryService.getAllSuppliers({ size: 100, active: true }),
        inventoryService.getAllParts({ size: 100 }),
        vehicleService.getAllVehicles({ size: 100 }),
      ]);

      const suppliersList = suppRes.status === 'fulfilled' ? (suppRes.value?.content || []) : [];
      const partsList = partsRes.status === 'fulfilled' ? (partsRes.value?.content || []) : [];
      const vehiclesList = vehRes.status === 'fulfilled' ? (vehRes.value?.content || []) : [];

      setSuppliers(suppliersList);
      setParts(partsList);
      setVehicles(vehiclesList);

      setSupplierId(suppliersList[0]?.id || '');
      setSupplierInvoiceNumber('');
      setVehicleId('');
      setDiscountAmount('0');
      setFreightCharge('0');
      setOtherCharges('0');
      setPaymentMode('CREDIT');
      setAmountPaidNow('0');
      setNotes('');
      setItems([
        {
          partId: partsList[0]?.id || '',
          quantity: 1,
          unitPrice: partsList[0]?.purchasePrice || 0,
          lineDiscount: 0,
          taxPercentage: 18,
        },
      ]);
      setModalError(null);
      setIsModalOpen(true);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to prepare purchase bill modal: ' + (err.message || 'Error') }));
      setIsModalOpen(true);
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        partId: parts[0]?.id || '',
        quantity: 1,
        unitPrice: parts[0]?.purchasePrice || 0,
        lineDiscount: 0,
        taxPercentage: 18,
      },
    ]);
  };

  const updateItem = (index, field, val) => {
    setItems((prev) => {
      const copy = [...prev];
      if (field === 'partId') {
        const found = parts.find((p) => String(p.id) === String(val));
        copy[index] = {
          ...copy[index],
          partId: Number(val),
          unitPrice: found?.purchasePrice || 0,
        };
      } else {
        copy[index] = { ...copy[index], [field]: Number(val) };
      }
      return copy;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => {
    const gross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
    const disc = Number(it.lineDiscount) || 0;
    return sum + Math.max(0, gross - disc);
  }, 0);

  const totalTax = items.reduce((sum, it) => {
    const gross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
    const disc = Number(it.lineDiscount) || 0;
    const net = Math.max(0, gross - disc);
    const taxRate = Number(it.taxPercentage) || 0;
    return sum + (net * taxRate) / 100;
  }, 0);

  const calculatedTotal =
    subtotal + totalTax + Number(freightCharge || 0) + Number(otherCharges || 0) - Number(discountAmount || 0);

  // Sync paid amount when payment mode changes
  const handlePaymentModeChange = (mode) => {
    setPaymentMode(mode);
    if (mode === 'FULL') {
      setAmountPaidNow(String(Math.max(0, calculatedTotal.toFixed(2))));
    } else if (mode === 'CREDIT') {
      setAmountPaidNow('0');
    }
  };

  const handleCreateQuickSupplier = async (e) => {
    e.preventDefault();
    if (!quickSupplierName.trim()) {
      setQuickSupplierError('Supplier agency name is required');
      return;
    }
    if (!quickSupplierMobile.trim() || quickSupplierMobile.trim().length < 10) {
      setQuickSupplierError('Valid 10-digit mobile number is required');
      return;
    }
    setQuickSupplierSubmitting(true);
    setQuickSupplierError(null);
    try {
      const created = await inventoryService.createSupplier({
        name: quickSupplierName.trim(),
        contactPerson: quickSupplierContact.trim() || null,
        mobile: quickSupplierMobile.trim(),
        paymentTerms: quickSupplierTerms,
        creditLimit: 50000,
        creditPeriodDays: 30,
        creditEnabled: true,
      });

      // Update local supplier list and select the newly created supplier
      setSuppliers((prev) => [created, ...prev]);
      setSupplierId(String(created.id));
      setIsQuickSupplierOpen(false);
      setQuickSupplierName('');
      setQuickSupplierContact('');
      setQuickSupplierMobile('');
      dispatch(
        addToast({
          type: 'success',
          title: 'Supplier Registered',
          message: `${created.name} registered and selected for this purchase.`,
        })
      );
    } catch (err) {
      setQuickSupplierError(err.message || 'Failed to register supplier');
    } finally {
      setQuickSupplierSubmitting(false);
    }
  };

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      setModalError('Please select a registered supplier agency');
      return;
    }
    if (items.length === 0) {
      setModalError('Please add at least one spare part line item');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      const payload = {
        supplierId: Number(supplierId),
        supplierInvoiceNumber: supplierInvoiceNumber.trim() || null,
        invoiceDate,
        expectedDeliveryDate: expectedDate || null,
        branchWarehouse,
        vehicleId: vehicleId ? Number(vehicleId) : null,
        discountAmount: Number(discountAmount || 0),
        freightCharge: Number(freightCharge || 0),
        otherCharges: Number(otherCharges || 0),
        amountPaidNow: Number(amountPaidNow || 0),
        paymentMethod: Number(amountPaidNow || 0) > 0 ? paymentMethod : null,
        paymentReference: paymentRef || null,
        notes: notes || 'Spare parts inward purchase invoice',
        items: items.map((it) => ({
          partId: Number(it.partId),
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
          lineDiscount: Number(it.lineDiscount || 0),
          taxPercentage: Number(it.taxPercentage || 0),
        })),
      };

      const created = await inventoryService.createPurchaseInvoice(payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Purchase Bill Created',
          message: `Bill ${created.invoiceNumber} recorded. Click "Receive Stock" to update physical parts & supplier ledger.`,
        })
      );
      setIsModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setModalError(err.message || 'Failed to save purchase bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPost = async () => {
    if (!postingInvoiceId) return;
    setIsPosting(true);
    try {
      await inventoryService.postPurchaseInvoice(postingInvoiceId);
      dispatch(
        addToast({
          type: 'success',
          title: 'Stock Inward Received',
          message: 'Physical stock updated and supplier account ledger posted.',
        })
      );
      setPostingInvoiceId(null);
      fetchInvoices();
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Stock Receipt Failed', message: err.message }));
    } finally {
      setIsPosting(false);
    }
  };

  const handleOpenPayInvoice = (inv) => {
    setPayInvoice(inv);
    setPayAmount(String(inv.amountOutstanding || inv.totalAmount || ''));
    setPayMethod('BANK_TRANSFER');
    setPayReference('');
    setPayNotes(`Settlement for purchase bill ${inv.invoiceNumber}`);
    setPayError(null);
  };

  const handleRecordBillPayment = async (e) => {
    e.preventDefault();
    if (!payInvoice || !payAmount || Number(payAmount) <= 0) return;
    setIsPaying(true);
    setPayError(null);
    try {
      await inventoryService.recordSupplierPayment({
        supplierId: payInvoice.supplierId,
        invoiceId: payInvoice.id,
        amount: Number(payAmount),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: payMethod,
        transactionReference: payReference || undefined,
        notes: payNotes || `Payment for ${payInvoice.invoiceNumber}`,
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Bill Payment Recorded',
          message: `Recorded payment of ₹${Number(payAmount).toLocaleString('en-IN')} for bill ${payInvoice.invoiceNumber}.`,
        })
      );
      setPayInvoice(null);
      fetchInvoices();
    } catch (err) {
      setPayError(err.message || 'Failed to record bill payment');
    } finally {
      setIsPaying(false);
    }
  };

  const columns = [
    {
      header: 'Purchase # / Date',
      field: 'invoiceNumber',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-bold font-monospace text-dark">{row.invoiceNumber}</div>
          <div className="text-muted small">
            Date: {formatDate(row.invoiceDate)}
            {row.supplierInvoiceNumber && ` • Sup Inv: ${row.supplierInvoiceNumber}`}
          </div>
        </div>
      ),
    },
    {
      header: 'Supplier Agency',
      field: 'supplierName',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.supplierName}</div>
          <div className="text-muted small">{row.supplierCode || 'Registered Supplier'}</div>
        </div>
      ),
    },
    {
      header: 'Bill Amount',
      field: 'totalAmount',
      sortable: true,
      render: (row) => (
        <div className="small">
          <div className="fw-bold font-monospace text-dark fs-6">
            <MoneyDisplay amount={row.totalAmount} />
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            Tax: <MoneyDisplay amount={row.taxAmount || 0} />
            {Number(row.freightCharge || 0) > 0 ? ` + Freight: ₹${row.freightCharge}` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Payment Status',
      field: 'paymentStatus',
      render: (row) => (
        <div className="small">
          <StatusBadge status={row.paymentStatus} />
          {row.paymentStatus !== 'PAID' && (
            <div className="text-danger font-monospace mt-1">
              Due: <MoneyDisplay amount={row.amountOutstanding || row.totalAmount} />
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Bill Status',
      field: 'status',
      sortable: true,
      render: (row) => {
        let badgeClass = 'bg-secondary-subtle text-secondary';
        if (row.status === 'POSTED') badgeClass = 'bg-success-subtle text-success';
        if (row.status === 'CANCELLED') badgeClass = 'bg-danger-subtle text-danger';
        return <span className={`badge ${badgeClass}`}>{row.status}</span>;
      },
    },
    {
      header: 'Attributable Vehicle',
      field: 'vehicleRegistrationNumber',
      render: (row) => (
        row.vehicleRegistrationNumber ? (
          <span className="badge bg-light text-primary border font-monospace">
            {row.vehicleRegistrationNumber}
          </span>
        ) : (
          <span className="text-muted small">Warehouse Stock</span>
        )
      ),
    },
    {
      header: 'Actions',
      field: 'id',
      render: (row) => (
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            onClick={() => setViewInvoice(row)}
            title="View Bill Details"
          >
            <Eye size={13} className="me-1" /> View
          </button>
          {row.paymentStatus !== 'PAID' && row.status !== 'CANCELLED' && canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-success py-0 px-2 d-flex align-items-center gap-1"
              onClick={() => handleOpenPayInvoice(row)}
              title="Record Payment / Settle Balance"
            >
              <DollarSign size={13} /> Settle Bill
            </button>
          )}
          {row.status === 'DRAFT' && canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-primary py-0 px-2 d-flex align-items-center gap-1"
              onClick={() => setPostingInvoiceId(row.id)}
              title="Post stock & update ledger"
            >
              <CheckCircle2 size={13} /> Receive Stock
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Bills & Inward Stock"
        subtitle="Purchase spare parts from registered agencies, allocate freight landed costs, and settle via credit, full or partial payment"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Inventory' }, { label: 'Purchases' }]}
      >
        {canAdd && (
          <button type="button" className="btn btn-primary d-flex align-items-center gap-1" onClick={handleOpenCreate}>
            <Plus size={16} /> New Purchase Bill
          </button>
        )}
      </PageHeader>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={invoices}
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
        emptyMessage="No purchase bills recorded yet."
      />

      {/* Create Purchase Bill Modal */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: '92vh' }}>
            <form onSubmit={handleSubmitInvoice} className="modal-content border-0 shadow rounded-3 d-flex flex-column" style={{ maxHeight: '92vh' }}>
              <div className="modal-header border-bottom py-3 px-4 bg-light flex-shrink-0">
                <div className="d-flex align-items-center gap-2">
                  <Receipt size={22} className="text-primary" />
                  <h5 className="modal-title h6 fw-bold mb-0">Record Supplier Purchase Bill</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
              </div>

              <div className="modal-body p-4 bg-light-subtle overflow-y-auto" style={{ maxHeight: 'calc(92vh - 130px)' }}>
                {modalError && <div className="alert alert-danger small py-2 px-3 mb-3">{modalError}</div>}

                  {/* Top Form Fields */}
                  <div className="app-card p-3 mb-3 bg-white">
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <label className="form-label mb-1" htmlFor="supplierPick">
                            Supplier / Agency*
                          </label>
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-primary small text-decoration-none"
                            onClick={() => {
                              setQuickSupplierError(null);
                              setIsQuickSupplierOpen(true);
                            }}
                          >
                            + Register New
                          </button>
                        </div>
                        <select
                          id="supplierPick"
                          className="form-select"
                          value={supplierId}
                          onChange={(e) => setSupplierId(e.target.value)}
                          required
                        >
                          <option value="">Select Registered Supplier</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.supplierCode || 'SUP'}) • Bal: ₹{s.outstandingAmount || 0}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const selected = suppliers.find((s) => String(s.id) === String(supplierId));
                          if (!selected) return null;
                          return (
                            <div className="mt-1 small text-muted bg-light p-1 px-2 rounded border">
                              <div><strong>Phone:</strong> {selected.mobile || '—'} | <strong>Contact:</strong> {selected.contactPerson || 'Office'}</div>
                              <div><strong>Payment Terms:</strong> {selected.paymentTerms || 'Credit'} | <strong>Credit Limit:</strong> ₹{selected.creditLimit || 0}</div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label" htmlFor="supInvNum">
                          Supplier Invoice #
                        </label>
                        <input
                          id="supInvNum"
                          type="text"
                          className="form-control font-monospace"
                          placeholder="Vendor's Bill #"
                          value={supplierInvoiceNumber}
                          onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-md-2">
                        <label className="form-label" htmlFor="invDate">
                          Invoice Date*
                        </label>
                        <input
                          id="invDate"
                          type="date"
                          className="form-control"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label" htmlFor="vehLink">
                          Direct Vehicle Repair Job (Optional)
                        </label>
                        <select
                          id="vehLink"
                          className="form-select"
                          value={vehicleId}
                          onChange={(e) => setVehicleId(e.target.value)}
                        >
                          <option value="">Warehouse Stock (No Vehicle)</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.registrationNumber} ({v.brand} {v.model})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Multi-item Parts Table */}
                  <div className="app-card p-3 mb-3 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Purchased Parts & Line Items</h6>
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={addItem}>
                        <Plus size={14} className="me-1" /> Add Line Item
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-bordered table-sm align-middle mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '35%' }}>Part / SKU*</th>
                            <th style={{ width: '12%' }}>Qty*</th>
                            <th style={{ width: '15%' }}>Unit Price (₹)*</th>
                            <th style={{ width: '12%' }}>Disc (₹)</th>
                            <th style={{ width: '12%' }}>GST %</th>
                            <th style={{ width: '14%' }} className="text-end">Line Total (₹)</th>
                            <th style={{ width: '4%' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, idx) => {
                            const lineSub = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.lineDiscount) || 0);
                            const lineTax = (Math.max(0, lineSub) * (Number(it.taxPercentage) || 0)) / 100;
                            const lineTot = Math.max(0, lineSub) + lineTax;

                            return (
                              <tr key={idx}>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={it.partId}
                                    onChange={(e) => updateItem(idx, 'partId', e.target.value)}
                                  >
                                    {parts.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.sku})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-control form-control-sm font-monospace"
                                    value={it.quantity}
                                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control form-control-sm font-monospace"
                                    value={it.unitPrice}
                                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control form-control-sm font-monospace"
                                    value={it.lineDiscount}
                                    onChange={(e) => updateItem(idx, 'lineDiscount', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={it.taxPercentage}
                                    onChange={(e) => updateItem(idx, 'taxPercentage', e.target.value)}
                                  >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                    <option value="28">28%</option>
                                  </select>
                                </td>
                                <td className="text-end font-monospace fw-bold">
                                  ₹{lineTot.toFixed(2)}
                                </td>
                                <td className="text-center">
                                  {items.length > 1 && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link text-danger p-0"
                                      onClick={() => removeItem(idx)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Freight, Discounts & Settlement Handling */}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="app-card p-3 bg-white h-100">
                        <h6 className="fw-bold mb-3">Freight & Allocated Landed Costs</h6>
                        <div className="row g-2 small">
                          <div className="col-6">
                            <label className="form-label" htmlFor="freight">Freight / Courier (₹)</label>
                            <input
                              id="freight"
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={freightCharge}
                              onChange={(e) => setFreightCharge(e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label" htmlFor="otherChg">Other Handling (₹)</label>
                            <input
                              id="otherChg"
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={otherCharges}
                              onChange={(e) => setOtherCharges(e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label" htmlFor="billDisc">Bill-Level Discount (₹)</label>
                            <input
                              id="billDisc"
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={discountAmount}
                              onChange={(e) => setDiscountAmount(e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label" htmlFor="bWh">Warehouse / Branch</label>
                            <input
                              id="bWh"
                              type="text"
                              className="form-control form-control-sm"
                              value={branchWarehouse}
                              onChange={(e) => setBranchWarehouse(e.target.value)}
                            />
                          </div>
                          <div className="col-12 mt-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Purchase notes or memo"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="app-card p-3 bg-white h-100 border-start border-4 border-primary">
                        <h6 className="fw-bold mb-3">Payment & Credit Settlement</h6>

                        {/* Bill Totals Summary */}
                        <div className="p-2 bg-light rounded mb-3 small">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Subtotal (Excl. Tax):</span>
                            <span className="font-monospace">₹{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">GST Taxes:</span>
                            <span className="font-monospace">₹{totalTax.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between border-top pt-1 fw-bold fs-6">
                            <span>Final Invoice Total:</span>
                            <span className="font-monospace text-primary">₹{Math.max(0, calculatedTotal).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Payment Scenario Selection */}
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Payment Settlement Scenario*</label>
                          <div className="btn-group w-100" role="group">
                            <button
                              type="button"
                              className={`btn btn-sm ${paymentMode === 'CREDIT' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handlePaymentModeChange('CREDIT')}
                            >
                              Credit (Unpaid)
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${paymentMode === 'PARTIAL' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handlePaymentModeChange('PARTIAL')}
                            >
                              Partial Payment
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${paymentMode === 'FULL' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handlePaymentModeChange('FULL')}
                            >
                              Full Payment
                            </button>
                          </div>
                        </div>

                        {paymentMode !== 'CREDIT' && (
                          <div className="row g-2 mt-2 small">
                            <div className="col-6">
                              <label className="form-label" htmlFor="payNow">Amount Paid Now (₹)*</label>
                              <input
                                id="payNow"
                                type="number"
                                step="0.01"
                                className="form-control form-control-sm font-monospace"
                                value={amountPaidNow}
                                onChange={(e) => setAmountPaidNow(e.target.value)}
                                required
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label" htmlFor="payMeth">Payment Method*</label>
                              <select
                                id="payMeth"
                                className="form-select form-select-sm"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                              >
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="UPI">UPI</option>
                                <option value="CHEQUE">Cheque</option>
                                <option value="CARD">Card</option>
                                <option value="CASH">Cash</option>
                              </select>
                            </div>
                            <div className="col-12">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Payment reference / UTR #"
                                value={paymentRef}
                                onChange={(e) => setPaymentRef(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-2 text-muted small">
                          Outstanding on Bill: <strong className="font-monospace text-danger">
                            ₹{Math.max(0, calculatedTotal - Number(amountPaidNow || 0)).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4 bg-white flex-shrink-0">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Recording...' : 'Create Purchase Bill'}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bill Detail Drawer */}
      {viewInvoice && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title h6 fw-bold mb-0">
                    Purchase Bill: {viewInvoice.invoiceNumber}
                  </h5>
                  <div className="text-muted small">
                    Supplier: {viewInvoice.supplierName} • Date: {formatDate(viewInvoice.invoiceDate)}
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setViewInvoice(null)} />
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <span className="text-muted small d-block">Total Bill Amount</span>
                    <span className="h5 fw-bold font-monospace text-dark"><MoneyDisplay amount={viewInvoice.totalAmount} /></span>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted small d-block">Amount Paid</span>
                    <span className="h5 fw-bold font-monospace text-success"><MoneyDisplay amount={viewInvoice.amountPaid || 0} /></span>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted small d-block">Outstanding Balance</span>
                    <span className="h5 fw-bold font-monospace text-danger"><MoneyDisplay amount={viewInvoice.amountOutstanding || 0} /></span>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted small d-block">Status</span>
                    <span className={`badge ${viewInvoice.status === 'POSTED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {viewInvoice.status}
                    </span>
                  </div>
                </div>

                <h6 className="fw-bold mb-2 small text-uppercase text-muted">Purchased Line Items</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm small align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Part / SKU</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Discount</th>
                        <th>GST Tax</th>
                        <th>Landed Allocation</th>
                        <th className="text-end">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewInvoice.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="fw-bold text-dark">{item.partName}</div>
                            <div className="font-monospace text-muted small">{item.partSku}</div>
                          </td>
                          <td>{item.quantity}</td>
                          <td className="font-monospace"><MoneyDisplay amount={item.unitPrice} /></td>
                          <td className="font-monospace"><MoneyDisplay amount={item.lineDiscount || 0} /></td>
                          <td className="font-monospace"><MoneyDisplay amount={item.taxAmount || 0} /></td>
                          <td className="font-monospace"><MoneyDisplay amount={item.landedCostAllocation || 0} /></td>
                          <td className="font-monospace text-end fw-bold"><MoneyDisplay amount={item.totalAmount} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-top d-flex justify-content-between align-items-center">
                <div>
                  {viewInvoice.paymentStatus !== 'PAID' && viewInvoice.status !== 'CANCELLED' && canEdit && (
                    <button
                      type="button"
                      className="btn btn-sm btn-success d-flex align-items-center gap-1"
                      onClick={() => {
                        const inv = viewInvoice;
                        setViewInvoice(null);
                        handleOpenPayInvoice(inv);
                      }}
                    >
                      <DollarSign size={14} /> Pay / Settle Bill Now
                    </button>
                  )}
                </div>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setViewInvoice(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay / Settle Bill Modal Dialog */}
      {payInvoice && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title h6 fw-bold mb-0">Record Payment for Bill</h5>
                  <div className="text-muted small">
                    Invoice: <span className="font-monospace text-primary fw-semibold">{payInvoice.invoiceNumber}</span> • {payInvoice.supplierName}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setPayInvoice(null)}
                  disabled={isPaying}
                />
              </div>

              <form onSubmit={handleRecordBillPayment}>
                <div className="modal-body p-4">
                  {payError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">{payError}</div>
                  )}

                  {/* Summary Card */}
                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Total Invoice Amount:</span>
                      <span className="fw-semibold font-monospace"><MoneyDisplay amount={payInvoice.totalAmount} /></span>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Already Paid:</span>
                      <span className="text-success fw-semibold font-monospace"><MoneyDisplay amount={payInvoice.amountPaid || 0} /></span>
                    </div>
                    <div className="d-flex justify-content-between small border-top pt-1 mt-1">
                      <span className="fw-bold text-dark">Current Outstanding Due:</span>
                      <span className="fw-bold font-monospace text-danger fs-6">
                        <MoneyDisplay amount={payInvoice.amountOutstanding ?? payInvoice.totalAmount} />
                      </span>
                    </div>
                  </div>

                  {/* Payment Amount Input */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold mb-0" htmlFor="pAmount">
                        Payment Amount (₹)*
                      </label>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none small"
                        onClick={() => setPayAmount(String(payInvoice.amountOutstanding ?? payInvoice.totalAmount ?? 0))}
                      >
                        Pay Full Balance
                      </button>
                    </div>
                    <input
                      id="pAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control font-monospace"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                      disabled={isPaying}
                      placeholder="Enter payment amount"
                    />
                  </div>

                  {/* Remaining Balance Calculator Preview */}
                  <div className="p-2 px-3 rounded-2 mb-3 bg-white border d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Remaining Balance After Payment:</span>
                    <span className="font-monospace fw-bold small">
                      {(() => {
                        const outstanding = Number(payInvoice.amountOutstanding ?? payInvoice.totalAmount ?? 0);
                        const paying = Number(payAmount || 0);
                        const rem = outstanding - paying;
                        if (rem <= 0) {
                          return <span className="text-success">₹0.00 (Fully Settled / No Due)</span>;
                        }
                        return <span className="text-danger">₹{rem.toFixed(2)} (Partially Paid)</span>;
                      })()}
                    </span>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold" htmlFor="pMeth">Payment Method*</label>
                      <select
                        id="pMeth"
                        className="form-select form-select-sm"
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        disabled={isPaying}
                      >
                        <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                        <option value="UPI">UPI / QR</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="CARD">Card</option>
                        <option value="CASH">Cash</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold" htmlFor="pRef">UTR / Reference No.</label>
                      <input
                        id="pRef"
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. UTR12345678"
                        value={payReference}
                        onChange={(e) => setPayReference(e.target.value)}
                        disabled={isPaying}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold" htmlFor="pNotes">Payment Memo / Notes</label>
                    <input
                      id="pNotes"
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Settle bill balance"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      disabled={isPaying}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-4 bg-light-subtle">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setPayInvoice(null)}
                    disabled={isPaying}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                    disabled={isPaying || !payAmount || Number(payAmount) <= 0}
                  >
                    <DollarSign size={14} />
                    {isPaying ? 'Recording...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(postingInvoiceId)}
        title="Receive Physical Stock & Post Ledger"
        message="Are you sure you want to receive stock for this purchase bill? This will increase inventory stock counts, update landed costs, and post the purchase amount to the supplier accounts payable ledger."
        confirmText="Confirm Stock Receipt"
        confirmVariant="success"
        isLoading={isPosting}
        onConfirm={handleConfirmPost}
        onCancel={() => setPostingInvoiceId(null)}
      />

      {/* Quick Add Supplier Modal */}
      {isQuickSupplierOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Quick Register Supplier Agency</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsQuickSupplierOpen(false)}
                />
              </div>
              <form onSubmit={handleCreateQuickSupplier}>
                <div className="modal-body p-4">
                  {quickSupplierError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">{quickSupplierError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label" htmlFor="qsName">Agency / Business Name*</label>
                    <input
                      id="qsName"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Metro Spares Hub"
                      value={quickSupplierName}
                      onChange={(e) => setQuickSupplierName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="qsContact">Contact Person</label>
                    <input
                      id="qsContact"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rajesh Kumar"
                      value={quickSupplierContact}
                      onChange={(e) => setQuickSupplierContact(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="qsMobile">Mobile Number*</label>
                    <input
                      id="qsMobile"
                      type="tel"
                      className="form-control"
                      placeholder="10-digit mobile"
                      value={quickSupplierMobile}
                      onChange={(e) => setQuickSupplierMobile(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="qsTerms">Payment Terms</label>
                    <select
                      id="qsTerms"
                      className="form-select"
                      value={quickSupplierTerms}
                      onChange={(e) => setQuickSupplierTerms(e.target.value)}
                    >
                      <option value="CREDIT">Credit Terms</option>
                      <option value="IMMEDIATE">Immediate / Cash</option>
                      <option value="PARTIAL_PAYMENT">Partial Payment</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setIsQuickSupplierOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={quickSupplierSubmitting}
                  >
                    {quickSupplierSubmitting ? 'Registering...' : 'Save & Select Supplier'}
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

export default PurchaseInvoicesPage;
