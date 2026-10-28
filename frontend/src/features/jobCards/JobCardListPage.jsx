import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobCardService } from '../../services/jobCardService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import FilterBar from '../../components/common/FilterBar';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import { Wrench, Plus, Eye } from 'lucide-react';

export function JobCardListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('WORKSHOP', 'ADD');

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

  const [jobCards, setJobCards] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await jobCardService.getAllJobCards({
        status: statusFilter || undefined,
        page,
        size,
        sortBy,
        sortDirection,
      });
      setJobCards(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load job cards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, [page, size, sortBy, sortDirection, statusFilter]);

  const columns = [
    {
      header: 'Job Card #',
      field: 'id',
      sortable: true,
      render: (row) => <span className="fw-bold text-dark font-monospace">#{row.id}</span>,
    },
    {
      header: 'Vehicle',
      field: 'vehicleRegistrationNumber',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.vehicleName || 'Vehicle'}</div>
          <span className="badge bg-light text-dark border font-monospace">
            {formatRegNumber(row.vehicleRegistrationNumber || row.registrationNumber)}
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Mechanic',
      field: 'assignedStaff',
      render: (row) => row.assignedStaff || row.assignedTo || 'Unassigned',
    },
    {
      header: 'Cost Split',
      field: 'costResponsibility',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          {row.costResponsibility || 'SHOP'}
        </span>
      ),
    },
    {
      header: 'Total Repair Cost',
      field: 'totalCost',
      sortable: true,
      className: 'text-end',
      render: (row) => (
        <div className="text-end">
          <MoneyDisplay amount={row.totalCost} className="fw-bold text-dark" />
        </div>
      ),
    },
    {
      header: 'Status',
      field: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Date Created',
      field: 'createdAt',
      render: (row) => formatDate(row.createdAt),
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
            title="View Details"
            onClick={() => navigate(`/job-cards/${row.id}`)}
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Workshop Job Cards"
        subtitle="Manage vehicle maintenance tasks, inventory parts consumption, and repair labour"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Workshop' },
          { label: 'Job Cards' },
        ]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => navigate('/job-cards/new')}
          >
            <Plus size={16} /> New Job Card
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
          <option value="">All Job Card Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="WAITING_FOR_PARTS">WAITING FOR PARTS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={jobCards}
        isLoading={isLoading}
        error={error}
        onRetry={fetchJobCards}
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
        emptyTitle="No job cards found"
        emptyDescription="Create job cards to track repair work and issue parts from stock."
        emptyActionLabel={canAdd ? 'Create Job Card' : undefined}
        onEmptyAction={() => navigate('/job-cards/new')}
      />
    </div>
  );
}

export default JobCardListPage;
