import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { brokerService } from '../../services/brokerService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import SearchInput from '../../components/common/SearchInput';
import { formatPhone } from '../../utils/formatters';
import { Users2, Plus, Eye, Edit2, AlertCircle, Phone, Mail, CheckCircle2 } from 'lucide-react';

const brokerSchema = z.object({
  fullName: z.string().min(2, 'Broker full name is required'),
  mobileNumber: z.string().min(10, 'Valid 10-digit mobile number required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  address: z.string().optional(),
  panNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
});

export function BrokerListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('BROKERS', 'ADD');
  const canEdit = hasPermission('BROKERS', 'EDIT');

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
    resetPagination,
  } = usePagination(0, 10);

  const [brokers, setBrokers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(brokerSchema),
  });

  const fetchBrokers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size,
        sortBy,
        sortDirection,
        search: debouncedSearch || undefined,
        active: activeFilter === '' ? undefined : activeFilter === 'true',
      };
      const res = await brokerService.getAllBrokers(params);
      setBrokers(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load brokers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, [page, size, sortBy, sortDirection, debouncedSearch, activeFilter]);

  const handleOpenAdd = () => {
    setEditingBroker(null);
    reset({
      fullName: '',
      mobileNumber: '',
      email: '',
      address: '',
      panNumber: '',
      bankAccountNumber: '',
      bankIfscCode: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (broker) => {
    setEditingBroker(broker);
    reset({
      fullName: broker.name || broker.fullName || '',
      mobileNumber: broker.mobile || broker.mobileNumber || '',
      email: broker.email || '',
      address: broker.address || '',
      panNumber: broker.panNumber || '',
      bankAccountNumber: broker.bankAccountNumber || '',
      bankIfscCode: broker.bankIfscCode || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const onSubmitBroker = async (data) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      const notes = [
        data.panNumber ? `PAN: ${data.panNumber}` : '',
        data.bankAccountNumber ? `A/C: ${data.bankAccountNumber}` : '',
        data.bankIfscCode ? `IFSC: ${data.bankIfscCode}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      if (editingBroker) {
        const updatePayload = {
          name: data.fullName,
          email: data.email || null,
          address: data.address || null,
          idProofType: data.panNumber ? 'PAN' : null,
          notes: notes || null,
          active: true,
        };
        await brokerService.updateBroker(editingBroker.id, updatePayload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Broker Updated',
            message: `${data.fullName} details updated successfully.`,
          })
        );
      } else {
        const createPayload = {
          name: data.fullName,
          mobile: data.mobileNumber,
          email: data.email || null,
          address: data.address || null,
          idProofType: data.panNumber ? 'PAN' : null,
          notes: notes || null,
        };
        await brokerService.createBroker(createPayload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Broker Registered',
            message: `${data.fullName} has been registered as an active broker.`,
          })
        );
      }
      setIsModalOpen(false);
      fetchBrokers();
    } catch (err) {
      setModalError(err.message || 'Failed to save broker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Broker Name',
      field: 'name',
      sortable: true,
      render: (row) => {
        const brokerDisplayName = row.name || row.fullName || 'Broker';
        return (
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
              style={{ width: '36px', height: '36px' }}
            >
              {brokerDisplayName[0]?.toUpperCase()}
            </div>
            <div>
              <div className="fw-bold text-dark">{brokerDisplayName}</div>
              <div className="text-muted small">ID: #{row.id}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Mobile',
      field: 'mobile',
      render: (row) => (
        <span className="small text-dark font-monospace">{formatPhone(row.mobile || row.mobileNumber)}</span>
      ),
    },
    {
      header: 'Email',
      field: 'email',
      render: (row) => <span className="small text-muted">{row.email || '—'}</span>,
    },
    {
      header: 'PAN',
      field: 'panNumber',
      render: (row) => (
        <span className="badge bg-light text-dark border font-monospace">
          {row.panNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      field: 'active',
      render: (row) => (
        <span
          className={`badge ${row.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}
        >
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      field: 'actions',
      className: 'text-end',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1"
            title="View Dashboard & Listings"
            onClick={() => navigate(`/brokers/${row.id}`)}
          >
            <Eye size={15} />
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary p-1"
              title="Edit Broker"
              onClick={() => handleOpenEdit(row)}
            >
              <Edit2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Broker Management"
        subtitle="Manage consigned inventory brokers, commission agreements, and settlement balances"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Brokers' },
        ]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleOpenAdd}
          >
            <Plus size={16} /> Register Broker
          </button>
        )}
      </PageHeader>

      <FilterBar
        onReset={() => {
          setSearchTerm('');
          setActiveFilter('');
          resetPagination();
        }}
        hasActiveFilters={Boolean(searchTerm || activeFilter)}
      >
        <SearchInput
          placeholder="Search broker by name, mobile, pan..."
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            resetPagination();
          }}
        />

        <select
          className="form-select form-select-sm"
          style={{ width: '130px' }}
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            resetPagination();
          }}
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={brokers}
        isLoading={isLoading}
        error={error}
        onRetry={fetchBrokers}
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
        emptyTitle="No brokers found"
        emptyDescription="Register brokers to manage third-party consignment vehicle listings."
        emptyActionLabel={canAdd ? 'Register First Broker' : undefined}
        onEmptyAction={handleOpenAdd}
      />

      {/* Add / Edit Broker Modal */}
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
                <h5 className="modal-title h6 fw-bold">
                  {editingBroker ? 'Edit Broker Record' : 'Register New Broker'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit(onSubmitBroker)}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {modalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="fullNameInput">
                      Full Name *
                    </label>
                    <input
                      id="fullNameInput"
                      type="text"
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      placeholder="e.g. Ramesh Verma"
                      {...register('fullName')}
                    />
                    {errors.fullName && (
                      <div className="invalid-feedback">{errors.fullName.message}</div>
                    )}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="mobileInput">
                        Mobile Number *
                      </label>
                      <input
                        id="mobileInput"
                        type="text"
                        className={`form-control font-monospace ${errors.mobileNumber ? 'is-invalid' : ''}`}
                        placeholder="10-digit number"
                        {...register('mobileNumber')}
                      />
                      {errors.mobileNumber && (
                        <div className="invalid-feedback">{errors.mobileNumber.message}</div>
                      )}
                    </div>

                    <div className="col-6">
                      <label className="form-label" htmlFor="emailInput">
                        Email Address
                      </label>
                      <input
                        id="emailInput"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="broker@dealership.com"
                        {...register('email')}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email.message}</div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="panInput">
                      PAN Card Number
                    </label>
                    <input
                      id="panInput"
                      type="text"
                      className="form-control font-monospace text-uppercase"
                      placeholder="ABCDE1234F"
                      {...register('panNumber')}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="bankAccountInput">
                        Bank Account Number
                      </label>
                      <input
                        id="bankAccountInput"
                        type="text"
                        className="form-control font-monospace"
                        placeholder="For payout transfers"
                        {...register('bankAccountNumber')}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" htmlFor="ifscInput">
                        Bank IFSC Code
                      </label>
                      <input
                        id="ifscInput"
                        type="text"
                        className="form-control font-monospace text-uppercase"
                        placeholder="e.g. SBIN0001234"
                        {...register('bankIfscCode')}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="addressInput">
                      Address / City
                    </label>
                    <textarea
                      id="addressInput"
                      className="form-control"
                      rows="2"
                      placeholder="Street, City, State"
                      {...register('address')}
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
                    {isSubmitting ? 'Saving...' : editingBroker ? 'Update Broker' : 'Register Broker'}
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

export default BrokerListPage;
