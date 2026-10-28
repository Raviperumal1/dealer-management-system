import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../../services/salesService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import FilterBar from '../../components/common/FilterBar';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import { ShoppingCart, Plus, Eye, CreditCard } from 'lucide-react';

export function SalesListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('SALES', 'ADD');

  const [saleTypeFilter, setSaleTypeFilter] = useState('');
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

  const [sales, setSales] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSales = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await salesService.getAllSales({
        saleType: saleTypeFilter || undefined,
        status: statusFilter || undefined,
        page,
        size,
        sortBy,
        sortDirection,
      });
      setSales(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load sales orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, size, sortBy, sortDirection, saleTypeFilter, statusFilter]);

  const columns = [
    {
      header: 'Sale Order',
      field: 'id',
      sortable: true,
      render: (row) => (
        <div>
          <span className="fw-bold text-dark font-monospace">#{row.id}</span>
          <div className="text-muted small">{formatDate(row.saleDate)}</div>
        </div>
      ),
    },
    {
      header: 'Vehicle',
      field: 'vehicleName',
      render: (row) => {
        const vehicleTitle =
          row.vehicleBrand && row.vehicleModel
            ? `${row.vehicleBrand} ${row.vehicleModel}`
            : (row.vehicleName || row.vehicleBrand || 'Vehicle');
        const regNo = row.vehicleRegistrationNumber || row.registrationNumber;
        return (
          <div>
            <div className="fw-bold text-dark">{vehicleTitle}</div>
            <span className="badge bg-light text-dark border font-monospace">
              {formatRegNumber(regNo)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Customer',
      field: 'customerName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.customerName || 'Customer'}</div>
          <div className="text-muted small">{row.customerMobile || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Channel / Type',
      field: 'saleType',
      render: (row) => (
        <span className={`badge ${row.saleType === 'DIRECT' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'} border`}>
          {row.saleType || 'DIRECT'}
        </span>
      ),
    },
    {
      header: 'Sale Price',
      field: 'salePrice',
      sortable: true,
      className: 'text-end',
      render: (row) => {
        const effectivePrice = row.finalSalePrice ?? row.agreedPrice ?? row.salePrice ?? 0;
        return (
          <div className="text-end">
            <MoneyDisplay amount={effectivePrice} className="fw-bold text-dark" />
          </div>
        );
      },
    },
    {
      header: 'Paid Amount',
      field: 'paidAmount',
      className: 'text-end',
      render: (row) => {
        const effectivePaid = row.totalPaid ?? row.paidAmount ?? 0;
        return (
          <div className="text-end">
            <MoneyDisplay amount={effectivePaid} className="text-success fw-semibold" />
          </div>
        );
      },
    },
    {
      header: 'Outstanding Balance',
      field: 'balanceAmount',
      className: 'text-end',
      render: (row) => {
        const effectivePrice = row.finalSalePrice ?? row.agreedPrice ?? row.salePrice ?? 0;
        const effectivePaid = row.totalPaid ?? row.paidAmount ?? 0;
        const effectiveBal = row.balanceDue ?? row.balanceAmount ?? (Number(effectivePrice) - Number(effectivePaid));
        return (
          <div className="text-end">
            <MoneyDisplay
              amount={effectiveBal}
              className={`fw-bold ${Number(effectiveBal) > 0 ? 'text-danger' : 'text-muted'}`}
            />
          </div>
        );
      },
    },
    {
      header: 'Status',
      field: 'status',
      sortable: true,
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.saleType === 'FINANCE' && row.finance && (
            <div className="mt-1">
              <span className={`badge ${row.finance.status === 'CLOSED' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'}`} style={{ fontSize: '0.68rem' }}>
                Loan: {row.finance.status}
              </span>
            </div>
          )}
        </div>
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
            title="View Sale Details & Payments"
            onClick={() => navigate(`/sales/${row.id}`)}
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
        title="Vehicle Sales Orders"
        subtitle="Manage customer sales contracts, payment collections, financing arrangements, and delivery dispatch"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales' },
        ]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => navigate('/sales/new')}
          >
            <Plus size={16} /> New Vehicle Sale
          </button>
        )}
      </PageHeader>

      <FilterBar
        onReset={() => {
          setSaleTypeFilter('');
          setStatusFilter('');
          resetPagination();
        }}
        hasActiveFilters={Boolean(saleTypeFilter || statusFilter)}
      >
        <select
          className="form-select form-select-sm"
          style={{ width: '160px' }}
          value={saleTypeFilter}
          onChange={(e) => {
            setSaleTypeFilter(e.target.value);
            resetPagination();
          }}
        >
          <option value="">All Channels</option>
          <option value="DIRECT">Direct Sales</option>
          <option value="FINANCE">Finance Sales</option>
        </select>

        <select
          className="form-select form-select-sm"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            resetPagination();
          }}
        >
          <option value="">All Sales Statuses</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={sales}
        isLoading={isLoading}
        error={error}
        onRetry={fetchSales}
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
        emptyTitle="No sales orders found"
        emptyDescription="Execute vehicle sales transactions for available own or broker consigned inventory."
        emptyActionLabel={canAdd ? 'Initiate First Sale' : undefined}
        onEmptyAction={() => navigate('/sales/new')}
      />
    </div>
  );
}

export default SalesListPage;
