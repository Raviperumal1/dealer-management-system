import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { salesService } from '../../services/salesService';
import { vehicleService } from '../../services/vehicleService';
import { customerService } from '../../services/customerService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import { CalendarCheck, Plus, XCircle } from 'lucide-react';

export function BookingListPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('SALES', 'ADD');
  const canEdit = hasPermission('SALES', 'EDIT');

  const prefilledVehicleId = searchParams.get('vehicleId');

  const {
    page,
    size,
    sortBy,
    sortDirection,
    handlePageChange,
    handleSizeChange,
    handleSort,
  } = usePagination(0, 10);

  const [bookings, setBookings] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vehicles and Customers for booking modal
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Create Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(Boolean(prefilledVehicleId));
  const [selectedVehicleId, setSelectedVehicleId] = useState(prefilledVehicleId || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState(10000);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Cancellation State
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('Cancelled by customer request');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await salesService.getAllBookings({
        page,
        size,
        sortBy,
        sortDirection,
      });
      setBookings(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, size, sortBy, sortDirection]);

  const handleOpenCreate = async () => {
    try {
      const [vehRes, custRes] = await Promise.all([
        vehicleService.getAvailableVehicles({ size: 100 }),
        customerService.getAllCustomers({ size: 100 }),
      ]);
      setAvailableVehicles(vehRes.content || []);
      setCustomers(custRes.content || []);

      if (vehRes.content?.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(String(vehRes.content[0].id));
      }
      if (custRes.content?.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(String(custRes.content[0].id));
      }
      setModalError(null);
      setIsModalOpen(true);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load available vehicles or customers' }));
    }
  };

  useEffect(() => {
    if (prefilledVehicleId) {
      handleOpenCreate();
    }
  }, [prefilledVehicleId]);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedCustomerId) {
      setModalError('Please select both vehicle and customer');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      await salesService.createBooking({
        vehicleId: Number(selectedVehicleId),
        customerId: Number(selectedCustomerId),
        advanceAmount: Number(advanceAmount),
        bookingDate,
        expiryDate: expiryDate || null,
        notes: remarks || '',
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Booking Confirmed',
          message: 'Vehicle reserved successfully and locked to BOOKED status.',
        })
      );
      setIsModalOpen(false);
      fetchBookings();
    } catch (err) {
      setModalError(err.message || 'Failed to reserve vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    setIsCancelling(true);
    try {
      await salesService.cancelBooking(cancellingBookingId, cancelReason);
      dispatch(
        addToast({
          type: 'success',
          title: 'Booking Cancelled',
          message: 'Booking cancelled and vehicle released back to AVAILABLE inventory.',
        })
      );
      setCancellingBookingId(null);
      fetchBookings();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to cancel booking' }));
    } finally {
      setIsCancelling(false);
    }
  };

  const columns = [
    {
      header: 'Booking #',
      field: 'id',
      sortable: true,
      render: (row) => <span className="fw-bold text-dark font-monospace">#{row.id}</span>,
    },
    {
      header: 'Vehicle',
      field: 'vehicleName',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.vehicleName}</div>
          <span className="badge bg-light text-dark border font-monospace">
            {formatRegNumber(row.registrationNumber)}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      field: 'customerName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.customerName}</div>
          <div className="text-muted small">{row.customerMobile}</div>
        </div>
      ),
    },
    {
      header: 'Booking Date',
      field: 'bookingDate',
      sortable: true,
      render: (row) => formatDate(row.bookingDate),
    },
    {
      header: 'Advance Token',
      field: 'advanceAmount',
      className: 'text-end',
      render: (row) => (
        <div className="text-end">
          <MoneyDisplay amount={row.advanceAmount} className="fw-bold text-success" />
        </div>
      ),
    },
    {
      header: 'Valid Until',
      field: 'validUntil',
      render: (row) => formatDate(row.validUntil),
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
          {canEdit && (row.status === 'ACTIVE' || row.status === 'CONFIRMED') && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger p-1"
              title="Cancel Booking & Release Vehicle"
              onClick={() => setCancellingBookingId(row.id)}
            >
              <XCircle size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Reservations & Bookings"
        subtitle="Manage customer advance tokens and inventory reservation locks"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales' },
          { label: 'Bookings' },
        ]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleOpenCreate}
          >
            <Plus size={16} /> New Booking
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={bookings}
        isLoading={isLoading}
        error={error}
        onRetry={fetchBookings}
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
        emptyTitle="No active bookings"
        emptyDescription="Create a vehicle booking to collect advance deposit and lock vehicle from other sales."
        emptyActionLabel={canAdd ? 'Create First Booking' : undefined}
        onEmptyAction={handleOpenCreate}
      />

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(cancellingBookingId)}
        title="Cancel Vehicle Booking?"
        message="Cancelling this booking will release the locked vehicle back to AVAILABLE inventory for other customers. Are you sure you want to proceed?"
        confirmLabel="Confirm Cancellation"
        confirmVariant="danger"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingBookingId(null)}
      />

      {/* Create Booking Modal */}
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
                <h5 className="modal-title h6 fw-bold">Reserve Vehicle with Advance Deposit</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmitBooking}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {modalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="bookVehSelect">
                      Select Available Vehicle *
                    </label>
                    <select
                      id="bookVehSelect"
                      className="form-select"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      required
                    >
                      <option value="">Choose vehicle...</option>
                      {availableVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)}) — ₹{v.sellingPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="bookCustSelect">
                      Select Customer *
                    </label>
                    <select
                      id="bookCustSelect"
                      className="form-select"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                    >
                      <option value="">Choose customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.mobileNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="advanceAmtInput">
                        Advance Token (₹) *
                      </label>
                      <input
                        id="advanceAmtInput"
                        type="number"
                        className="form-control fw-bold"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label" htmlFor="expiryDateInput">
                        Reservation Valid Until *
                      </label>
                      <input
                        id="expiryDateInput"
                        type="date"
                        className="form-control"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="bookRemarksInput">
                      Booking Remarks
                    </label>
                    <input
                      id="bookRemarksInput"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Token received via UPI, balance payable on delivery"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
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
                    {isSubmitting ? 'Reserving...' : 'Confirm Vehicle Reservation'}
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

export default BookingListPage;
