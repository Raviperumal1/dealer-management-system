import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { vehicleService } from '../../services/vehicleService';
import { inspectionService } from '../../services/inspectionService';
import PageHeader from '../../components/common/PageHeader';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import { formatRegNumber, formatKilometres, resolveImageUrl } from '../../utils/formatters';
import {
  ClipboardCheck,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Car,
  Bike,
  ShieldCheck,
  DollarSign,
  Wrench,
  Percent,
} from 'lucide-react';

const INSPECTION_CATEGORIES = [
  {
    categoryTitle: '1. Powertrain & Mechanical Components',
    checkpoints: [
      { name: 'Engine', desc: 'Compression, oil leaks, idle smoothness, exhaust smoke, head gasket' },
      { name: 'Gearbox', desc: 'Gear shift smoothness, synchromesh condition, transmission noise, oil seals' },
      { name: 'Clutch', desc: 'Pedal bite point, slipping under load, shuddering, release bearing' },
      { name: 'Battery', desc: 'Voltage health (>12.4V), terminal corrosion, starter cranking output' },
    ],
  },
  {
    categoryTitle: '2. Suspension, Steering & Braking System',
    checkpoints: [
      { name: 'Tyres', desc: 'Tread depth (>3mm), uneven wear, sidewall cuts, spare tyre condition' },
      { name: 'Brakes', desc: 'Pad & shoe thickness, disc rotor grooves, brake pedal bite, ABS sensors' },
      { name: 'Suspension', desc: 'Front struts, rear shock absorbers, arm bushings, abnormal thuds' },
      { name: 'Steering', desc: 'Rack & pinion play, power steering pump/motor, wheel alignment pull' },
    ],
  },
  {
    categoryTitle: '3. Electricals, Air Conditioning & Cabin Comfort',
    checkpoints: [
      { name: 'AC', desc: 'Cooling pull-down time, compressor clutch, blower speed levels, condenser' },
      { name: 'Electrical', desc: 'Alternator charging (13.8-14.4V), power windows, central locks, starter' },
      { name: 'Lights', desc: 'High/low beam headlights, brake lights, indicators, fog lamps' },
      { name: 'Interior', desc: 'Seat upholstery, dashboard switches, seatbelt retractors, odor/dampness' },
    ],
  },
  {
    categoryTitle: '4. Exterior Body, Paint & Road Testing',
    checkpoints: [
      { name: 'Body', desc: 'Apron structural integrity, pillars, quarter panels alignment, underbody rust' },
      { name: 'Paint', desc: 'Original paint thickness, repainted panels, clear coat peeling, major dents' },
      { name: 'Other', desc: 'Wiper blades, horn, audio system, tool kit, dynamic road test stability' },
    ],
  },
];

export function InspectionCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(searchParams.get('vehicleId') || '');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [inspectorName, setInspectorName] = useState('Senior Quality Inspector');
  const [overallRating, setOverallRating] = useState('4/5 Stars (Good)');
  const [overallRemarks, setOverallRemarks] = useState('');

  // Flattened checkpoint initial state
  const allInitialCheckpoints = INSPECTION_CATEGORIES.flatMap((cat) => cat.checkpoints).map((cp) => ({
    checkpointName: cp.name,
    result: 'GOOD',
    notes: '',
    estimatedCost: 0,
  }));

  const [checkpoints, setCheckpoints] = useState(allInitialCheckpoints);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Load vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await vehicleService.getAllVehicles({ size: 100 });
        const list = res.content || [];
        setVehicles(list);
        if (!selectedVehicleId && list.length > 0) {
          setSelectedVehicleId(String(list[0].id));
        }
      } catch (err) {
        console.error('Failed to load vehicles', err);
      }
    };
    fetchVehicles();
  }, [selectedVehicleId]);

  // Set selected vehicle object
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const found = vehicles.find((v) => String(v.id) === String(selectedVehicleId));
      setSelectedVehicle(found || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedVehicleId, vehicles]);

  const handleCheckpointChange = (checkpointName, field, value) => {
    setCheckpoints((prev) =>
      prev.map((cp) => {
        if (cp.checkpointName === checkpointName) {
          return { ...cp, [field]: value };
        }
        return cp;
      })
    );
  };

  // Live Calculated Stats
  const goodCount = checkpoints.filter((cp) => cp.result === 'GOOD').length;
  const warningCount = checkpoints.filter((cp) => cp.result === 'NEED_REPAIR').length;
  const dangerCount = checkpoints.filter((cp) => cp.result === 'REPLACE').length;
  const naCount = checkpoints.filter((cp) => cp.result === 'NOT_AVAILABLE').length;
  const totalCost = checkpoints.reduce((acc, curr) => acc + (Number(curr.estimatedCost) || 0), 0);
  const passScore = Math.round((goodCount / (checkpoints.length - naCount || 1)) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      setServerError('Please select a vehicle to inspect');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      vehicleId: Number(selectedVehicleId),
      inspectorName: inspectorName || 'Certified Technician',
      inspectionDate: new Date().toISOString().split('T')[0],
      overallRemarks: overallRemarks
        ? `Score: ${passScore}% • Rating: ${overallRating} — ${overallRemarks}`
        : `Score: ${passScore}% • Rating: ${overallRating}`,
      checkpoints: checkpoints.map((cp) => ({
        checkpointName: cp.checkpointName,
        result: cp.result,
        remarks: cp.notes || 'Inspected and verified',
        estimatedCost: Number(cp.estimatedCost || 0),
      })),
    };

    try {
      const res = await inspectionService.createInspection(payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Inspection Completed',
          message: `15-point inspection record #${res.id} saved successfully.`,
        })
      );
      navigate(`/inspections/${res.id}`);
    } catch (err) {
      setServerError(err.message || 'Failed to submit inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCheckpointState = (name) => {
    return checkpoints.find((cp) => cp.checkpointName === name) || { result: 'GOOD', notes: '', estimatedCost: 0 };
  };

  const photoUrl = resolveImageUrl(
    selectedVehicle?.primaryPhotoUrl ||
      (selectedVehicle?.photos && selectedVehicle.photos.length > 0 ? selectedVehicle.photos[0].photoUrl : null)
  );

  return (
    <div>
      <PageHeader
        title="Vehicle Inspection Station"
        subtitle="15-point physical, mechanical, electronic, and safety verification workflow"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inspections', href: '/inspections' },
          { label: 'New Inspection' },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-xs"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </PageHeader>

      {serverError && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3" role="alert">
          <AlertCircle size={16} className="text-danger flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* VEHICLE IDENTIFICATION & INSPECTOR CARD */}
        <div className="app-card p-4 mb-4 border shadow-sm">
          <div className="row g-4 align-items-center">
            {/* Vehicle Selection & Specs */}
            <div className="col-12 col-lg-7">
              <label className="form-label fw-bold text-dark mb-1" htmlFor="vehicleInspectSelect">
                Select Vehicle for Inspection *
              </label>
              <select
                id="vehicleInspectSelect"
                className="form-select form-select-md mb-3"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
              >
                <option value="">Choose vehicle record...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)}) — [{v.ownership} • {v.status}]
                  </option>
                ))}
              </select>

              {selectedVehicle && (
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={selectedVehicle.model}
                      className="rounded-3 border object-fit-cover flex-shrink-0"
                      style={{ width: '64px', height: '64px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-3 p-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: '64px', height: '64px' }}
                    >
                      {selectedVehicle.type === 'CAR' ? <Car size={32} /> : <Bike size={32} />}
                    </div>
                  )}

                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-dark fs-6">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </span>
                      <span className="badge bg-light text-dark border font-monospace">
                        {formatRegNumber(selectedVehicle.registrationNumber)}
                      </span>
                      <span className="badge bg-primary text-white">{selectedVehicle.ownership}</span>
                    </div>
                    <div className="text-muted small">
                      {selectedVehicle.manufacturingYear} • {selectedVehicle.fuelType} • {selectedVehicle.transmission} • {formatKilometres(selectedVehicle.odometerKm || selectedVehicle.odometerReading)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inspector Details */}
            <div className="col-12 col-lg-5 border-start-lg ps-lg-4">
              <div className="row g-2">
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="inspectorInput">
                    Certified Inspector
                  </label>
                  <input
                    id="inspectorInput"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Senior Tech Ramesh"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="overallRatingSelect">
                    Condition Rating
                  </label>
                  <select
                    id="overallRatingSelect"
                    className="form-select form-select-sm"
                    value={overallRating}
                    onChange={(e) => setOverallRating(e.target.value)}
                  >
                    <option value="5/5 Stars (Excellent)">5/5 Stars (Excellent)</option>
                    <option value="4/5 Stars (Good)">4/5 Stars (Good)</option>
                    <option value="3/5 Stars (Fair)">3/5 Stars (Fair)</option>
                    <option value="2/5 Stars (Needs Work)">2/5 Stars (Needs Work)</option>
                    <option value="1/5 Stars (Critical)">1/5 Stars (Critical)</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="overallRemarksInput">
                    Executive Verdict & Notes
                  </label>
                  <input
                    id="overallRemarksInput"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Engine & transmission in excellent health. Minor brake pad wear noted."
                    value={overallRemarks}
                    onChange={(e) => setOverallRemarks(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE HEALTH METRICS & PROGRESS BAR */}
        <div className="app-card p-3 mb-4 bg-white border">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-3">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: '42px',
                    height: '42px',
                    backgroundColor: passScore >= 80 ? '#16A765' : passScore >= 60 ? '#E9A23B' : '#DC4545',
                  }}
                >
                  {passScore}%
                </div>
                <div>
                  <div className="small fw-bold text-dark">Quality Score</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {goodCount} of {checkpoints.length} checks passed
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-5">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Checklist Verification Progress</span>
                <span className="fw-bold text-dark">{checkpoints.length} / 15 Points</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${(goodCount / checkpoints.length) * 100}%` }}
                  title="Passed"
                />
                <div
                  className="progress-bar bg-warning"
                  style={{ width: `${(warningCount / checkpoints.length) * 100}%` }}
                  title="Needs Attention"
                />
                <div
                  className="progress-bar bg-danger"
                  style={{ width: `${(dangerCount / checkpoints.length) * 100}%` }}
                  title="Critical"
                />
              </div>
            </div>

            <div className="col-12 col-md-4 text-md-end">
              <span className="text-muted small d-block">Est. Refurbishment Cost</span>
              <div className="h5 fw-bold text-dark mb-0 font-monospace">
                <MoneyDisplay amount={totalCost} />
              </div>
            </div>
          </div>
        </div>

        {/* 15 CHECKPOINTS GROUPED BY AUTOMOTIVE SYSTEMS */}
        {INSPECTION_CATEGORIES.map((category, catIdx) => (
          <div key={catIdx} className="inspection-card mb-4">
            <div className="inspection-group-header">
              <span>{category.categoryTitle}</span>
              <span className="badge bg-light text-muted border font-monospace">
                {category.checkpoints.length} Checkpoints
              </span>
            </div>

            <div>
              {category.checkpoints.map((cp) => {
                const state = getCheckpointState(cp.name);

                return (
                  <div key={cp.name} className="checkpoint-row">
                    <div className="row g-3 align-items-center">
                      {/* Checkpoint Name & Desc */}
                      <div className="col-12 col-md-4">
                        <div className="fw-bold text-dark fs-6">{cp.name}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {cp.desc}
                        </div>
                      </div>

                      {/* Interactive Condition Selectors */}
                      <div className="col-12 col-md-4">
                        <div className="condition-btn-group w-100 justify-content-start">
                          <button
                            type="button"
                            className={`condition-btn ${state.result === 'GOOD' ? 'active-good' : ''}`}
                            onClick={() => handleCheckpointChange(cp.name, 'result', 'GOOD')}
                          >
                            <CheckCircle2 size={14} /> Good (Pass)
                          </button>

                          <button
                            type="button"
                            className={`condition-btn ${state.result === 'NEED_REPAIR' ? 'active-warning' : ''}`}
                            onClick={() => handleCheckpointChange(cp.name, 'result', 'NEED_REPAIR')}
                          >
                            <AlertTriangle size={14} /> Attention
                          </button>

                          <button
                            type="button"
                            className={`condition-btn ${state.result === 'REPLACE' ? 'active-danger' : ''}`}
                            onClick={() => handleCheckpointChange(cp.name, 'result', 'REPLACE')}
                          >
                            <XCircle size={14} /> Replace
                          </button>

                          <button
                            type="button"
                            className={`condition-btn ${state.result === 'NOT_AVAILABLE' ? 'active-na' : ''}`}
                            onClick={() => handleCheckpointChange(cp.name, 'result', 'NOT_AVAILABLE')}
                          >
                            <MinusCircle size={14} /> N/A
                          </button>
                        </div>
                      </div>

                      {/* Observation Notes & Estimated Cost */}
                      <div className="col-12 col-md-4">
                        <div className="row g-2">
                          <div className="col-8">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder={`Technician notes for ${cp.name}...`}
                              value={state.notes}
                              onChange={(e) => handleCheckpointChange(cp.name, 'notes', e.target.value)}
                            />
                          </div>
                          <div className="col-4">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text px-1">₹</span>
                              <input
                                type="number"
                                className="form-control form-control-sm font-monospace"
                                placeholder="Cost"
                                min="0"
                                value={state.estimatedCost || ''}
                                onChange={(e) =>
                                  handleCheckpointChange(cp.name, 'estimatedCost', Number(e.target.value) || 0)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* BOTTOM ACTION BAR */}
        <div className="app-card p-3 mb-5 bg-white border d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3 text-muted small">
            <div>
              <strong>{goodCount}</strong> Passed
            </div>
            <div>•</div>
            <div>
              <strong className="text-warning">{warningCount}</strong> Need Attention
            </div>
            <div>•</div>
            <div>
              <strong className="text-danger">{dangerCount}</strong> Requires Replacement
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 fw-medium shadow-sm"
              disabled={isSubmitting || !selectedVehicleId}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Finalizing Inspection...
                </>
              ) : (
                <>
                  <Save size={16} /> Submit & Finalize Inspection
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default InspectionCreatePage;
