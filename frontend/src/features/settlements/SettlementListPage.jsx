import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { brokerService } from '../../services/brokerService';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import FilterBar from '../../components/common/FilterBar';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import { HandCoins, Eye, CreditCard } from 'lucide-react';

export function SettlementListPage() {
  const navigate = useNavigate();

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

  const [settlements, setSettlements] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettlements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await brokerService.getSettlements({
        status: statusFilter || undefined,
        page,
        size,
        sortBy,
        sortDirection,
      });
      setSettlements(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load settlements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [page, size, sortBy, sortDirection, statusFilter]);

  const columns = [
    {
      header: 'Settlement',
      field: 'id',
      sortable: true,
      render: (row) => (
        <div>
          <span className="fw-bold text-dark font-monospace">#{row.id}</span>
          <div className="text-muted small">Sale Ref: #{row.saleId || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Broker',
      field: 'brokerName',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.brokerName || `Broker #${row.brokerId}`}</div>
          <div className="text-muted small">ID: #{row.brokerId}</div>
        </div>
      ),
    },
    {
      header: 'Vehicle',
      field: 'vehicleRegistrationNumber',
      render: (row) => (
        <div>
          <span className="badge bg-light text-dark border font-monospace">
            {formatRegNumber(row.vehicleRegistrationNumber || row.registrationNumber)}
          </span>
          <div className="text-muted small">{row.vehicleName || (row.vehicleId ? `Vehicle #${row.vehicleId}` : '—')}</div>
        </div>
      ),
    },
    {
      header: 'Payable Amount',
      field: 'netPayable',
      sortable: true,
      className: 'text-end',
      render: (row) => (
        <div className="text-end">
          <MoneyDisplay
            amount={row.netPayable ?? row.brokerPayableAmount ?? row.brokerAmount}
            className="fw-bold text-dark"
          />
        </div>
      ),
    },
    {
      header: 'Paid to Broker',
      field: 'paidAmount',
      className: 'text-end',
      render: (row) => (
        <div className="text-end">
          <MoneyDisplay amount={row.paidAmount} className="text-success" />
        </div>
      ),
    },
    {
      header: 'Remaining Balance',
      field: 'balanceAmount',
      className: 'text-end',
      render: (row) => {
        const bal = row.balanceAmount ?? row.remainingBalance ?? 0;
        return (
          <div className="text-end">
            <MoneyDisplay
              amount={bal}
              className={`fw-bold ${Number(bal) > 0 ? 'text-danger' : 'text-muted'}`}
            />
          </div>
        );
      },
    },
    {
      header: 'Status',
      field: 'settlementStatus',
      sortable: true,
      render: (row) => <StatusBadge status={row.settlementStatus || row.status} />,
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
            title="View Details & Payout"
            onClick={() => navigate(`/settlements/${row.id}`)}
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
        title="Broker Settlements"
        subtitle="Track broker sales proceeds, commissions, shop deductions, and payout installments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Brokers', href: '/brokers' },
          { label: 'Settlements' },
        ]}
      />

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
          <option value="">All Settlement Statuses</option>
          <option value="PENDING">PENDING (Unpaid)</option>
          <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
          <option value="PAID">PAID (Settled)</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={settlements}
        isLoading={isLoading}
        error={error}
        onRetry={fetchSettlements}
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
        emptyTitle="No settlements found"
        emptyDescription="When a broker consigned vehicle is sold, settlement records are automatically generated."
      />
    </div>
  );
}

export default SettlementListPage;
