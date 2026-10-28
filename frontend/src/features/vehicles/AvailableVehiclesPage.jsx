import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import FilterBar from '../../components/common/FilterBar';
import SearchInput from '../../components/common/SearchInput';
import VehicleNavTabs from '../../components/vehicle/VehicleNavTabs';
import { dashboardService } from '../../services/dashboardService';
import { formatRegNumber, formatKilometres, resolveImageUrl } from '../../utils/formatters';
import { Car, Bike, ShoppingCart, CalendarCheck, Eye } from 'lucide-react';

export function AvailableVehiclesPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [typeFilter, setTypeFilter] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('');

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

  const [vehicles, setVehicles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAvailableVehicles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size,
        sortBy,
        sortDirection,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        ownership: ownershipFilter || undefined,
      };

      const res = await vehicleService.getAvailableVehicles(params);
      setVehicles(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load available vehicles');
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
          available: available || totalElements,
        });
      } catch {
        // Fallback
      }
    };
    loadFleetCounts();
  }, [totalElements]);

  useEffect(() => {
    fetchAvailableVehicles();
  }, [page, size, sortBy, sortDirection, debouncedSearch, typeFilter, ownershipFilter]);

  const columns = [
    {
      header: 'Vehicle',
      field: 'brand',
      sortable: true,
      width: '32%',
      minWidth: '200px',
      render: (row) => {
        const photoUrl = row.primaryPhotoUrl || (row.photos && row.photos.length > 0 ? row.photos[0].photoUrl : null);
        const resolvedUrl = resolveImageUrl(photoUrl);

        return (
          <div className="d-flex align-items-center gap-2">
            {resolvedUrl ? (
              <img
                src={resolvedUrl}
                alt={`${row.brand} ${row.model}`}
                className="rounded-3 border object-fit-cover flex-shrink-0"
                style={{ width: '42px', height: '42px' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div
                className={`rounded-3 p-2 d-flex align-items-center justify-content-center flex-shrink-0 ${
                  row.type === 'CAR' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'
                }`}
                style={{ width: '42px', height: '42px' }}
              >
                {row.type === 'CAR' ? <Car size={20} /> : <Bike size={20} />}
              </div>
            )}
            <div className="overflow-hidden min-w-0">
              <div className="fw-bold text-dark text-truncate">{row.brand} {row.model}</div>
              <div className="text-muted small text-truncate">
                {row.manufacturingYear} • {row.fuelType} • {formatKilometres(row.odometerKm)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Registration',
      field: 'registrationNumber',
      sortable: true,
      width: '15%',
      minWidth: '120px',
      render: (row) => (
        <span className="badge bg-light text-dark border font-monospace">
          {formatRegNumber(row.registrationNumber)}
        </span>
      ),
    },
    {
      header: 'Ownership',
      field: 'ownership',
      sortable: true,
      width: '12%',
      minWidth: '95px',
      render: (row) => <StatusBadge status={row.ownership} type="ownership" />,
    },
    {
      header: 'Status',
      field: 'status',
      sortable: true,
      width: '13%',
      minWidth: '100px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Selling Price',
      field: 'sellingPrice',
      sortable: true,
      className: 'text-end',
      width: '14%',
      minWidth: '95px',
      render: (row) => (
        <div className="text-end">
          <MoneyDisplay amount={row.sellingPrice} className="fw-bold text-dark font-monospace" />
        </div>
      ),
    },
    {
      header: 'Commercial Actions',
      field: 'actions',
      className: 'table-actions-cell',
      width: '14%',
      minWidth: '110px',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1"
            title="View Details"
            onClick={() => navigate(`/vehicles/${row.id}`)}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning p-1 d-flex align-items-center gap-1"
            title="Book Vehicle"
            onClick={() => navigate(`/bookings/new?vehicleId=${row.id}`)}
          >
            <CalendarCheck size={14} /> Book
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary p-1 d-flex align-items-center gap-1"
            title="Sell Vehicle"
            onClick={() => navigate(`/sales/new?vehicleId=${row.id}`)}
          >
            <ShoppingCart size={14} /> Sell
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Available Stock"
        subtitle="Ready-for-sale vehicles available for immediate customer reservation or sale"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Vehicles', href: '/vehicles' },
          { label: 'Available Stock' },
        ]}
      />

      <VehicleNavTabs counts={fleetCounts} />

      <FilterBar
        onReset={() => {
          setSearchTerm('');
          setTypeFilter('');
          setOwnershipFilter('');
          resetPagination();
        }}
        hasActiveFilters={Boolean(searchTerm || typeFilter || ownershipFilter)}
      >
        <SearchInput
          placeholder="Search ready vehicles..."
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            resetPagination();
          }}
        />

        <select
          className="form-select form-select-sm"
          style={{ width: '130px' }}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            resetPagination();
          }}
        >
          <option value="">All Types</option>
          <option value="CAR">Cars</option>
          <option value="BIKE">Bikes</option>
        </select>

        <select
          className="form-select form-select-sm"
          style={{ width: '150px' }}
          value={ownershipFilter}
          onChange={(e) => {
            setOwnershipFilter(e.target.value);
            resetPagination();
          }}
        >
          <option value="">All Ownership</option>
          <option value="OWN">Own Inventory</option>
          <option value="BROKER">Broker Consigned</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        error={error}
        onRetry={fetchAvailableVehicles}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        tableLayout="fixed"
        pagination={{
          currentPage: page,
          totalPages,
          totalElements,
          pageSize: size,
          onPageChange: handlePageChange,
          onSizeChange: handleSizeChange,
        }}
        emptyTitle="No available stock"
        emptyDescription="There are currently no vehicles ready for sale."
      />
    </div>
  );
}

export default AvailableVehiclesPage;
