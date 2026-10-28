import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { salesService } from '../../services/salesService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatRegNumber, formatPhone } from '../../utils/formatters';
import { formatDate, formatDateTime } from '../../utils/date';
import {
  ShoppingCart,
  DollarSign,
  CreditCard,
  Truck,
  CheckCircle2,
  Printer,
  ArrowLeft,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CARD']),
  paymentReference: z.string().optional(),
  paymentDate: z.string().optional(),
  remarks: z.string().optional(),
});

const deliverySchema = z.object({
  recipientName: z.string().min(2, 'Recipient name is required'),
  recipientPhone: z.string().min(10, 'Recipient mobile number is required'),
  deliveryOdometerKm: z.number().min(0, 'Odometer reading cannot be negative'),
  deliveryDate: z.string().optional(),
  checklistVerified: z.boolean().refine((val) => val === true, 'All documents must be verified'),
  remarks: z.string().optional(),
});

export function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasPermission, isAdmin } = usePermission();
  const canAddPayment = isAdmin || hasPermission('SALES', 'ADD');
  const canDeliver = isAdmin || hasPermission('SALES', 'EDIT');

  const [sale, setSale] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Delivery Modal
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);

  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
    formState: { errors: paymentErrors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMode: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const {
    register: registerDelivery,
    handleSubmit: handleDeliverySubmit,
    reset: resetDelivery,
    formState: { errors: deliveryErrors },
  } = useForm({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      deliveryDate: new Date().toISOString().split('T')[0],
      checklistVerified: false,
    },
  });

  const fetchSaleData = async () => {
    if (!id || id === 'undefined' || isNaN(Number(id))) {
      setIsLoading(false);
      setError('Invalid sales order ID. Please select a valid sale.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [saleData, deliveryData] = await Promise.all([
        salesService.getSaleById(id),
        salesService.getSaleDelivery(id).catch(() => null),
      ]);
      setSale(saleData);
      setDelivery(deliveryData);
    } catch (err) {
      setError(err.message || 'Failed to load sale order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleData();
  }, [id]);

  const onRecordPayment = async (data) => {
    setIsSubmittingPayment(true);
    setPaymentError(null);
    try {
      const idempotencyKey = `PAY-${id}-${Date.now()}`;
      const payload = {
        amount: Number(data.amount),
        paymentMethod: data.paymentMode,
        transactionReference: data.paymentReference || null,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        notes: data.remarks || '',
        idempotencyKey,
      };
      await salesService.recordPayment(id, payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Payment Recorded',
          message: `Payment receipt of ₹${data.amount} recorded successfully.`,
        })
      );
      setPaymentModalOpen(false);
      resetPayment();
      fetchSaleData();
    } catch (err) {
      setPaymentError(err.message || 'Failed to record customer payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const onConfirmDelivery = async (data) => {
    setIsSubmittingDelivery(true);
    setDeliveryError(null);
    try {
      const payload = {
        deliveryDate: data.deliveryDate || new Date().toISOString().split('T')[0],
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        odometerAtDelivery: Number(data.deliveryOdometerKm || 0),
        notes: data.remarks || '',
      };
      await salesService.deliverVehicle(id, payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Vehicle Delivered',
          message: 'Vehicle delivery recorded and vehicle status updated to DELIVERED.',
        })
      );
      setDeliveryModalOpen(false);
      resetDelivery();
      fetchSaleData();
    } catch (err) {
      setDeliveryError(err.message || 'Failed to deliver vehicle');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Sale Order Details" subtitle="Loading sale record..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div>
        <PageHeader
          title="Sale Order Details"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Sales', href: '/sales' },
            { label: 'Order Details' },
          ]}
        >
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => navigate('/sales')}
          >
            <ArrowLeft size={14} /> Back to Sales
          </button>
        </PageHeader>
        <div className="card border p-4 text-center my-4 bg-white shadow-xs rounded-3">
          <div className="py-3">
            <h5 className="text-dark fw-bold mb-2">Sale Order Not Found</h5>
            <p className="text-muted small mb-4">
              {error || 'The requested sales order could not be located or has an invalid reference.'}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm px-3"
              onClick={() => navigate('/sales')}
            >
              Go to Sales List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const effectiveSalePrice = sale.finalSalePrice ?? sale.agreedPrice ?? sale.salePrice ?? 0;
  const effectivePaidAmount = sale.totalPaid ?? sale.paidAmount ?? 0;
  const effectiveBalance = sale.balanceDue ?? sale.balanceAmount ?? (Number(effectiveSalePrice) - Number(effectivePaidAmount));
  const effectiveVehicleName = sale.vehicleName || (sale.vehicleBrand && sale.vehicleModel ? `${sale.vehicleBrand} ${sale.vehicleModel}` : (sale.vehicleBrand || 'Vehicle'));
  const effectiveRegNumber = sale.vehicleRegistrationNumber || sale.registrationNumber;

  const isBalanceRemaining = Number(effectiveBalance) > 0;
  const isDirectSale = sale.saleType === 'DIRECT';
  const isEligibleForDelivery = !isDirectSale || Number(effectiveBalance) <= 0;

  return (
    <div>
      <PageHeader
        title={`Sales Order #${sale.id}`}
        subtitle={`Vehicle: ${effectiveVehicleName} (${formatRegNumber(effectiveRegNumber)}) • Customer: ${sale.customerName}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/sales' },
          { label: `#${sale.id}` },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate('/sales')}
        >
          <ArrowLeft size={14} /> Back to Sales
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => window.print()}
        >
          <Printer size={14} /> Print Receipt
        </button>

        {canAddPayment && isBalanceRemaining && (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            onClick={() => {
              resetPayment({
                amount: Number(effectiveBalance),
                paymentMode: 'BANK_TRANSFER',
                paymentDate: new Date().toISOString().split('T')[0],
              });
              setPaymentError(null);
              setPaymentModalOpen(true);
            }}
          >
            <DollarSign size={14} /> Record Payment
          </button>
        )}

        {canDeliver && !delivery && (
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
            onClick={() => {
              resetDelivery({
                recipientName: sale.customerName,
                recipientPhone: sale.customerMobile || '',
                deliveryOdometerKm: 0,
                deliveryDate: new Date().toISOString().split('T')[0],
                checklistVerified: false,
              });
              setDeliveryError(null);
              setDeliveryModalOpen(true);
            }}
          >
            <Truck size={14} /> Deliver Vehicle
          </button>
        )}
      </PageHeader>

      {/* KPI Cards — Taste-Skill Uniform Alignment & Rhythm */}
      <div className="row g-3 mb-4 align-items-stretch">
        {/* 1. Agreed Sale Price */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div className="kpi-card-content">
              <span className="kpi-label">Agreed Sale Price</span>
              <div className="kpi-value text-dark">
                <MoneyDisplay amount={effectiveSalePrice} />
              </div>
            </div>
            <div className="kpi-card-footer">
              <span className="text-secondary small">Channel</span>
              <span className="badge bg-light text-dark border px-2 py-0.5 fw-medium" style={{ fontSize: '0.72rem' }}>
                {sale.saleType || 'DIRECT'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Paid to Date */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div className="kpi-card-content">
              <span className="kpi-label">Paid to Date</span>
              <div className="kpi-value text-success">
                <MoneyDisplay amount={effectivePaidAmount} />
              </div>
            </div>
            <div className="kpi-card-footer">
              <span className="text-secondary small">Realization</span>
              <span className="text-dark fw-medium small">
                {effectiveSalePrice > 0
                  ? `${Math.min(100, Math.round((effectivePaidAmount / effectiveSalePrice) * 100))}% collected`
                  : '100%'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Remaining Balance */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div className="kpi-card-content">
              <span className="kpi-label">Remaining Balance</span>
              <div className={`kpi-value ${isBalanceRemaining ? 'text-danger' : 'text-success'}`}>
                <MoneyDisplay amount={effectiveBalance} />
              </div>
            </div>
            <div className="kpi-card-footer">
              <span className="text-secondary small">Settlement</span>
              <StatusBadge status={sale.status} />
            </div>
          </div>
        </div>

        {/* 4. Delivery Dispatch */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div className="kpi-card-content">
              <span className="kpi-label">Delivery Dispatch</span>
              <div className="kpi-value text-dark d-flex align-items-center" style={{ minHeight: '1.75rem' }}>
                {delivery ? (
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fw-medium" style={{ fontSize: '0.78rem' }}>
                    DELIVERED
                  </span>
                ) : (
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 fw-medium" style={{ fontSize: '0.78rem' }}>
                    PENDING DELIVERY
                  </span>
                )}
              </div>
            </div>
            <div className="kpi-card-footer">
              <span className="text-secondary small">Handover Date</span>
              <span className="text-dark fw-medium small">
                {delivery?.deliveryDate ? formatDate(delivery.deliveryDate) : 'Awaiting dispatch'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Customer & Vehicle Metadata */}
        <div className="col-12 col-lg-5">
          <div className="app-card h-100">
            <div className="app-card-header">
              <h3 className="app-card-title">Commercial Contract Parties</h3>
            </div>
            <div className="app-card-body small">
              <h4 className="fw-bold text-dark mb-2">Customer Details</h4>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                <span className="text-muted">Name</span>
                <span className="fw-bold text-dark">{sale.customerName}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-3">
                <span className="text-muted">Mobile</span>
                <span className="font-monospace text-dark">{formatPhone(sale.customerMobile)}</span>
              </div>

              <h4 className="fw-bold text-dark mb-2">Vehicle Specification</h4>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                <span className="text-muted">Model</span>
                <span className="fw-semibold text-dark">{effectiveVehicleName}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                <span className="text-muted">Registration</span>
                <span className="font-monospace text-dark">{formatRegNumber(effectiveRegNumber)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-3">
                <span className="text-muted">Ownership Channel</span>
                <StatusBadge status={sale.ownershipType} type="ownership" />
              </div>

              {(sale.finance || sale.financeDetails) && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h4 className="fw-bold text-dark mb-0">Automotive Financing</h4>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-decoration-none small fw-semibold"
                      onClick={() => navigate('/finance')}
                    >
                      View in Finance Hub →
                    </button>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <span className="text-muted">Financier</span>
                    <span className="fw-semibold text-dark">
                      {(sale.finance || sale.financeDetails).financeCompany || (sale.finance || sale.financeDetails).bankName}
                    </span>
                  </div>
                  {(sale.finance || sale.financeDetails).loanAccountNumber && (
                    <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                      <span className="text-muted">Loan Account #</span>
                      <span className="font-monospace text-dark">
                        {(sale.finance || sale.financeDetails).loanAccountNumber}
                      </span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <span className="text-muted">Loan Amount</span>
                    <span className="fw-bold"><MoneyDisplay amount={(sale.finance || sale.financeDetails).loanAmount} /></span>
                  </div>
                  {(sale.finance || sale.financeDetails).downPayment !== undefined && (
                    <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                      <span className="text-muted">Down Payment</span>
                      <span className="fw-bold text-success"><MoneyDisplay amount={(sale.finance || sale.financeDetails).downPayment} /></span>
                    </div>
                  )}
                  {(sale.finance || sale.financeDetails).tenureMonths && (
                    <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                      <span className="text-muted">Tenure</span>
                      <span className="text-dark">{(sale.finance || sale.financeDetails).tenureMonths} Months</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <span className="text-muted">Loan Status</span>
                    <span className={`badge ${(sale.finance || sale.financeDetails).status === 'CLOSED' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'}`}>
                      {(sale.finance || sale.financeDetails).status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between pb-1">
                    <span className="text-muted">Monthly EMI</span>
                    <span className="fw-bold text-primary"><MoneyDisplay amount={(sale.finance || sale.financeDetails).emiAmount || (sale.finance || sale.financeDetails).monthlyEmi} /></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payments Ledger */}
        <div className="col-12 col-lg-7">
          <div className="app-card h-100">
            <div className="app-card-header">
              <h3 className="app-card-title">Customer Receipts Ledger</h3>
              <span className="badge bg-light text-muted border">
                {sale.payments?.length || 0} Receipts
              </span>
            </div>
            <div className="table-responsive">
              <table className="app-table table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Reference</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.payments && sale.payments.length > 0 ? (
                    sale.payments.map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td>{formatDate(p.paymentDate)}</td>
                        <td><span className="badge bg-light text-dark border">{p.paymentMode}</span></td>
                        <td className="font-monospace text-muted small">{p.paymentReference || '—'}</td>
                        <td className="text-end fw-bold text-success">
                          <MoneyDisplay amount={p.amount} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4 small">
                        No customer payment receipts recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Record Customer Payment Receipt</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setPaymentModalOpen(false)}
                />
              </div>

              <form onSubmit={handlePaymentSubmit(onRecordPayment)}>
                <div className="modal-body p-4">
                  {paymentError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {paymentError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="payReceiptAmtInput">
                      Payment Amount (₹) *
                    </label>
                    <input
                      id="payReceiptAmtInput"
                      type="number"
                      className={`form-control fw-bold ${paymentErrors.amount ? 'is-invalid' : ''}`}
                      {...registerPayment('amount', { valueAsNumber: true })}
                    />
                    {paymentErrors.amount && (
                      <div className="invalid-feedback">{paymentErrors.amount.message}</div>
                    )}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="payReceiptModeSelect">
                        Payment Mode *
                      </label>
                      <select id="payReceiptModeSelect" className="form-select" {...registerPayment('paymentMode')}>
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                        <option value="UPI">UPI</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="CASH">Cash</option>
                        <option value="POS_CARD">Debit / Credit Card</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label" htmlFor="payReceiptDateInput">
                        Payment Date *
                      </label>
                      <input
                        id="payReceiptDateInput"
                        type="date"
                        className="form-control"
                        {...registerPayment('paymentDate')}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="payReceiptRefInput">
                      UTR / Cheque / Transaction Reference
                    </label>
                    <input
                      id="payReceiptRefInput"
                      type="text"
                      className="form-control font-monospace"
                      placeholder="e.g. UTR12345678"
                      {...registerPayment('paymentReference')}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="payReceiptRemarksInput">
                      Notes
                    </label>
                    <input
                      id="payReceiptRemarksInput"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Full settlement payment"
                      {...registerPayment('remarks')}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setPaymentModalOpen(false)}
                    disabled={isSubmittingPayment}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isSubmittingPayment}
                  >
                    {isSubmittingPayment ? 'Saving Receipt...' : 'Record Payment Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Vehicle Modal */}
      {deliveryModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Execute Vehicle Delivery Handover</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeliveryModalOpen(false)}
                />
              </div>

              <form onSubmit={handleDeliverySubmit(onConfirmDelivery)}>
                <div className="modal-body p-4">
                  {deliveryError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {deliveryError}
                    </div>
                  )}

                  {!isEligibleForDelivery && (
                    <div className="alert alert-warning small py-2 px-3 mb-3">
                      <strong>Payment Warning:</strong> For direct sales, the backend requires full payment before delivery dispatch. Outstanding balance: ₹{sale.balanceAmount}.
                    </div>
                  )}

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="recipientNameInput">
                        Recipient Name *
                      </label>
                      <input
                        id="recipientNameInput"
                        type="text"
                        className={`form-control ${deliveryErrors.recipientName ? 'is-invalid' : ''}`}
                        {...registerDelivery('recipientName')}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="recipientPhoneInput">
                        Recipient Mobile *
                      </label>
                      <input
                        id="recipientPhoneInput"
                        type="text"
                        className={`form-control ${deliveryErrors.recipientPhone ? 'is-invalid' : ''}`}
                        {...registerDelivery('recipientPhone')}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="deliveryOdometerInput">
                        Delivery Odometer (KM) *
                      </label>
                      <input
                        id="deliveryOdometerInput"
                        type="number"
                        className={`form-control ${deliveryErrors.deliveryOdometerKm ? 'is-invalid' : ''}`}
                        placeholder="Odometer at handover"
                        {...registerDelivery('deliveryOdometerKm', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="deliveryDateInput">
                        Handover Date *
                      </label>
                      <input
                        id="deliveryDateInput"
                        type="date"
                        className="form-control"
                        {...registerDelivery('deliveryDate')}
                      />
                    </div>
                  </div>

                  <div className="form-check p-3 bg-light rounded-3 mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="checklistCheck"
                      {...registerDelivery('checklistVerified')}
                    />
                    <label className="form-check-label small fw-semibold text-dark" htmlFor="checklistCheck">
                      I verify that original keys (2 sets), RC handover slip, insurance certificate, and tool kit have been physically delivered to the recipient.
                    </label>
                    {deliveryErrors.checklistVerified && (
                      <div className="text-danger small mt-1">{deliveryErrors.checklistVerified.message}</div>
                    )}
                  </div>
                </div>

                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setDeliveryModalOpen(false)}
                    disabled={isSubmittingDelivery}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isSubmittingDelivery}
                  >
                    {isSubmittingDelivery ? 'Delivering...' : 'Confirm Delivery'}
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

export default SaleDetailPage;
