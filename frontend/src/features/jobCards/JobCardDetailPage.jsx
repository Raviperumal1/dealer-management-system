import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { jobCardService } from '../../services/jobCardService';
import { vehicleService } from '../../services/vehicleService';
import { costingService } from '../../services/costingService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import { Wrench, CheckCircle2, ArrowLeft, ArrowRightCircle, AlertCircle } from 'lucide-react';

export function JobCardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasPermission, isAdmin } = usePermission();
  const canChangeStatus = isAdmin || hasPermission('WORKSHOP', 'STATUS');

  const [jobCard, setJobCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const [vehicle, setVehicle] = useState(null);
  const [vehicleCost, setVehicleCost] = useState(null);

  const fetchJobCard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await jobCardService.getJobCardById(id);
      setJobCard(data);
      setNewStatus(data.status);
      if (data?.vehicleId) {
        vehicleService.getVehicleById(data.vehicleId).then(setVehicle).catch(() => {});
        costingService.getVehicleCost(data.vehicleId).then(setVehicleCost).catch(() => {});
      }
    } catch (err) {
      setError(err.message || 'Failed to load job card details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCard();
  }, [id]);

  const handleStatusTransition = async (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === jobCard?.status) {
      setStatusModalOpen(false);
      return;
    }

    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      await jobCardService.updateJobCardStatus(id, {
        status: newStatus,
        remarks: statusRemarks || `Updated to ${newStatus}`,
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Status Updated',
          message: `Job card status transitioned to ${newStatus}.`,
        })
      );
      setStatusModalOpen(false);
      fetchJobCard();
    } catch (err) {
      setStatusError(err.message || 'Failed to update job card status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Job Card Details" subtitle="Loading job card..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !jobCard) {
    return (
      <div>
        <PageHeader title="Job Card Details" />
        <ErrorState message={error || 'Job card not found'} onRetry={fetchJobCard} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Workshop Job Card #${jobCard.id}`}
        subtitle={`Vehicle: ${jobCard.vehicleName || 'Vehicle #' + (jobCard.vehicleId || '')} (${formatRegNumber(jobCard.vehicleRegistrationNumber || jobCard.registrationNumber)})`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Workshop', href: '/job-cards' },
          { label: 'Job Cards', href: '/job-cards' },
          { label: `#${jobCard.id}` },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate('/job-cards')}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {canChangeStatus && (
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
            onClick={() => setStatusModalOpen(true)}
          >
            <ArrowRightCircle size={14} /> Update Status
          </button>
        )}
      </PageHeader>

      {/* Header Summary */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Status</div>
              <div className="mt-1">
                <StatusBadge status={jobCard.status} />
              </div>
              <span className="small text-muted d-block mt-1">Assigned: {jobCard.assignedStaff || jobCard.assignedTo || 'Technician'}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Total Repair Cost</div>
              <div className="kpi-value text-dark">
                <MoneyDisplay amount={jobCard.totalCost} />
              </div>
              <span className="small text-muted">Parts + Labour</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Cost Split</div>
              <div className="kpi-value text-primary fs-5">{jobCard.costResponsibility || 'SHOP'}</div>
              <span className="small text-muted">
                {jobCard.costResponsibility === 'SHARED'
                  ? `Shop: ${jobCard.shopPercentage || '50'}% • Broker: ${jobCard.brokerPercentage || '50'}%`
                  : '100% Allocated'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Authoritative Recommended Price</div>
              <div className="kpi-value text-success font-monospace">
                <MoneyDisplay amount={vehicleCost?.recommendedSellingPriceGrossMargin || vehicleCost?.recommendedSellingPriceMarkup || vehicle?.sellingPrice || 0} />
              </div>
              <span className="small text-muted d-block">
                Finalized Cost: <MoneyDisplay amount={vehicleCost?.finalizedDealerCost || vehicleCost?.totalVehicleCost || vehicle?.purchasePrice || 0} />
              </span>
              {Number(vehicleCost?.estimatedRepairExposure || 0) > 0 && (
                <span className="small text-warning d-block">
                  Provisional Exposure: <MoneyDisplay amount={vehicleCost.estimatedRepairExposure} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Tasks List */}
        <div className="col-12 col-lg-5">
          <div className="app-card h-100">
            <div className="app-card-header">
              <h3 className="app-card-title">Repair Tasks</h3>
              <span className="badge bg-light text-muted border">
                {(jobCard.tasks || []).length} Tasks
              </span>
            </div>
            <div className="app-card-body">
              {jobCard.tasks && jobCard.tasks.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {jobCard.tasks.map((task, idx) => {
                    const desc = typeof task === 'object' && task !== null
                      ? (task.taskDescription || task.description || `Task #${idx + 1}`)
                      : String(task);
                    const taskCost = typeof task === 'object' && task !== null
                      ? (task.actualCost ?? task.estimatedCost)
                      : null;
                    const taskStatus = typeof task === 'object' && task !== null ? task.status : null;

                    return (
                      <li key={task?.id || idx} className="list-group-item px-0 d-flex align-items-center justify-content-between gap-2 small">
                        <div className="d-flex align-items-center gap-2">
                          <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                          <span className="text-dark fw-medium">{desc}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {taskStatus && (
                            <span className="badge bg-light text-secondary border font-monospace">
                              {taskStatus}
                            </span>
                          )}
                          {taskCost !== null && Number(taskCost) > 0 && (
                            <span className="text-muted fw-semibold">
                              <MoneyDisplay amount={taskCost} />
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted small mb-0">No specific repair tasks specified.</p>
              )}
            </div>
          </div>
        </div>

        {/* Consumed Spare Parts */}
        <div className="col-12 col-lg-7">
          <div className="app-card mb-4">
            <div className="app-card-header">
              <h3 className="app-card-title">Spare Parts Issued from Stock</h3>
              <span className="badge bg-light text-muted border">
                {(jobCard.parts || jobCard.partsUsed || []).length} Parts
              </span>
            </div>
            <div className="table-responsive">
              <table className="app-table table mb-0">
                <thead>
                  <tr>
                    <th>Part Name</th>
                    <th>Quantity</th>
                    <th className="text-end">Unit Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(jobCard.parts || jobCard.partsUsed || []).length > 0 ? (
                    (jobCard.parts || jobCard.partsUsed || []).map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td className="fw-semibold text-dark">
                          {p.partName || p.name || 'Spare Part'}
                          {p.partSku && (
                            <span className="text-muted small ms-1 font-monospace">({p.partSku})</span>
                          )}
                        </td>
                        <td>{p.quantity}</td>
                        <td className="text-end"><MoneyDisplay amount={p.unitPrice} /></td>
                        <td className="text-end fw-bold">
                          <MoneyDisplay amount={p.totalPrice ?? ((p.quantity || 0) * (p.unitPrice || 0))} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-muted small py-3">
                        No inventory parts issued.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Labour Entries */}
          <div className="app-card">
            <div className="app-card-header">
              <h3 className="app-card-title">Labour Charges</h3>
              <span className="badge bg-light text-muted border">
                {(jobCard.labourEntries || jobCard.labourItems || []).length} Items
              </span>
            </div>
            <div className="table-responsive">
              <table className="app-table table mb-0">
                <thead>
                  <tr>
                    <th>Work Description</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(jobCard.labourEntries || jobCard.labourItems || []).length > 0 ? (
                    (jobCard.labourEntries || jobCard.labourItems || []).map((l, idx) => (
                      <tr key={l.id || idx}>
                        <td>
                          <div>{l.description}</div>
                          {l.labourHours && (
                            <div className="text-muted small">
                              {l.labourHours} hrs @ <MoneyDisplay amount={l.hourlyRate} />/hr
                            </div>
                          )}
                        </td>
                        <td className="text-end fw-bold">
                          <MoneyDisplay amount={l.totalAmount ?? l.amount} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="text-center text-muted small py-3">
                        No labour entries recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {statusModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Update Job Card Status</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setStatusModalOpen(false)}
                />
              </div>
              <form onSubmit={handleStatusTransition}>
                <div className="modal-body p-4">
                  {statusError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {statusError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="jcStatusSelect">
                      Target State
                    </label>
                    <select
                      id="jcStatusSelect"
                      className="form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="WAITING_FOR_PARTS">WAITING FOR PARTS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="jcStatusRemarksInput">
                      Technician Remarks
                    </label>
                    <textarea
                      id="jcStatusRemarksInput"
                      className="form-control"
                      rows="3"
                      placeholder="e.g. Repairs completed, parts tested, vehicle ready for final inspection"
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setStatusModalOpen(false)}
                    disabled={isUpdatingStatus}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Confirm Status Update'}
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

export default JobCardDetailPage;
