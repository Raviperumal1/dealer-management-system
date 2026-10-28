import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectionService } from '../../services/inspectionService';
import { vehicleService } from '../../services/vehicleService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import { formatDate } from '../../utils/date';
import { formatRegNumber } from '../../utils/formatters';
import {
  ClipboardCheck,
  Wrench,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  Car,
} from 'lucide-react';

export function InspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInspection = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await inspectionService.getInspectionById(id);
      setInspection(data);

      if (data?.vehicleId) {
        try {
          const vehData = await vehicleService.getVehicleById(data.vehicleId);
          setVehicle(vehData);
        } catch (e) {
          console.warn('Could not fetch vehicle details for inspection', e);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load inspection details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
  }, [id]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Inspection Report" subtitle="Loading inspection..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div>
        <PageHeader title="Inspection Report" />
        <ErrorState message={error || 'Inspection report not found'} onRetry={fetchInspection} />
      </div>
    );
  }

  const getResultBadge = (result) => {
    switch (result) {
      case 'GOOD':
      case 'PASS':
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 font-monospace">
            <CheckCircle2 size={13} /> GOOD (Pass)
          </span>
        );
      case 'NEED_REPAIR':
      case 'WARNING':
        return (
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-inline-flex align-items-center gap-1 font-monospace">
            <AlertTriangle size={13} /> NEED ATTENTION
          </span>
        );
      case 'REPLACE':
      case 'FAIL':
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1 font-monospace">
            <XCircle size={13} /> REPLACE
          </span>
        );
      default:
        return <span className="badge bg-secondary-subtle text-secondary font-monospace">N / A</span>;
    }
  };

  const results = inspection.checkpoints || inspection.checkpointResults || [];
  const goodCount = results.filter((cp) => cp.result === 'GOOD' || cp.result === 'PASS').length;
  const warningCount = results.filter((cp) => cp.result === 'NEED_REPAIR' || cp.result === 'WARNING').length;
  const dangerCount = results.filter((cp) => cp.result === 'REPLACE' || cp.result === 'FAIL').length;

  const vehicleTitle = vehicle
    ? `${vehicle.brand} ${vehicle.model} (${vehicle.manufacturingYear || ''})`
    : (inspection.vehicleName || 'Vehicle Record');
  const regNumber = inspection.vehicleRegistrationNumber || inspection.registrationNumber || vehicle?.registrationNumber;

  // Extract rating string if present in remarks
  const ratingMatch = inspection.overallRemarks?.match(/Rating:\s*([^—\n]+)/i);
  const displayRating = inspection.overallRating || (ratingMatch ? ratingMatch[1].trim() : (inspection.overallResult || 'Good'));

  return (
    <div>
      <PageHeader
        title={`15-Point Inspection Report #${inspection.id}`}
        subtitle={`Vehicle: ${vehicleTitle} (${formatRegNumber(regNumber)})`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Workshop' },
          { label: 'Inspections', href: '/inspections' },
          { label: `#${inspection.id}` },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-xs rounded-3"
          onClick={() => navigate('/inspections')}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 shadow-xs rounded-3"
          onClick={() => window.print()}
        >
          <Printer size={14} /> Print Report
        </button>

        {inspection.vehicleId && (
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-xs rounded-3"
            onClick={() =>
              navigate(
                `/job-cards/new?inspectionId=${inspection.id}&vehicleId=${inspection.vehicleId}`
              )
            }
          >
            <Wrench size={14} /> Create Job Card
          </button>
        )}
      </PageHeader>

      {/* Summary Banner */}
      <div className="bg-white rounded-4 p-4 mb-4 border shadow-xs">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-md-3">
            <span className="text-muted small d-block">Inspection Date</span>
            <span className="fw-bold text-dark fs-6">{formatDate(inspection.inspectionDate)}</span>
          </div>

          <div className="col-12 col-md-3">
            <span className="text-muted small d-block">Certified Technician</span>
            <span className="fw-bold text-dark fs-6">{inspection.inspectorName || 'Staff Inspector'}</span>
          </div>

          <div className="col-12 col-md-3">
            <span className="text-muted small d-block">Overall Finding</span>
            <span className="badge bg-primary text-white fs-6 px-3 py-1 mt-1 rounded-pill">
              {displayRating}
            </span>
          </div>

          <div className="col-12 col-md-3">
            <span className="text-muted small d-block">Summary Statistics</span>
            <div className="d-flex align-items-center gap-2 mt-1">
              <span className="badge bg-success-subtle text-success border">{goodCount} Passed</span>
              <span className="badge bg-warning-subtle text-warning border">{warningCount} Attention</span>
              {dangerCount > 0 && <span className="badge bg-danger-subtle text-danger border">{dangerCount} Replace</span>}
            </div>
          </div>

          {inspection.overallRemarks && (
            <div className="col-12 pt-3 border-top">
              <span className="text-muted small d-block fw-semibold">Inspector Observations:</span>
              <p className="text-dark mb-0 small mt-1">{inspection.overallRemarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* 15 Checkpoint Results Table */}
      <div className="bg-white rounded-4 border shadow-xs overflow-hidden">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light-subtle">
          <h3 className="fs-6 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <ClipboardCheck size={18} className="text-primary" /> Detailed 15-Point Checkpoint Findings
          </h3>
          <span className="badge bg-white text-muted border font-monospace">
            {results.length} Checkpoints Evaluated
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr className="small text-uppercase text-muted" style={{ fontSize: '0.75rem' }}>
                <th style={{ width: '50px' }}>#</th>
                <th style={{ width: '240px' }}>Checkpoint Component</th>
                <th style={{ width: '200px' }}>Physical Result</th>
                <th>Inspector Remarks & Rectification Recommendations</th>
                <th style={{ width: '140px' }} className="text-end">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? (
                results.map((cp, idx) => (
                  <tr key={cp.id || idx}>
                    <td className="text-muted fw-bold">{idx + 1}</td>
                    <td className="fw-bold text-dark">{cp.checkpointName}</td>
                    <td>{getResultBadge(cp.result)}</td>
                    <td className="text-muted small">{cp.remarks || cp.notes || 'Standard wear and tear, no immediate defect.'}</td>
                    <td className="text-end">
                      {cp.estimatedCost && Number(cp.estimatedCost) > 0 ? (
                        <MoneyDisplay amount={cp.estimatedCost} className="fw-semibold text-danger" />
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted small">
                    No checkpoint results evaluated for this inspection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InspectionDetailPage;
