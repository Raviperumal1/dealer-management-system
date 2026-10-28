import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import StatusBadge from '../../components/common/StatusBadge';
import VehicleNavTabs from '../../components/vehicle/VehicleNavTabs';
import { dashboardService } from '../../services/dashboardService';
import { formatDate } from '../../utils/date';
import { formatRegNumber } from '../../utils/formatters';
import { Plus, Eye, ShoppingCart, DollarSign } from 'lucide-react';

export function PurchasesPage() {
  const navigate = useNavigate();

  const {
    page,
    size,
    sortBy,
    sortDirection,
    handlePageChange,
    handleSizeChange,
    handleSort,
  } = usePagination(0, 10);

  const [vehicles, setVehicles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPurchases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Query vehicles with ownership=OWN
      const res = await vehicleService.getAllVehicles({
        ownership: 'OWN',
        page,
        size,
        sortBy,
        sortDirection,
      });
      setVehicles(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load vehicle purchase records');
    } finally {
      setIsLoading(false);
    }
  };

  const [fleetCounts, setFleetCounts] = useState({ all: 0, own: 0, broker: 0, available: 0 });

  useEffect(() => {
    const loadFleetCounts = async () => {
      try {
        const dash = await dashboardService.getDashboardSummary();
        const own = dash?.inventory?.totalOwnVehicles ?? 0;
        const broker = dash?.inventory?.totalBrokerVehicles ?? 0;
        const available = (dash?.inventory?.availableCars ?? 0) + (dash?.inventory?.availableBikes ?? 0);
        setFleetCounts({
          all: own + broker,
          own,
          broker,
          available,
        });
      } catch {
        // Fallback
      }
    };
    loadFleetCounts();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [page, size, sortBy, sortDirection]);

  const columns = [
    {
      header: 'Vehicle Purchased',
      field: 'brand',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.brand} {row.model} ({row.manufacturingYear})</div>
          <div className="text-muted small">
            Reg: <span className="font-monospace">{formatRegNumber(row.registrationNumber)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Purchase Date',
      field: 'purchaseDate',
      sortable: true,
      render: (row) => {
        const pDate = row.purchaseDate || row.purchase?.purchaseDate || row.createdAt;
        return (
          <span className="text-dark fw-medium">
            {pDate ? formatDate(pDate) : '—'}
          </span>
        );
      },
    },
    {
      header: 'Seller / Vendor',
      field: 'sellerName',
      render: (row) => row.sellerName || row.purchase?.sellerName || 'Direct Owner',
    },
    {
      header: 'Purchase Amount',
      field: 'purchasePrice',
      sortable: true,
      className: 'text-end',
      render: (row) => {
        const amount = row.purchasePrice ?? row.purchase?.purchasePrice ?? row.sellingPrice ?? 0;
        return (
          <div className="text-end">
            <MoneyDisplay amount={amount} className="fw-bold text-primary font-monospace" />
          </div>
        );
      },
    },
    {
      header: 'Target Selling Price',
      field: 'sellingPrice',
      sortable: true,
      className: 'text-end',
      render: (row) => {
        const targetPrice = row.sellingPrice ?? row.purchasePrice ?? 0;
        return (
          <div className="text-end">
            <MoneyDisplay amount={targetPrice} className="fw-semibold text-dark font-monospace" />
          </div>
        );
      },
    },
    {
      header: 'Status',
      field: 'status',
      render: (row) => <StatusBadge status={row.status} />,
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
            title="View Vehicle"
            onClick={() => navigate(`/vehicles/${row.id}`)}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-info p-1"
            title="Costing Breakdown"
            onClick={() => navigate(`/costing?vehicleId=${row.id}`)}
          >
            <DollarSign size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Purchases"
        subtitle="Historical procurement ledger and inventory acquisition records"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Vehicles', href: '/vehicles' },
          { label: 'Purchases' },
        ]}
      >
        <button
          type="button"
          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
          onClick={() => navigate('/vehicles/new')}
        >
          <Plus size={16} /> New Vehicle Purchase
        </button>
      </PageHeader>

      <VehicleNavTabs counts={{ ...fleetCounts, purchases: totalElements }} />

      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        error={error}
        onRetry={fetchPurchases}
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
        emptyTitle="No purchases recorded"
        emptyDescription="There are no own vehicle purchases found in the inventory system."
      />
    </div>
  );
}

export default PurchasesPage;
