import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../../services/salesService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { formatRegNumber, formatPhone } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import {
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  PackageCheck,
  Calendar,
  User,
  Car,
} from 'lucide-react';

export function DeliveryListPage() {
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = usePermission();
  const canViewSales = isAdmin || hasPermission('SALES', 'VIEW');

  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('ALL'); // ALL, DELIVERED, PENDING

  const fetchSalesData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await salesService.getAllSales({
        page,
        size: pageSize,
      });

      let items = res?.content || (Array.isArray(res) ? res : []);
      
      const checkDelivered = (s) =>
        Boolean(
          s.delivery ||
          s.deliveryStatus === 'DELIVERED' ||
          s.delivery?.deliveryStatus === 'DELIVERED' ||
          s.delivered === true ||
          s.status === 'DELIVERED' ||
          s.vehicleStatus === 'DELIVERED'
        );

      // Filter by delivery status if requested
      if (deliveryFilter === 'DELIVERED') {
        items = items.filter(checkDelivered);
      } else if (deliveryFilter === 'PENDING') {
        items = items.filter((s) => !checkDelivered(s));
      }

      // Filter by search query if provided
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter(
          (s) =>
            s.saleNumber?.toLowerCase().includes(q) ||
            s.customerName?.toLowerCase().includes(q) ||
            s.vehicleRegistrationNumber?.toLowerCase().includes(q) ||
            s.vehicleBrand?.toLowerCase().includes(q) ||
            s.vehicleModel?.toLowerCase().includes(q)
        );
      }

      setSales(items);
      setTotalPages(res?.totalPages || 1);
      setTotalElements(res?.totalElements || items.length);
    } catch (err) {
      setError(err.message || 'Failed to load deliveries data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [page, pageSize, deliveryFilter]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(0);
  };

  const checkDelivered = (s) =>
    Boolean(
      s.delivery ||
      s.deliveryStatus === 'DELIVERED' ||
      s.delivery?.deliveryStatus === 'DELIVERED' ||
      s.delivered === true ||
      s.status === 'DELIVERED' ||
      s.vehicleStatus === 'DELIVERED'
    );

  const deliveredCount = sales.filter(checkDelivered).length;
  const pendingCount = sales.length - deliveredCount;

  return (
    <div>
      <PageHeader
        title="Vehicle Deliveries & Handovers"
        subtitle="Track physical customer handovers, odometer readings, and delivery gate passes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/sales' },
          { label: 'Deliveries' },
        ]}
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-4 border-primary h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-medium text-uppercase">Total Sales Orders</span>
                <h4 className="fw-bold mb-0 text-dark">{totalElements}</h4>
              </div>
              <div className="p-3 bg-primary-subtle text-primary rounded-3">
                <Truck size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-medium text-uppercase">Delivered Vehicles</span>
                <h4 className="fw-bold mb-0 text-success">{deliveredCount}</h4>
              </div>
              <div className="p-3 bg-success-subtle text-success rounded-3">
                <PackageCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-medium text-uppercase">Pending Handovers</span>
                <h4 className="fw-bold mb-0 text-warning">{pendingCount}</h4>
              </div>
              <div className="p-3 bg-warning-subtle text-warning rounded-3">
                <Clock size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center justify-content-between">
            <div className="col-12 col-md-5">
              <SearchInput
                placeholder="Search sale #, customer, reg no..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="col-12 col-md-auto d-flex gap-2">
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${deliveryFilter === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setDeliveryFilter('ALL')}
                >
                  All Orders
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${deliveryFilter === 'PENDING' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setDeliveryFilter('PENDING')}
                >
                  Pending Delivery
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${deliveryFilter === 'DELIVERED' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setDeliveryFilter('DELIVERED')}
                >
                  Delivered
                </button>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchSalesData}
                title="Refresh table"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-4">
              <LoadingState rows={5} />
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorState message={error} onRetry={fetchSalesData} />
            </div>
          ) : sales.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Truck}
                title="No deliveries found"
                description="No vehicle sales orders match your selected delivery criteria."
              />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-3">Sale # / Date</th>
                    <th scope="col">Vehicle Details</th>
                    <th scope="col">Customer / Recipient</th>
                    <th scope="col">Sale Type & Total</th>
                    <th scope="col">Payment Status</th>
                    <th scope="col">Delivery Status</th>
                    <th scope="col" className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => {
                    const isDelivered = checkDelivered(sale);
                    const effectivePrice = sale.finalSalePrice ?? sale.totalSalePrice ?? sale.agreedPrice ?? 0;
                    const custContact = sale.customerMobile || sale.customerPhone;
                    const paymentSt = sale.status === 'COMPLETED' ? 'COMPLETED' : (sale.paymentStatus || sale.status || 'PENDING');

                    return (
                      <tr key={sale.id}>
                        <td className="ps-3">
                          <div className="fw-bold text-dark">{sale.saleNumber}</div>
                          <div className="text-muted small">
                            {formatDate(sale.saleDate)}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="p-2 bg-light rounded text-primary">
                              <Car size={18} />
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">
                                {sale.vehicleBrand} {sale.vehicleModel}
                              </div>
                              <div className="small font-monospace text-muted">
                                {formatRegNumber(sale.vehicleRegistrationNumber)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{sale.customerName}</div>
                          <div className="text-muted small">
                            {custContact ? formatPhone(custContact) : '—'}
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className={`badge ${sale.saleType === 'FINANCE' ? 'bg-info-subtle text-info' : 'bg-primary-subtle text-primary'} mb-1`}>
                              {sale.saleType || 'DIRECT'}
                            </span>
                          </div>
                          <MoneyDisplay amount={effectivePrice} className="fw-bold small text-dark" />
                        </td>
                        <td>
                          <StatusBadge status={paymentSt} />
                        </td>
                        <td>
                          {isDelivered ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
                              <CheckCircle2 size={12} /> Delivered
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-inline-flex align-items-center gap-1">
                              <Clock size={12} /> Ready for Delivery
                            </span>
                          )}
                        </td>
                        <td className="text-end pe-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => navigate(`/sales/${sale.id}`)}
                            title="View sale and delivery details"
                          >
                            <Eye size={14} />
                            {isDelivered ? 'View Delivery' : 'Process Delivery'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="card-footer bg-white border-0 py-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryListPage;
