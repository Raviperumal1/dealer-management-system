import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { brokerService } from '../../services/brokerService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatPhone, formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import {
  Users2,
  Car,
  ShoppingBag,
  CheckCircle2,
  DollarSign,
  HandCoins,
  AlertTriangle,
  Plus,
  Eye,
  ArrowLeft,
} from 'lucide-react';

export function BrokerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canPay = hasPermission('BROKERS', 'PAY');

  const [broker, setBroker] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [listings, setListings] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'settlements'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBrokerData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [brokerData, dashData, listingsData, settlementsData] = await Promise.all([
        brokerService.getBrokerById(id),
        brokerService.getBrokerDashboard(id).catch(() => null),
        brokerService.getBrokerListings(id).catch(() => []),
        brokerService.getSettlements({ brokerId: id, size: 50 }).catch(() => ({ content: [] })),
      ]);

      setBroker(brokerData);
      setDashboard(dashData);
      setListings(listingsData || []);
      setSettlements(settlementsData.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load broker information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokerData();
  }, [id]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Broker Details" subtitle="Loading broker dashboard..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !broker) {
    return (
      <div>
        <PageHeader title="Broker Details" />
        <ErrorState message={error || 'Broker not found'} onRetry={fetchBrokerData} />
      </div>
    );
  }

  const vehicleColumns = [
    {
      header: 'Consigned Vehicle',
      field: 'brand',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.brand} {row.model} ({row.year})</div>
          <div className="text-muted small">
            Reg: <span className="font-monospace">{formatRegNumber(row.registrationNumber)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Asking Price',
      field: 'brokerAskingPrice',
      className: 'text-end',
      render: (row) => <MoneyDisplay amount={row.brokerAskingPrice} className="fw-semibold text-dark" />,
    },
    {
      header: 'Commission Agreement',
      field: 'commissionType',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          {row.commissionType === 'PERCENTAGE'
            ? `${row.commissionValue}%`
            : <MoneyDisplay amount={row.commissionValue} />} ({row.commissionType})
        </span>
      ),
    },
    {
      header: 'Status',
      field: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Listing Date',
      field: 'listingDate',
      render: (row) => formatDate(row.listingDate),
    },
    {
      header: 'Actions',
      field: 'actions',
      className: 'text-end',
      render: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary p-1"
          title="View Vehicle"
          onClick={() => navigate(`/vehicles/${row.vehicleId}`)}
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  const settlementColumns = [
    {
      header: 'Settlement ID',
      field: 'id',
      render: (row) => <span className="fw-bold text-dark font-monospace">#{row.id}</span>,
    },
    {
      header: 'Vehicle',
      field: 'registrationNumber',
      render: (row) => (
        <div>
          <span className="badge bg-light text-dark border font-monospace">
            {formatRegNumber(row.registrationNumber)}
          </span>
          <div className="text-muted small">{row.vehicleName}</div>
        </div>
      ),
    },
    {
      header: 'Broker Payable',
      field: 'brokerPayableAmount',
      className: 'text-end',
      render: (row) => <MoneyDisplay amount={row.brokerPayableAmount} className="fw-bold text-dark" />,
    },
    {
      header: 'Commission',
      field: 'commissionAmount',
      className: 'text-end',
      render: (row) => <MoneyDisplay amount={row.commissionAmount} className="text-warning fw-semibold" />,
    },
    {
      header: 'Paid Amount',
      field: 'paidAmount',
      className: 'text-end',
      render: (row) => <MoneyDisplay amount={row.paidAmount} className="text-success" />,
    },
    {
      header: 'Remaining Balance',
      field: 'remainingBalance',
      className: 'text-end',
      render: (row) => (
        <MoneyDisplay
          amount={row.remainingBalance}
          className={`fw-bold ${Number(row.remainingBalance) > 0 ? 'text-danger' : 'text-muted'}`}
        />
      ),
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
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary p-1"
          title="View Settlement"
          onClick={() => navigate(`/settlements/${row.id}`)}
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={broker.name || broker.fullName || `Broker #${broker.id}`}
        subtitle={`Broker ID: #${broker.id} • ${formatPhone(broker.mobile || broker.mobileNumber)} • ${broker.email || 'No email'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Brokers', href: '/brokers' },
          { label: broker.name || broker.fullName || `Broker #${broker.id}` },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate('/brokers')}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <button
          type="button"
          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          onClick={() => navigate(`/vehicles/new`)}
        >
          <Plus size={14} /> Consign New Vehicle
        </button>
      </PageHeader>

      {/* KPI METRIC CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Listed Vehicles</div>
              <div className="kpi-value text-dark">{dashboard?.listedVehiclesCount ?? listings.length}</div>
              <span className="small text-muted">
                Available: {dashboard?.availableVehiclesCount ?? 0} • Sold: {dashboard?.soldVehiclesCount ?? 0}
              </span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-primary">
              <Car size={20} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Gross Commission</div>
              <div className="kpi-value text-warning">
                <MoneyDisplay amount={dashboard?.totalGrossCommission ?? 0} shorthand />
              </div>
              <span className="small text-muted">Earned from closed sales</span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-warning">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Net Commission</div>
              <div className="kpi-value text-success">
                <MoneyDisplay amount={dashboard?.totalNetCommission ?? 0} shorthand />
              </div>
              <span className="small text-muted">After shop repair deductions</span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-success">
              <HandCoins size={20} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Pending Settlement</div>
              <div className="kpi-value text-danger">
                <MoneyDisplay amount={dashboard?.pendingSettlementAmount ?? 0} shorthand />
              </div>
              <span className="small text-muted">
                Paid: <MoneyDisplay amount={dashboard?.paidSettlementAmount ?? 0} shorthand />
              </span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-danger">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="app-card">
        <div className="app-card-header p-0 px-3 border-bottom">
          <ul className="nav nav-tabs border-0" role="tablist">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-3 border-0 border-bottom border-2 ${
                  activeTab === 'vehicles' ? 'active border-primary text-primary fw-bold' : 'text-muted'
                }`}
                onClick={() => setActiveTab('vehicles')}
              >
                Consigned Vehicles ({listings.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-3 border-0 border-bottom border-2 ${
                  activeTab === 'settlements' ? 'active border-primary text-primary fw-bold' : 'text-muted'
                }`}
                onClick={() => setActiveTab('settlements')}
              >
                Settlements & Payouts ({settlements.length})
              </button>
            </li>
          </ul>
        </div>

        <div className="app-card-body p-0">
          {activeTab === 'vehicles' ? (
            <DataTable
              columns={vehicleColumns}
              data={listings}
              emptyTitle="No consigned vehicles"
              emptyDescription="This broker does not have any consigned vehicle listings yet."
            />
          ) : (
            <DataTable
              columns={settlementColumns}
              data={settlements}
              emptyTitle="No settlement history"
              emptyDescription="No settlement transactions recorded for this broker yet."
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default BrokerDetailPage;
