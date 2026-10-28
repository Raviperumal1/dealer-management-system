import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { brokerService } from '../../services/brokerService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate, formatDateTime } from '../../utils/date';
import { HandCoins, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const paymentSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .min(1, 'Amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI']),
  paymentReference: z.string().optional(),
  paymentDate: z.string().optional(),
  remarks: z.string().optional(),
});

export function SettlementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasPermission, isAdmin } = usePermission();
  const canPay = isAdmin || hasPermission('BROKERS', 'PAY');

  const [settlement, setSettlement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMode: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const fetchSettlement = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await brokerService.getSettlementById(id);
      setSettlement(data);
    } catch (err) {
      setError(err.message || 'Failed to load settlement details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
  }, [id]);

  const onSubmitPayment = async (formData) => {
    const currentBalance = Number(settlement.balanceAmount ?? settlement.remainingBalance ?? 0);
    if (Number(formData.amount) > currentBalance) {
      setModalError(`Payment cannot exceed remaining balance of ₹${currentBalance}`);
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      const payload = {
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMode,
        paymentReference: formData.paymentReference || null,
        paymentDate: formData.paymentDate || new Date().toISOString().split('T')[0],
        notes: formData.remarks || '',
      };
      await brokerService.recordSettlementPayment(id, payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Payout Recorded',
          message: `Payout of ₹${formData.amount} recorded towards broker settlement #${id}.`,
        })
      );
      setIsModalOpen(false);
      reset();
      fetchSettlement();
    } catch (err) {
      setModalError(err.message || 'Failed to record settlement payout');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Settlement Details" subtitle="Loading settlement..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div>
        <PageHeader title="Settlement Details" />
        <ErrorState message={error || 'Settlement record not found'} onRetry={fetchSettlement} />
      </div>
    );
  }

  const effectiveBalance = Number(settlement.balanceAmount ?? settlement.remainingBalance ?? 0);
  const isPending = effectiveBalance > 0;
  const effectiveBrokerPayable = settlement.netPayable ?? settlement.brokerPayableAmount ?? settlement.brokerAmount;
  const effectiveSalePrice = settlement.saleAmount ?? settlement.customerSalePrice;
  const effectiveCommission = settlement.grossCommission ?? settlement.commissionAmount;
  const effectiveStatus = settlement.settlementStatus || settlement.status;
  const effectiveRegNumber = settlement.vehicleRegistrationNumber || settlement.registrationNumber;
  const effectiveBrokerName = settlement.brokerName || (settlement.brokerId ? `Broker #${settlement.brokerId}` : 'Consignment Broker');

  return (
    <div>
      <PageHeader
        title={`Broker Settlement #${settlement.id}`}
        subtitle={`Consigned Vehicle: ${settlement.vehicleName || ''} (${formatRegNumber(effectiveRegNumber)})`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Brokers', href: '/brokers' },
          { label: 'Settlements', href: '/settlements' },
          { label: `#${settlement.id}` },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate('/settlements')}
        >
          <ArrowLeft size={14} /> Back to Settlements
        </button>

        {canPay && isPending && (
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
            onClick={() => {
              reset({
                amount: effectiveBalance,
                paymentMode: 'BANK_TRANSFER',
                paymentDate: new Date().toISOString().split('T')[0],
              });
              setModalError(null);
              setIsModalOpen(true);
            }}
          >
            <HandCoins size={14} /> Record Payout
          </button>
        )}
      </PageHeader>

      {/* Financial Summary — Uniform KPI Structure */}
      <div className="row g-3 mb-4 align-items-stretch">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div className="kpi-card-content">
              <span className="kpi-label">Sale Price</span>
              <div className="kpi-value text-dark">
                <MoneyDisplay amount={effectiveSalePrice} />
              </div>
            </div>
            <div className="kpi-card-footer">
              <span className="text-secondary small">Basis</span>
              <span className="text-dark fw-medium small">Customer realization</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div className="kpi-card-content">
              <span className="kpi-label">Broker Payable</span>
              <div className="kpi-value text-primary">
                <MoneyDisplay amount={effectiveBrokerPayable} />
              </div>
            </div>
            <div className="kpi-card-footer">
              <span className="text-secondary small">Terms</span>
              <span className="text-dark fw-medium small">Consignment basis</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div className="kpi-card-content">
              <span className="kpi-label">Commission Earned</span>
              <div className="kpi-value text-warning">
                <MoneyDisplay amount={effectiveCommission} />
              </div>
            </div>
            <div className="kpi-card-footer">
              <span className="text-secondary small">Retention</span>
              <span className="text-dark fw-medium small">Dealership revenue</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div className="kpi-card-content">
              <span className="kpi-label">Remaining Balance</span>
              <div className={`kpi-value ${isPending ? 'text-danger' : 'text-success'}`}>
                <MoneyDisplay amount={effectiveBalance} />
              </div>
            </div>
            <div className="kpi-card-footer">
              <span className="text-secondary small">Status</span>
              <StatusBadge status={effectiveStatus} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Settlement Breakdown Details */}
        <div className="col-12 col-lg-5">
          <div className="app-card h-100">
            <div className="app-card-header">
              <h3 className="app-card-title">Settlement Breakdown</h3>
            </div>
            <div className="app-card-body">
              <div className="d-flex flex-column gap-3 small">
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Broker Name</span>
                  <span className="fw-bold text-dark">{effectiveBrokerName}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Sale Reference</span>
                  <span className="font-monospace fw-semibold text-dark">#{settlement.saleId || '—'}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Vehicle</span>
                  <span className="fw-semibold text-dark">{settlement.vehicleName || (settlement.vehicleId ? `Vehicle #${settlement.vehicleId}` : '—')}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Registration Number</span>
                  <span className="font-monospace text-dark">{formatRegNumber(effectiveRegNumber)}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Total Paid to Date</span>
                  <span className="fw-bold text-success"><MoneyDisplay amount={settlement.paidAmount} /></span>
                </div>
                <div className="d-flex justify-content-between pb-1">
                  <span className="text-muted">Outstanding Payable</span>
                  <span className="fw-bold text-danger fs-6"><MoneyDisplay amount={effectiveBalance} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout History */}
        <div className="col-12 col-lg-7">
          <div className="app-card h-100">
            <div className="app-card-header">
              <h3 className="app-card-title">Payment Installment History</h3>
              <span className="badge bg-light text-muted border">
                {settlement.payments?.length || 0} Records
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
                  {settlement.payments && settlement.payments.length > 0 ? (
                    settlement.payments.map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td>{formatDate(p.paymentDate)}</td>
                        <td><span className="badge bg-light text-dark border">{p.paymentMethod || p.paymentMode}</span></td>
                        <td className="font-monospace text-muted small">{p.paymentReference || '—'}</td>
                        <td className="text-end fw-bold text-success">
                          <MoneyDisplay amount={p.amount} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4 small">
                        No payout payments recorded yet for this settlement.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payout Modal */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Record Broker Payout</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit(onSubmitPayment)}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {modalError}
                    </div>
                  )}

                  <div className="alert alert-info py-2 px-3 small rounded-3 mb-3">
                    Remaining Payable: <strong>₹{settlement.remainingBalance}</strong>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="payoutAmountInput">
                      Payout Amount (₹) *
                    </label>
                    <input
                      id="payoutAmountInput"
                      type="number"
                      className={`form-control fw-bold ${errors.amount ? 'is-invalid' : ''}`}
                      {...register('amount', { valueAsNumber: true })}
                    />
                    {errors.amount && (
                      <div className="invalid-feedback">{errors.amount.message}</div>
                    )}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="paymentModeSelect">
                        Payment Mode *
                      </label>
                      <select id="paymentModeSelect" className="form-select" {...register('paymentMode')}>
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                        <option value="UPI">UPI</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="CASH">Cash</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label" htmlFor="payoutDateInput">
                        Payment Date *
                      </label>
                      <input
                        id="payoutDateInput"
                        type="date"
                        className="form-control"
                        {...register('paymentDate')}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="payoutRefInput">
                      UTR / Cheque / Transaction Reference
                    </label>
                    <input
                      id="payoutRefInput"
                      type="text"
                      className="form-control font-monospace"
                      placeholder="e.g. UTR123456789"
                      {...register('paymentReference')}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="payoutRemarksInput">
                      Notes
                    </label>
                    <input
                      id="payoutRemarksInput"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Final balance payout"
                      {...register('remarks')}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Recording...' : 'Confirm Payout'}
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

export default SettlementDetailPage;
