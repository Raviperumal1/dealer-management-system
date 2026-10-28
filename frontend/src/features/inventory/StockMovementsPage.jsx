import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { formatDateTime } from '../../utils/date';
import { formatRegNumber } from '../../utils/formatters';
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Package, ShieldAlert } from 'lucide-react';

export function StockMovementsPage() {
  const {
    page,
    size,
    sortBy,
    sortDirection,
    handlePageChange,
    handleSizeChange,
    handleSort,
  } = usePagination(0, 20);

  const [movements, setMovements] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getStockMovements({
        page,
        size,
        sortBy,
        sortDirection,
      });
      setMovements(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load stock movements ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [page, size, sortBy, sortDirection]);

  const columns = [
    {
      header: 'Timestamp',
      field: 'createdAt',
      sortable: true,
      render: (row) => <span className="small text-muted">{formatDateTime(row.createdAt)}</span>,
    },
    {
      header: 'Part / SKU',
      field: 'partName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.partName || 'Spare Part'}</div>
          <span className="font-monospace text-muted small">{row.partSku || row.partNumber || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Movement Type',
      field: 'movementType',
      render: (row) => {
        const isConsumption =
          row.movementType === 'JOB_CARD_USAGE' || row.movementType === 'SERVICE_USAGE';
        const isPurchase = row.movementType === 'PURCHASE_IN';

        let badgeClass = 'bg-secondary-subtle text-secondary';
        let icon = <ArrowLeftRight size={13} />;

        if (isPurchase) {
          badgeClass = 'bg-success-subtle text-success border border-success-subtle';
          icon = <ArrowDownRight size={13} />;
        } else if (isConsumption) {
          badgeClass = 'bg-danger-subtle text-danger border border-danger-subtle';
          icon = <ArrowUpRight size={13} />;
        }

        return (
          <span className={`badge d-inline-flex align-items-center gap-1 font-monospace ${badgeClass}`}>
            {icon}
            {row.movementType}
          </span>
        );
      },
    },
    {
      header: 'Qty Change',
      field: 'quantity',
      className: 'text-end',
      render: (row) => {
        const isConsumption =
          row.movementType === 'JOB_CARD_USAGE' || row.movementType === 'SERVICE_USAGE';
        const qty = row.quantity ?? row.quantityChange ?? 0;
        const isPositive = !isConsumption && qty > 0;

        return (
          <span className={`fw-bold font-monospace ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? `+${qty}` : `-${Math.abs(qty)}`}
          </span>
        );
      },
    },
    {
      header: 'Balance After',
      field: 'balanceAfter',
      className: 'text-end',
      render: (row) => (
        <span className="fw-bold text-dark font-monospace">{row.balanceAfter ?? '—'}</span>
      ),
    },
    {
      header: 'Reference / Vehicle',
      field: 'referenceDocument',
      render: (row) => (
        <div>
          <div className="small font-monospace text-dark">
            {row.referenceDocument || row.referenceNumber || '—'}
          </div>
          {row.vehicleRegistrationNumber && (
            <span className="badge bg-light text-secondary border small font-monospace">
              {formatRegNumber(row.vehicleRegistrationNumber)}
            </span>
          )}
          {row.reason && <div className="text-muted extra-small">{row.reason}</div>}
        </div>
      ),
    },
    {
      header: 'Logged By',
      field: 'createdBy',
      render: (row) => (
        <span className="small text-muted">{row.createdBy || row.createdByName || 'SYSTEM'}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Movements Ledger"
        subtitle="Immutable append-only audit trail of parts receipts, issues, workshop usage, and adjustments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory' },
          { label: 'Stock Movements' },
        ]}
      />

      <DataTable
        columns={columns}
        data={movements}
        isLoading={isLoading}
        error={error}
        onRetry={fetchMovements}
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
        emptyTitle="No stock movements recorded"
        emptyDescription="Inventory stock ledger transactions will appear here as purchase invoices are posted or job cards consume spare parts."
      />
    </div>
  );
}

export default StockMovementsPage;
