import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { customerService } from '../../services/customerService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import SearchInput from '../../components/common/SearchInput';
import { formatPhone } from '../../utils/formatters';
import { UserCheck, Plus, Eye, Edit2, Phone, Mail, Shield } from 'lucide-react';

const customerSchema = z.object({
  fullName: z.string().min(2, 'Customer full name is required'),
  mobileNumber: z.string().min(10, 'Valid 10-digit mobile number required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  panNumber: z.string().optional(),
  aadharNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export function CustomerListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('CUSTOMERS', 'ADD');
  const canEdit = hasPermission('CUSTOMERS', 'EDIT');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

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

  const [customers, setCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await customerService.getAllCustomers({
        search: debouncedSearch || undefined,
        page,
        size,
        sortBy,
        sortDirection,
      });
      setCustomers(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, size, sortBy, sortDirection, debouncedSearch]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    reset({
      fullName: '',
      mobileNumber: '',
      email: '',
      panNumber: '',
      aadharNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    reset({
      fullName: c.name || c.fullName || '',
      mobileNumber: c.mobile || c.mobileNumber || '',
      email: c.email || '',
      panNumber: c.idProofType === 'PAN' ? (c.idProofNumber || '') : (c.panNumber || ''),
      aadharNumber: c.idProofType === 'AADHAAR' ? (c.idProofNumber || '') : (c.aadharNumber || ''),
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      pincode: c.pincode || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const onSubmitCustomer = async (data) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      const fullAddress = [data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ');
      const idType = data.aadharNumber ? 'AADHAAR' : data.panNumber ? 'PAN' : null;
      const idNum = data.aadharNumber || data.panNumber || null;

      if (editingCustomer) {
        const updatePayload = {
          name: data.fullName,
          email: data.email || null,
          address: fullAddress || null,
          idProofType: idType,
          idProofNumber: idNum,
          active: true,
        };
        await customerService.updateCustomer(editingCustomer.id, updatePayload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Customer Updated',
            message: `${data.fullName} profile updated successfully.`,
          })
        );
      } else {
        const createPayload = {
          name: data.fullName,
          mobile: data.mobileNumber,
          email: data.email || null,
          address: fullAddress || null,
          idProofType: idType,
          idProofNumber: idNum,
        };
        await customerService.createCustomer(createPayload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Customer Registered',
            message: `${data.fullName} registered into customer directory.`,
          })
        );
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setModalError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Customer',
      field: 'name',
      sortable: true,
      render: (row) => {
        const customerDisplayName = row.name || row.fullName || 'Customer';
        return (
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
              style={{ width: '36px', height: '36px' }}
            >
              {customerDisplayName[0]?.toUpperCase()}
            </div>
            <div>
              <div className="fw-bold text-dark">{customerDisplayName}</div>
              <div className="text-muted small">ID: #{row.id}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Mobile',
      field: 'mobile',
      render: (row) => <span className="small text-dark font-monospace">{formatPhone(row.mobile || row.mobileNumber)}</span>,
    },
    {
      header: 'Email',
      field: 'email',
      render: (row) => <span className="small text-muted">{row.email || '—'}</span>,
    },
    {
      header: 'KYC / ID Proof',
      field: 'idProofNumber',
      render: (row) => (
        <span className="badge bg-light text-dark border font-monospace">
          {row.idProofNumber ? `${row.idProofType ? row.idProofType + ': ' : ''}${row.idProofNumber}` : (row.panNumber || 'Pending KYC')}
        </span>
      ),
    },
    {
      header: 'City',
      field: 'city',
      render: (row) => row.city || '—',
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
            title="360° Profile & History"
            onClick={() => navigate(`/customers/${row.id}`)}
          >
            <Eye size={15} />
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary p-1"
              title="Edit Profile"
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
        title="Customer Directory"
        subtitle="Manage customer KYC records, CRM interaction logs, and transactional history"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Customers' },
        ]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleOpenAdd}
          >
            <Plus size={16} /> Register Customer
          </button>
        )}
      </PageHeader>

      <FilterBar
        onReset={() => {
          setSearchTerm('');
          resetPagination();
        }}
        hasActiveFilters={Boolean(searchTerm)}
      >
        <SearchInput
          placeholder="Search customer by name, mobile, pan..."
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            resetPagination();
          }}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        error={error}
        onRetry={fetchCustomers}
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
        emptyTitle="No customers found"
        emptyDescription="Register customers to enable vehicle bookings, sales orders, and service records."
        emptyActionLabel={canAdd ? 'Register First Customer' : undefined}
        onEmptyAction={handleOpenAdd}
      />

      {/* Add / Edit Customer Modal */}
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
                  {editingCustomer ? 'Edit Customer KYC Record' : 'Register New Customer'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit(onSubmitCustomer)}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {modalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="custFullNameInput">
                      Full Legal Name *
                    </label>
                    <input
                      id="custFullNameInput"
                      type="text"
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      placeholder="e.g. Vikramaditya Rathore"
                      {...register('fullName')}
                    />
                    {errors.fullName && (
                      <div className="invalid-feedback">{errors.fullName.message}</div>
                    )}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="custMobileInput">
                        Mobile Number *
                      </label>
                      <input
                        id="custMobileInput"
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
                      <label className="form-label" htmlFor="custEmailInput">
                        Email Address
                      </label>
                      <input
                        id="custEmailInput"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="customer@email.com"
                        {...register('email')}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label" htmlFor="custPanInput">
                        PAN Card Number
                      </label>
                      <input
                        id="custPanInput"
                        type="text"
                        className="form-control font-monospace text-uppercase"
                        placeholder="ABCDE1234F"
                        {...register('panNumber')}
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label" htmlFor="custAadharInput">
                        Aadhaar Number
                      </label>
                      <input
                        id="custAadharInput"
                        type="text"
                        className="form-control font-monospace"
                        placeholder="12-digit UID"
                        {...register('aadharNumber')}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="custAddrInput">
                      Address & City
                    </label>
                    <textarea
                      id="custAddrInput"
                      className="form-control"
                      rows="2"
                      placeholder="Street address, City, State"
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
                    {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Profile' : 'Register Customer'}
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

export default CustomerListPage;
