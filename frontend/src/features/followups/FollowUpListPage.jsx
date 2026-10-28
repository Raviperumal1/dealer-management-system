import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { serviceRecordService } from '../../services/serviceRecordService';
import { customerService } from '../../services/customerService';
import { vehicleService } from '../../services/vehicleService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import FilterBar from '../../components/common/FilterBar';
import { formatPhone, formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import { PhoneCall, Plus, Edit2, CheckCircle2 } from 'lucide-react';

export function FollowUpListPage() {
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('SERVICE', 'ADD');
  const canEdit = hasPermission('SERVICE', 'EDIT');

  const [statusFilter, setStatusFilter] = useState('');
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

  const [followUps, setFollowUps] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Follow-Up Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newRemarks, setNewRemarks] = useState('Routine 3-month post-service feedback check');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Update Outcome Modal
  const [updatingFollowUp, setUpdatingFollowUp] = useState(null);
  const [outcomeStatus, setOutcomeStatus] = useState('CONTACTED');
  const [outcomeRemarks, setOutcomeRemarks] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchFollowUps = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await serviceRecordService.getAllFollowUps({
        status: statusFilter || undefined,
        page,
        size,
        sortBy,
        sortDirection,
      });
      setFollowUps(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load customer follow-ups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [page, size, sortBy, sortDirection, statusFilter]);

  const handleOpenNewModal = async () => {
    try {
      const [cRes, vRes] = await Promise.all([
        customerService.getAllCustomers({ size: 100 }),
        vehicleService.getAllVehicles({ size: 100 }),
      ]);
      setCustomers(cRes.content || []);
      setVehicles(vRes.content || []);
      if (cRes.content?.length > 0) setNewCustomerId(String(cRes.content[0].id));
      if (vRes.content?.length > 0) setNewVehicleId(String(vRes.content[0].id));
      setIsNewModalOpen(true);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load customers or vehicles' }));
    }
  };

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!newCustomerId || !newVehicleId) {
      dispatch(addToast({ type: 'warning', message: 'Customer and vehicle are both required to schedule a follow-up.' }));
      return;
    }
    setIsSubmittingNew(true);
    try {
      await serviceRecordService.createFollowUp({
        customerId: Number(newCustomerId),
        vehicleId: Number(newVehicleId),
        followUpDate: scheduledDate,
        remarks: newRemarks || '',
        outcome: newRemarks || '',
        status: 'UPCOMING',
        assignedStaff: 'Service Advisor',
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Follow-up Scheduled',
          message: 'Customer CRM reminder scheduled successfully.',
        })
      );
      setIsNewModalOpen(false);
      fetchFollowUps();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to schedule follow-up' }));
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleUpdateOutcome = async (e) => {
    e.preventDefault();
    if (!updatingFollowUp) return;
    setIsUpdating(true);
    try {
      await serviceRecordService.updateFollowUp(updatingFollowUp.id, {
        status: outcomeStatus,
        remarks: outcomeRemarks,
        outcome: outcomeRemarks,
        nextFollowUpDate: nextContactDate || null,
        assignedStaff: updatingFollowUp.assignedStaff || 'Service Advisor',
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Outcome Logged',
          message: 'Follow-up conversation notes saved.',
        })
      );
      setUpdatingFollowUp(null);
      fetchFollowUps();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to update follow-up' }));
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    {
      header: 'Follow-Up #',
      field: 'id',
      sortable: true,
      render: (row) => <span className="fw-bold font-monospace text-dark">#{row.id}</span>,
    },
    {
      header: 'Customer',
      field: 'customerName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.customerName || 'Customer'}</div>
          <div className="text-muted small">{formatPhone(row.customerMobile)}</div>
        </div>
      ),
    },
    {
      header: 'Vehicle',
      field: 'vehicleRegistrationNumber',
      render: (row) => (
        <div>
          <div className="small fw-semibold text-dark">
            {row.vehicleBrand ? `${row.vehicleBrand} ${row.vehicleModel || ''}` : row.vehicleName || 'Vehicle'}
          </div>
          {(row.vehicleRegistrationNumber || row.registrationNumber) && (
            <span className="badge bg-light text-dark border font-monospace">
              {formatRegNumber(row.vehicleRegistrationNumber || row.registrationNumber)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Scheduled Date',
      field: 'followUpDate',
      sortable: true,
      render: (row) => formatDate(row.followUpDate || row.scheduledDate),
    },
    {
      header: 'Remarks / Notes',
      field: 'remarks',
      render: (row) => <span className="small text-muted">{row.remarks || row.outcome || '—'}</span>,
    },
    {
      header: 'Status',
      field: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      field: 'actions',
      className: 'text-end',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          {canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
              title="Log Call Outcome"
              onClick={() => {
                setUpdatingFollowUp(row);
                setOutcomeStatus(row.status === 'CLOSED' ? 'CLOSED' : 'CONTACTED');
                setOutcomeRemarks(row.remarks || '');
                setNextContactDate('');
              }}
            >
              <PhoneCall size={14} /> Log Call
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customer CRM Follow-Ups"
        subtitle="Manage routine post-sales satisfaction checks, service reminders, and customer call outcomes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Service' },
          { label: 'Follow-ups' },
        ]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleOpenNewModal}
          >
            <Plus size={16} /> Schedule Follow-Up
          </button>
        )}
      </PageHeader>

      <FilterBar
        onReset={() => {
          setStatusFilter('');
          resetPagination();
        }}
        hasActiveFilters={Boolean(statusFilter)}
      >
        <select
          className="form-select form-select-sm"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            resetPagination();
          }}
        >
          <option value="">All Follow-Up Statuses</option>
          <option value="UPCOMING">UPCOMING</option>
          <option value="DUE">DUE TODAY</option>
          <option value="OVERDUE">OVERDUE</option>
          <option value="CONTACTED">CONTACTED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={followUps}
        isLoading={isLoading}
        error={error}
        onRetry={fetchFollowUps}
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
        emptyTitle="No follow-ups recorded"
        emptyDescription="Schedule follow-ups with customers to ensure after-sales satisfaction and service retention."
        emptyActionLabel={canAdd ? 'Schedule First Follow-Up' : undefined}
        onEmptyAction={handleOpenNewModal}
      />

      {/* Schedule Follow-Up Modal */}
      {isNewModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Schedule Customer Follow-Up</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsNewModalOpen(false)}
                />
              </div>

              <form onSubmit={handleCreateFollowUp}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="fuCustSelect">
                      Customer *
                    </label>
                    <select
                      id="fuCustSelect"
                      className="form-select"
                      value={newCustomerId}
                      onChange={(e) => setNewCustomerId(e.target.value)}
                      required
                    >
                      <option value="">Select customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.fullName} ({c.mobile || c.mobileNumber || 'No phone'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="fuVehSelect">
                      Vehicle *
                    </label>
                    <select
                      id="fuVehSelect"
                      className="form-select"
                      value={newVehicleId}
                      onChange={(e) => setNewVehicleId(e.target.value)}
                      required
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="fuDateInput">
                      Scheduled Call Date *
                    </label>
                    <input
                      id="fuDateInput"
                      type="date"
                      className="form-control"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="fuRemarksInput">
                      Call Purpose / Remarks
                    </label>
                    <input
                      id="fuRemarksInput"
                      type="text"
                      className="form-control"
                      value={newRemarks}
                      onChange={(e) => setNewRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsNewModalOpen(false)}
                    disabled={isSubmittingNew}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isSubmittingNew}
                  >
                    {isSubmittingNew ? 'Scheduling...' : 'Schedule Follow-Up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Log Call Outcome Modal */}
      {updatingFollowUp && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Log Follow-Up Call Outcome</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setUpdatingFollowUp(null)}
                />
              </div>

              <form onSubmit={handleUpdateOutcome}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="outcomeStatusSelect">
                      Follow-Up Status *
                    </label>
                    <select
                      id="outcomeStatusSelect"
                      className="form-select"
                      value={outcomeStatus}
                      onChange={(e) => setOutcomeStatus(e.target.value)}
                    >
                      <option value="CONTACTED">CONTACTED (Spoke with customer)</option>
                      <option value="CLOSED">CLOSED (Completed / Satisfied)</option>
                      <option value="OVERDUE">NO ANSWER / RETRY LATER</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="outcomeRemarksInput">
                      Call Notes & Customer Feedback *
                    </label>
                    <textarea
                      id="outcomeRemarksInput"
                      className="form-control"
                      rows="3"
                      placeholder="e.g. Customer happy with brake repair. Next service in 5,000 km."
                      value={outcomeRemarks}
                      onChange={(e) => setOutcomeRemarks(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="outcomeNextDateInput">
                      Next Follow-Up Date (Optional)
                    </label>
                    <input
                      id="outcomeNextDateInput"
                      type="date"
                      className="form-control"
                      value={nextContactDate}
                      onChange={(e) => setNextContactDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setUpdatingFollowUp(null)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save Conversation Outcome'}
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

export default FollowUpListPage;
