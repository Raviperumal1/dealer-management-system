import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceRecordService } from '../../services/serviceRecordService';
import { usePermission } from '../../hooks/usePermission';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import ScheduleServiceModal from './ScheduleServiceModal';
import { Wrench, Calendar, Clock, AlertTriangle, Plus, ArrowUpRight } from 'lucide-react';

export function ServiceDashboardPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('SERVICE', 'ADD');

  const [dueServices, setDueServices] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [overdueServices, setOverdueServices] = useState([]);
  const [historyServices, setHistoryServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Schedule Service Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const fetchServiceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dueData, upData, overData, histData] = await Promise.all([
        serviceRecordService.getDueServices().catch(() => []),
        serviceRecordService.getUpcomingServices(7).catch(() => []),
        serviceRecordService.getOverdueServices().catch(() => []),
        serviceRecordService.getAllServiceRecords({ size: 50 }).catch(() => ({ content: [] })),
      ]);
      setDueServices(dueData || []);
      setUpcomingServices(upData || []);
      setOverdueServices(overData || []);
      setHistoryServices(histData.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load after-sales service schedules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceData();
  }, []);

  // Combine services and compute live status counts based on service/nextService date
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Pool all records from endpoints and history
  const allRawServices = [
    ...dueServices,
    ...upcomingServices,
    ...overdueServices,
    ...historyServices,
  ];

  // De-duplicate by id
  const pooledServices = Array.from(new Map(allRawServices.map((item) => [item.id, item])).values());

  // Helper to determine exact status for any service record
  const determineStatus = (record) => {
    // If explicitly marked completed, it's not overdue or due today
    if (record.status === 'COMPLETED') {
      return 'Completed';
    }

    const dateVal = record.nextServiceDate || record.nextServiceDueDate || record.serviceDate;
    if (!dateVal) return 'Upcoming';

    // Normalize date string (YYYY-MM-DD)
    const targetDateStr = typeof dateVal === 'string' ? dateVal.split('T')[0] : '';
    if (!targetDateStr) return 'Upcoming';

    if (targetDateStr === todayStr) {
      return 'Today';
    } else if (targetDateStr < todayStr) {
      return 'Overdue';
    } else {
      return 'Upcoming';
    }
  };

  const scheduleRows = pooledServices.map((s) => ({
    ...s,
    tagStatus: determineStatus(s),
  }));

  // Calculate live metric counts based on dates & database records
  const todayCount = scheduleRows.filter((s) => s.tagStatus === 'Today').length;
  const overdueCount = scheduleRows.filter((s) => s.tagStatus === 'Overdue').length;
  const dueCount = scheduleRows.filter((s) => s.tagStatus === 'Today' || s.tagStatus === 'Due').length;
  const upcomingCount = scheduleRows.filter((s) => s.tagStatus === 'Upcoming').length;

  const uniqueScheduleRows = scheduleRows;

  const getBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'today':
        return { backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' };
      case 'due':
        return { backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' };
      case 'upcoming':
        return { backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' };
      case 'overdue':
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
      case 'completed':
        return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' };
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState message={error} onRetry={fetchServiceData} />
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Universal Executive Page Header */}
      <PageHeader
        title="Service Management"
        subtitle="Stay ahead of every customer follow-up, scheduled maintenance, and workshop service appointments."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Workshop' },
          { label: 'Service Schedules' },
        ]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Plus size={16} /> Schedule Service
          </button>
        )}
      </PageHeader>

      {/* 4 Metric Cards matching Figma */}
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
              <span className="fs-3 fw-bold text-dark">{todayCount}</span>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
              <span>{todayCount > 0 ? `${todayCount} due today` : 'No services due today'}</span>
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
              <span className="fs-3 fw-bold text-dark">{upcomingCount}</span>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
              <span>{upcomingCount > 0 ? `${upcomingCount} upcoming` : 'None upcoming'}</span>
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
              <span className="fs-3 fw-bold text-dark">{dueCount}</span>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
              <span>{dueCount > 0 ? `${dueCount} follow-up needed` : 'All caught up'}</span>
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
                style={{ width: '32px', height: '32px', backgroundColor: '#fee2e2', color: '#dc2626' }}
              >
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="my-1">
              <span className="fs-3 fw-bold text-dark">{overdueCount}</span>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
              <span>{overdueCount > 0 ? `${overdueCount} require immediate action` : 'No overdue services'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Service Schedule Container Card matching Figma */}
      <div
        className="bg-white border rounded-4 p-4 shadow-none mb-4"
        style={{ borderColor: '#e2e8f0', borderRadius: '20px' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fs-6 fw-bold text-dark mb-0">Service schedule</h2>
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none text-muted p-0 small"
            onClick={() => navigate('/service/new')}
          >
            + Full Service Entry Form
          </button>
        </div>

        {/* List of rounded items like in Figma */}
        <div className="d-flex flex-column gap-3">
          {uniqueScheduleRows.length > 0 ? (
            uniqueScheduleRows.slice(0, 10).map((row, idx) => {
              const customerDisplay = row.customerName || 'Customer';
              const vehicleModelName =
                row.vehicleBrand && row.vehicleModel
                  ? `${row.vehicleBrand} ${row.vehicleModel}`
                  : (row.vehicleName || row.vehicleBrand || 'Vehicle');
              const regNo = row.vehicleRegistrationNumber || row.registrationNumber;
              const vehicleDisplay = `${vehicleModelName} • ${formatRegNumber(regNo)}`;
              const odoVal = row.currentKm ?? row.odometerReading ?? row.nextServiceKm;
              const odoDisplay = odoVal ? `${Number(odoVal).toLocaleString('en-IN')} KM` : '—';
              const serviceDateVal = row.nextServiceDate || row.nextServiceDueDate || row.serviceDate;
              const dateDisplay = formatDate(serviceDateVal);
              const tag = row.tagStatus || 'Upcoming';

              return (
                <div
                  key={row.id || idx}
                  className="bg-white border rounded-4 px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3"
                  style={{
                    borderColor: '#f1f5f9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    borderRadius: '16px',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#f1f5f9')}
                >
                  <div style={{ minWidth: '150px' }}>
                    <span className="fw-semibold text-dark small">{customerDisplay}</span>
                  </div>

                  <div className="text-muted small" style={{ minWidth: '220px' }}>
                    <span>{vehicleDisplay}</span>
                  </div>

                  <div className="text-muted small" style={{ minWidth: '110px' }}>
                    <span>{odoDisplay}</span>
                  </div>

                  <div className="text-muted small" style={{ minWidth: '110px' }}>
                    <span>{dateDisplay}</span>
                  </div>

                  <div>
                    <span
                      className="px-3 py-1 rounded-pill fw-semibold small"
                      style={{ fontSize: '0.75rem', ...getBadgeStyle(tag) }}
                    >
                      {tag}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-5 border rounded-4 bg-light" style={{ borderColor: '#f1f5f9' }}>
              <Wrench size={32} className="text-muted mb-2" />
              <div className="fw-semibold text-dark">No service records found in database</div>
              <p className="text-muted small mb-3">Schedule a service or record a completed service to track follow-ups.</p>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-3"
                onClick={() => setIsScheduleModalOpen(true)}
              >
                + Schedule Service Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Service Modal */}
      <ScheduleServiceModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => fetchServiceData()}
      />
    </div>
  );
}

export default ServiceDashboardPage;
