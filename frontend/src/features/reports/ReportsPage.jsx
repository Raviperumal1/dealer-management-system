import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { reportService } from '../../services/reportService';
import { serviceRecordService } from '../../services/serviceRecordService';
import { usePermission } from '../../hooks/usePermission';
import DataTable from '../../components/common/DataTable';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import {
  Wrench,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronRight,
  Car,
  TrendingUp,
  Package,
  IndianRupee,
  FileText,
  FileSpreadsheet,
  Download,
  CalendarDays,
  X,
} from 'lucide-react';

export function ReportsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasPermission, isAdmin } = usePermission();
  const canExport = isAdmin || hasPermission('REPORTS', 'EXPORT');

  // Currently selected report or drilldown
  const [activeReport, setActiveReport] = useState('vehicles'); // 'vehicles' | 'sales' | 'profit' | 'brokers' | 'stock' | 'service'
  const [selectedReportTitle, setSelectedReportTitle] = useState('Vehicle Inventory');
  const [showTableModal, setShowTableModal] = useState(false);

  // Date filters (defaults to current month)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [fromDate, setFromDate] = useState(firstDay.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Live KPI statistics fetched from Database
  const [kpiStats, setKpiStats] = useState({
    today: 0,
    upcoming: 0,
    due: 0,
    overdue: 0,
  });

  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        const [dueList, upcomingList, overdueList] = await Promise.all([
          serviceRecordService.getDueServices().catch(() => []),
          serviceRecordService.getUpcomingServices(7).catch(() => []),
          serviceRecordService.getOverdueServices().catch(() => []),
        ]);
        setKpiStats({
          today: dueList?.length || 0,
          upcoming: upcomingList?.length || 0,
          due: dueList?.length || 0,
          overdue: overdueList?.length || 0,
        });
      } catch (err) {
        // Fallback gracefully without throwing
        console.error('Failed to load KPI statistics', err);
      }
    };
    fetchKpiData();
  }, []);

  // Load report data when requested
  const fetchReportData = async (reportType) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { fromDate, toDate };
      let res = [];

      switch (reportType) {
        case 'vehicles':
        case 'available-vehicles':
          res = await reportService.getVehicleReport();
          break;
        case 'sales':
        case 'daily-sales':
        case 'monthly-sales':
          res = await reportService.getSalesReport(params);
          break;
        case 'profit':
        case 'own-profit':
        case 'net-commission':
          res = await reportService.getProfitReport(params);
          break;
        case 'brokers':
        case 'broker-commission':
        case 'pending-settlement':
          res = await reportService.getBrokerReport(params);
          break;
        case 'stock':
        case 'stock-movement':
        case 'low-stock':
          res = await reportService.getStockReport();
          break;
        case 'service':
        case 'service-due':
        case 'customer-history':
          res = await reportService.getServiceReport(params);
          break;
        default:
          res = await reportService.getVehicleReport();
      }
      setData(res || []);
    } catch (err) {
      setError(err.message || 'Failed to generate report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (reportType, title) => {
    setActiveReport(reportType);
    setSelectedReportTitle(title);
    setShowTableModal(true);
    fetchReportData(reportType);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await reportService.exportPdf(activeReport, { fromDate, toDate });
      dispatch(
        addToast({
          type: 'success',
          title: 'PDF Export Ready',
          message: `${selectedReportTitle} report exported successfully.`,
        })
      );
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Export failed' }));
    } finally {
      setIsExporting(false);
    }
  };

  // Dynamic columns depending on active report
  const getColumns = () => {
    switch (activeReport) {
      case 'vehicles':
      case 'available-vehicles':
        return [
          {
            header: 'Vehicle',
            field: 'brand',
            render: (r) => `${r.brand || ''} ${r.model || ''}`.trim() || r.vehicleName || 'Vehicle',
          },
          {
            header: 'Reg No',
            field: 'registrationNumber',
            render: (r) => formatRegNumber(r.registrationNumber || r.vehicleRegistrationNumber),
          },
          {
            header: 'Type',
            field: 'vehicleType',
            render: (r) => r.vehicleType || r.type || '—',
          },
          {
            header: 'Ownership',
            field: 'ownershipType',
            render: (r) => (
              <span className={`badge ${r.ownershipType === 'OWN' || r.ownership === 'OWN' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning'} border`}>
                {r.ownershipType || r.ownership || '—'}
              </span>
            ),
          },
          {
            header: 'Odometer',
            field: 'odometerReading',
            render: (r) => (r.odometerReading ? `${Number(r.odometerReading).toLocaleString('en-IN')} km` : '—'),
          },
          {
            header: 'Status',
            field: 'status',
            render: (r) => (
              <span className="badge bg-light text-dark border">
                {r.status || 'AVAILABLE'}
              </span>
            ),
          },
          {
            header: 'Price / Value',
            field: 'purchasePriceOrAskingPrice',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.purchasePriceOrAskingPrice ?? r.sellingPrice ?? 0} />,
          },
        ];
      case 'sales':
      case 'daily-sales':
      case 'monthly-sales':
        return [
          { header: 'Sale Order', field: 'saleId', render: (r) => `#${r.saleId || r.id}` },
          { header: 'Date', field: 'saleDate', render: (r) => formatDate(r.saleDate) },
          { header: 'Customer', field: 'customerName' },
          {
            header: 'Reg No',
            field: 'vehicleRegistrationNumber',
            render: (r) => formatRegNumber(r.vehicleRegistrationNumber || r.registrationNumber),
          },
          {
            header: 'Channel',
            field: 'saleType',
            render: (r) => (
              <span className={`badge ${r.saleType === 'DIRECT' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'} border`}>
                {r.saleType || 'DIRECT'}
              </span>
            ),
          },
          {
            header: 'Sale Price',
            field: 'finalSalePrice',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.finalSalePrice ?? r.agreedPrice ?? r.salePrice ?? 0} />,
          },
          {
            header: 'Paid Amount',
            field: 'totalPaid',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.totalPaid ?? r.paidAmount ?? 0} className="text-success" />,
          },
          {
            header: 'Balance Due',
            field: 'balanceDue',
            className: 'text-end',
            render: (r) => (
              <MoneyDisplay
                amount={r.balanceDue ?? r.balanceAmount ?? 0}
                className={Number(r.balanceDue ?? r.balanceAmount ?? 0) > 0 ? 'text-danger fw-bold' : 'text-muted'}
              />
            ),
          },
          {
            header: 'Status',
            field: 'status',
            render: (r) => (
              <span className="badge bg-light text-dark border">
                {r.status || 'COMPLETED'}
              </span>
            ),
          },
        ];
      case 'profit':
      case 'own-profit':
      case 'net-commission':
        return [
          {
            header: 'Vehicle',
            field: 'registrationNumber',
            render: (r) => (
              <div>
                <div className="fw-semibold text-dark">
                  {r.vehicleBrand && r.vehicleModel ? `${r.vehicleBrand} ${r.vehicleModel}` : (r.vehicleName || 'Vehicle')}
                </div>
                <div className="text-muted small font-monospace">
                  {formatRegNumber(r.registrationNumber || r.vehicleRegistrationNumber)}
                </div>
              </div>
            ),
          },
          {
            header: 'Ownership',
            field: 'ownershipType',
            render: (r) => (
              <span className={`badge ${r.ownershipType === 'OWN' || r.ownership === 'OWN' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning'} border`}>
                {r.ownershipType || r.ownership || '—'}
              </span>
            ),
          },
          { header: 'Sale Date', field: 'saleDate', render: (r) => formatDate(r.saleDate) },
          {
            header: 'Sale Price',
            field: 'sellingPrice',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.sellingPrice ?? r.salePrice ?? 0} />,
          },
          {
            header: 'Cost / Settlement Basis',
            field: 'totalCostOrSettlementBasis',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.totalCostOrSettlementBasis ?? r.totalCost ?? 0} />,
          },
          {
            header: 'Repairs & Prep',
            field: 'shopRepairsAndExpenses',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.shopRepairsAndExpenses ?? 0} />,
          },
          {
            header: 'Gross Profit / Net Comm',
            field: 'recognizedGrossProfitOrNetCommission',
            className: 'text-end fw-bold',
            render: (r) => (
              <MoneyDisplay
                amount={r.recognizedGrossProfitOrNetCommission ?? r.grossProfit ?? r.netCommission ?? 0}
                className="text-success fw-bold"
              />
            ),
          },
        ];
      case 'brokers':
      case 'broker-commission':
      case 'pending-settlement':
        return [
          {
            header: 'Broker',
            field: 'brokerName',
            render: (r) => (
              <div>
                <div className="fw-semibold text-dark">{r.brokerName || 'Consigner'}</div>
                <div className="text-muted small">{r.brokerMobile || '—'}</div>
              </div>
            ),
          },
          {
            header: 'Vehicle Reg',
            field: 'vehicleRegistrationNumber',
            render: (r) => formatRegNumber(r.vehicleRegistrationNumber || r.registrationNumber),
          },
          {
            header: 'Sale Amount',
            field: 'saleAmount',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.saleAmount ?? r.salePrice ?? 0} />,
          },
          {
            header: 'Settlement Basis',
            field: 'brokerSettlementBasis',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.brokerSettlementBasis ?? r.brokerPayableAmount ?? 0} />,
          },
          {
            header: 'Gross Comm',
            field: 'grossCommission',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.grossCommission ?? r.commissionAmount ?? 0} />,
          },
          {
            header: 'Repair Deduction',
            field: 'shopRepairDeduction',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.shopRepairDeduction ?? 0} className="text-muted" />,
          },
          {
            header: 'Net Commission',
            field: 'netCommission',
            className: 'text-end fw-bold text-success',
            render: (r) => <MoneyDisplay amount={r.netCommission ?? 0} />,
          },
          {
            header: 'Remaining Balance',
            field: 'balanceToBroker',
            className: 'text-end',
            render: (r) => (
              <MoneyDisplay
                amount={r.balanceToBroker ?? r.remainingBalance ?? 0}
                className={Number(r.balanceToBroker ?? r.remainingBalance ?? 0) > 0 ? 'text-danger fw-bold' : 'text-muted'}
              />
            ),
          },
        ];
      case 'stock':
      case 'stock-movement':
      case 'low-stock':
        return [
          {
            header: 'Part / Item',
            field: 'name',
            render: (r) => (
              <div>
                <div className="fw-semibold text-dark">{r.name || r.partName || 'Spare Part'}</div>
                <div className="text-muted small font-monospace">{r.partNumber || '—'}</div>
              </div>
            ),
          },
          { header: 'Category', field: 'category' },
          {
            header: 'Current Stock',
            field: 'currentStock',
            render: (r) => (
              <span className={`badge ${r.isLowStock || (r.currentStock <= (r.minStockThreshold || 5)) ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} border`}>
                {(r.currentStock ?? r.stockQuantity ?? 0)} {r.unit || 'units'}
              </span>
            ),
          },
          {
            header: 'Threshold',
            field: 'minStockThreshold',
            render: (r) => r.minStockThreshold ?? r.minStockLevel ?? 5,
          },
          {
            header: 'Unit Price',
            field: 'purchasePrice',
            className: 'text-end',
            render: (r) => <MoneyDisplay amount={r.purchasePrice ?? r.unitPrice ?? 0} />,
          },
          {
            header: 'Total Value',
            field: 'inventoryValue',
            className: 'text-end fw-bold',
            render: (r) => <MoneyDisplay amount={r.inventoryValue ?? r.totalValuation ?? 0} />,
          },
        ];
      case 'service':
      case 'service-due':
      case 'customer-history':
        return [
          {
            header: 'Service Ref',
            field: 'serviceNumber',
            render: (r) => (
              <div>
                <span className="font-monospace fw-bold text-dark">{r.serviceNumber || `#${r.serviceId || r.id}`}</span>
                <div className="text-muted small">{formatDate(r.serviceDate)}</div>
              </div>
            ),
          },
          {
            header: 'Customer',
            field: 'customerName',
            render: (r) => (
              <div>
                <div className="fw-semibold text-dark">{r.customerName || 'Customer'}</div>
                <div className="text-muted small">{r.customerMobile || '—'}</div>
              </div>
            ),
          },
          {
            header: 'Vehicle Reg',
            field: 'vehicleRegistrationNumber',
            render: (r) => formatRegNumber(r.vehicleRegistrationNumber || r.registrationNumber),
          },
          {
            header: 'Odometer',
            field: 'currentKm',
            render: (r) => (r.currentKm ? `${Number(r.currentKm).toLocaleString('en-IN')} km` : '—'),
          },
          {
            header: 'Next Service Due',
            field: 'nextServiceDate',
            render: (r) => formatDate(r.nextServiceDate || r.nextServiceDueDate),
          },
          {
            header: 'Amount',
            field: 'totalAmount',
            className: 'text-end fw-bold',
            render: (r) => <MoneyDisplay amount={r.totalAmount || 0} />,
          },
          {
            header: 'Status',
            field: 'status',
            render: (r) => (
              <span className="badge bg-light text-dark border">
                {r.status || 'COMPLETED'}
              </span>
            ),
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Top Header matching Figma */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1 font-heading" style={{ fontSize: '1.65rem' }}>
            Reports center
          </h1>
          <p className="text-muted small mb-0">Operational, sales and profitability insights.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* This Month pill button */}
          <div
            className="d-flex align-items-center gap-2 bg-white border px-3 py-2 rounded-3 text-muted small fw-medium"
            style={{ borderColor: '#e2e8f0', cursor: 'pointer' }}
          >
            <CalendarDays size={16} />
            <span>This Month</span>
          </div>

          {/* Export PDF primary button */}
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-sm fw-semibold"
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', fontSize: '0.875rem' }}
            onClick={handleExportPdf}
            disabled={isExporting}
          >
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards matching Figma */}
      <div className="row g-3 mb-4">
        {/* Today's service */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="bg-white rounded-4 p-3 border shadow-none h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#e2e8f0', borderRadius: '16px' }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-dark fw-medium small">Today's service</span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', backgroundColor: '#eff6ff', color: '#2563eb' }}
              >
                <Wrench size={16} />
              </div>
            </div>
            <div className="my-1">
              <span className="fs-3 fw-bold text-dark">{kpiStats.today}</span>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
              <span>{kpiStats.today > 0 ? `${kpiStats.today} due today` : 'No services due today'}</span>
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="bg-white rounded-4 p-3 border shadow-none h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#e2e8f0', borderRadius: '16px' }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-dark fw-medium small">Upcoming</span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', backgroundColor: '#eff6ff', color: '#2563eb' }}
              >
                <Calendar size={16} />
              </div>
            </div>
            <div className="my-1">
              <span className="fs-3 fw-bold text-dark">{kpiStats.upcoming}</span>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
              <span>{kpiStats.upcoming > 0 ? `${kpiStats.upcoming} in next 7 days` : 'None in next 7 days'}</span>
            </div>
          </div>
        </div>

        {/* Due */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="bg-white rounded-4 p-3 border shadow-none h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#e2e8f0', borderRadius: '16px' }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-dark fw-medium small">Due</span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', backgroundColor: '#eff6ff', color: '#0284c7' }}
              >
                <Clock size={16} />
              </div>
            </div>
            <div className="my-1">
              <span className="fs-3 fw-bold text-dark">{kpiStats.due}</span>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
              <span>{kpiStats.due > 0 ? 'Follow up needed' : 'All caught up'}</span>
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="bg-white rounded-4 p-3 border shadow-none h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#e2e8f0', borderRadius: '16px' }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-dark fw-medium small">Overdue</span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', backgroundColor: '#fef3c7', color: '#d97706' }}
              >
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="my-1">
              <span className="fs-3 fw-bold text-dark">{kpiStats.overdue}</span>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
              <span>{kpiStats.overdue > 0 ? 'Immediate action' : 'No overdue services'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Quadrant Grid of Report Groups matching Figma */}
      <div className="row g-4">
        {/* Quadrant 1: Service schedule */}
        <div className="col-12 col-lg-6">
          <div
            className="bg-white border rounded-4 p-4 shadow-none h-100"
            style={{ borderColor: '#e2e8f0', borderRadius: '20px' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="fs-6 fw-bold text-dark mb-0">Service schedule</h2>
              <div className="text-primary">
                <Car size={18} />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('vehicles', 'Own Inventory')}
                >
                  <span className="small fw-medium text-dark">Own inventory</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('vehicles', 'Broker Inventory')}
                >
                  <span className="small fw-medium text-dark">Broker inventory</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('vehicles', 'Available Vehicles')}
                >
                  <span className="small fw-medium text-dark">Available vehicles</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('vehicles', 'Vehicle History')}
                >
                  <span className="small fw-medium text-dark">Vehicle history</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quadrant 2: Sales reports */}
        <div className="col-12 col-lg-6">
          <div
            className="bg-white border rounded-4 p-4 shadow-none h-100"
            style={{ borderColor: '#e2e8f0', borderRadius: '20px' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="fs-6 fw-bold text-dark mb-0">Sales reports</h2>
              <div className="text-primary">
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('sales', 'Daily Sales')}
                >
                  <span className="small fw-medium text-dark">Daily sales</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('sales', 'Monthly Sales')}
                >
                  <span className="small fw-medium text-dark">Monthly sales</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('sales', 'Direct vs Finance')}
                >
                  <span className="small fw-medium text-dark">Direct vs finance</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('sales', 'Cars vs Bikes')}
                >
                  <span className="small fw-medium text-dark">Cars vs bikes</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quadrant 3: Profit & commission */}
        <div className="col-12 col-lg-6">
          <div
            className="bg-white border rounded-4 p-4 shadow-none h-100"
            style={{ borderColor: '#e2e8f0', borderRadius: '20px' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="fs-6 fw-bold text-dark mb-0">Profit & commission</h2>
              <div className="text-primary">
                <IndianRupee size={18} />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('profit', 'Own Vehicle Profit')}
                >
                  <span className="small fw-medium text-dark">Own vehicle profit</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('profit', 'Broker Commission')}
                >
                  <span className="small fw-medium text-dark">Broker commission</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('profit', 'Net Commission')}
                >
                  <span className="small fw-medium text-dark">Net commission</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('brokers', 'Pending Settlement')}
                >
                  <span className="small fw-medium text-dark">Pending settlement</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quadrant 4: Stock & service */}
        <div className="col-12 col-lg-6">
          <div
            className="bg-white border rounded-4 p-4 shadow-none h-100"
            style={{ borderColor: '#e2e8f0', borderRadius: '20px' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="fs-6 fw-bold text-dark mb-0">Stock & service</h2>
              <div className="text-primary">
                <Package size={18} />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('stock', 'Stock Movement')}
                >
                  <span className="small fw-medium text-dark">Stock movement</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('stock', 'Low Stock')}
                >
                  <span className="small fw-medium text-dark">Low stock</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('service', 'Service Due')}
                >
                  <span className="small fw-medium text-dark">Service due</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className="btn bg-white border rounded-3 p-3 w-100 text-start d-flex justify-content-between align-items-center"
                  style={{ borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  onClick={() => handleCardClick('service', 'Customer History')}
                >
                  <span className="small fw-medium text-dark">Customer history</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down Modal / Slide-out to view detailed table */}
      {showTableModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg rounded-4 bg-white overflow-hidden">
              {/* Header: Title on left, 'X' close button on top right */}
              <div className="modal-header border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="modal-title fw-bold text-dark fs-5 mb-0">{selectedReportTitle} Report</h5>
                  <p className="text-muted small mb-0">Showing records for active period</p>
                </div>
                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border-0 rounded-circle d-flex align-items-center justify-content-center p-2 text-muted"
                    style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                    aria-label="Close"
                    onClick={() => setShowTableModal(false)}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body: Data table */}
              <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <DataTable
                  columns={getColumns()}
                  data={data}
                  isLoading={isLoading}
                  error={error}
                  onRetry={() => fetchReportData(activeReport)}
                  emptyTitle="No report records"
                  emptyDescription="There are no data records available for this selected report."
                />
              </div>

              {/* Footer: Simple Cancel and Export PDF buttons */}
              <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-end align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3 py-1.5 rounded-3 fw-medium"
                  onClick={() => setShowTableModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 fw-medium"
                  style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                  onClick={handleExportPdf}
                  disabled={isExporting}
                >
                  <Download size={15} /> {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
