import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { inspectionService } from '../../services/inspectionService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import { ClipboardCheck, Plus, Eye, Wrench, Car } from 'lucide-react';

export function InspectionListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('WORKSHOP', 'ADD');

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load vehicles for vehicle selector
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await vehicleService.getAllVehicles({ size: 100 });
        setVehicles(res.content || []);
        if (res.content?.length > 0) {
          setSelectedVehicleId(res.content[0].id);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      }
    };
    fetchVehicles();
  }, []);

  // Fetch inspections for selected vehicle
  useEffect(() => {
    if (!selectedVehicleId) return;
    const fetchInspections = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await inspectionService.getInspectionsByVehicle(selectedVehicleId);
        setInspections(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load inspections');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInspections();
  }, [selectedVehicleId]);

  const columns = [
    {
      header: 'Inspection ID',
      field: 'id',
      render: (row) => <span className="fw-bold text-dark font-monospace">#{row.id}</span>,
    },
    {
      header: 'Inspection Date',
      field: 'inspectionDate',
      render: (row) => formatDate(row.inspectionDate),
    },
    {
      header: 'Inspector',
      field: 'inspectorName',
      render: (row) => <span className="fw-semibold text-dark">{row.inspectorName || 'Staff'}</span>,
    },
    {
      header: 'Overall Rating',
      field: 'overallRating',
      render: (row) => {
        const ratingMatch = row.overallRemarks?.match(/Rating:\s*([^—\n]+)/i);
        const rating = row.overallRating || (ratingMatch ? ratingMatch[1].trim() : (row.overallResult || 'Standard Inspection'));
        return (
          <span className="badge bg-primary-subtle text-primary border">
            {rating}
          </span>
        );
      },
    },
    {
      header: 'Checkpoints Checked',
      field: 'checkpoints',
      render: (row) => {
        const count = row.checkpoints?.length || row.checkpointResults?.length || 15;
        return (
          <span className="badge bg-light text-dark border">
            {count} Points
          </span>
        );
      },
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
            title="View Inspection Report"
            onClick={() => navigate(`/inspections/${row.id}`)}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary p-1"
            title="Create Job Card from Inspection"
            onClick={() => navigate(`/job-cards/new?inspectionId=${row.id}&vehicleId=${selectedVehicleId}`)}
          >
            <Wrench size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicle Inspections"
        subtitle="15-point mechanical and physical evaluation checklist"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Workshop' },
          { label: 'Inspections' },
        ]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => navigate(`/inspections/new${selectedVehicleId ? `?vehicleId=${selectedVehicleId}` : ''}`)}
          >
            <Plus size={16} /> New 15-Point Inspection
          </button>
        )}
      </PageHeader>

      {/* Executive Filter & Vehicle Selection Ribbon */}
      <div className="bg-white border rounded-3 p-3 mb-3 shadow-xs d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ borderColor: 'rgba(226, 232, 240, 0.9)' }}>
        <div className="d-flex align-items-center gap-2.5 flex-wrap flex-grow-1">
          <div className="d-flex align-items-center gap-2 text-muted small fw-semibold" style={{ color: '#475569' }}>
            <Car size={16} className="text-primary" />
            <span>Target Vehicle:</span>
          </div>
          <div className="position-relative" style={{ minWidth: '320px', maxWidth: '440px', flex: '1 1 auto' }}>
            <select
              id="vehicleSelectInspection"
              className="form-select form-select-sm fw-medium shadow-none"
              style={{
                height: '38px',
                backgroundColor: '#f8fafc',
                borderColor: '#e2e8f0',
                borderRadius: '10px',
                fontSize: '0.825rem',
              }}
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)}) — [{v.ownership}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedVehicleId && (
          <div className="small text-muted d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border px-2.5 py-1.5 font-monospace">
              {inspections.length} {inspections.length === 1 ? 'Inspection Record' : 'Inspection Records'}
            </span>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={inspections}
        isLoading={isLoading}
        error={error}
        onRetry={() => {}}
        emptyTitle="No inspections found"
        emptyDescription="There are no 15-point inspection reports recorded for this vehicle yet."
        emptyActionLabel={canAdd ? 'Conduct First Inspection' : undefined}
        onEmptyAction={() => navigate(`/inspections/new?vehicleId=${selectedVehicleId}`)}
      />
    </div>
  );
}

export default InspectionListPage;
