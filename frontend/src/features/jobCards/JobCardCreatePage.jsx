import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { vehicleService } from '../../services/vehicleService';
import { inventoryService } from '../../services/inventoryService';
import { jobCardService } from '../../services/jobCardService';
import PageHeader from '../../components/common/PageHeader';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import { formatRegNumber } from '../../utils/formatters';
import { Wrench, Plus, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react';

import { inspectionService } from '../../services/inspectionService';

export function JobCardCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const prefilledVehicleId = searchParams.get('vehicleId');
  const prefilledInspectionId = searchParams.get('inspectionId');

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(prefilledVehicleId || '');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');

  // Cost Responsibility: SHOP, BROKER, SHARED
  const [costResponsibility, setCostResponsibility] = useState('SHOP');
  const [shopPercentage, setShopPercentage] = useState(50);
  const [brokerPercentage, setBrokerPercentage] = useState(50);

  // Available stock parts
  const [availableParts, setAvailableParts] = useState([]);

  // Line items
  const [tasks, setTasks] = useState(['General mechanical inspection & tuning']);
  const [partsUsed, setPartsUsed] = useState([]);
  const [labourItems, setLabourItems] = useState([
    { description: 'Technician Labour Charge', amount: 1200 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);

  // Load vehicles, active parts catalog, and inspection if prefilled
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const promises = [
          vehicleService.getAllVehicles({ size: 100 }),
          inventoryService.getAllParts({ size: 100 }),
        ];

        if (prefilledInspectionId) {
          promises.push(inspectionService.getInspectionById(prefilledInspectionId).catch(() => null));
        }

        const [vehiclesRes, partsRes, inspRes] = await Promise.all(promises);
        setVehicles(vehiclesRes.content || []);
        const partsList = partsRes.content || [];
        setAvailableParts(partsList);

        const initialVehId = prefilledVehicleId || inspRes?.vehicleId || vehiclesRes.content?.[0]?.id;
        if (initialVehId) {
          setSelectedVehicleId(String(initialVehId));
        }

        if (inspRes) {
          setInspectionData(inspRes);
          setDescription(`Rectification work from Inspection #${inspRes.id} (${inspRes.overallRating || 'Evaluation'})`);
          
          const checkpoints = inspRes.checkpoints || inspRes.checkpointResults || [];
          const issueCheckpoints = checkpoints.filter(
            (c) => c.result === 'REPLACE' || c.result === 'FAIL' || c.result === 'NEED_REPAIR' || c.result === 'WARNING'
          );

          if (issueCheckpoints.length > 0) {
            // Populate tasks from inspection
            const extractedTasks = issueCheckpoints.map(
              (c) => `${c.checkpointName || c.component || 'Component'} - ${c.remarks || c.rectificationNotes || 'Replace / Repair'}`
            );
            setTasks(extractedTasks);

            // Populate spare parts items from inspection recommendations and estimated costs
            const autoParts = issueCheckpoints.map((c) => {
              const compName = (c.checkpointName || c.component || '').toLowerCase();
              const matchedPart = partsList.find((p) => {
                const pName = (p.name || p.partName || '').toLowerCase();
                return pName.includes(compName) || compName.includes(pName);
              });

              const unitPrice = Number(c.estimatedCost || c.costEstimate || 2000);
              return {
                partId: matchedPart ? matchedPart.id : (partsList[0]?.id || null),
                customName: `${c.checkpointName || 'Part'} (${c.remarks || 'Replacement'})`,
                quantity: 1,
                unitPrice: unitPrice,
              };
            });
            setPartsUsed(autoParts);
          }
        }
      } catch (err) {
        console.error('Failed to load initial workshop data', err);
      }
    };
    loadInitialData();
  }, [prefilledVehicleId, prefilledInspectionId]);

  // Update selected vehicle object when selectedVehicleId changes
  useEffect(() => {
    if (!selectedVehicleId) return;
    const v = vehicles.find((item) => String(item.id) === String(selectedVehicleId));
    setSelectedVehicle(v || null);

    // If broker vehicle, default to BROKER or SHARED
    if (v?.ownership === 'BROKER') {
      setCostResponsibility('BROKER');
    } else {
      setCostResponsibility('SHOP');
    }
  }, [selectedVehicleId, vehicles]);

  // Task helpers
  const addTask = () => setTasks((prev) => [...prev, '']);
  const updateTask = (index, val) =>
    setTasks((prev) => prev.map((t, i) => (i === index ? val : t)));
  const removeTask = (index) =>
    setTasks((prev) => prev.filter((_, i) => i !== index));

  // Parts helpers
  const addPart = () => {
    const defaultPart = availableParts[0];
    const defaultPrice = defaultPart ? (defaultPart.sellingPrice ?? defaultPart.unitPrice ?? defaultPart.purchasePrice ?? 0) : 0;
    setPartsUsed((prev) => [
      ...prev,
      { partId: defaultPart?.id || null, quantity: 1, unitPrice: defaultPrice },
    ]);
  };

  const updatePart = (index, field, val) => {
    setPartsUsed((prev) => {
      const copy = [...prev];
      if (field === 'partId') {
        const selectedPart = availableParts.find((p) => String(p.id) === String(val));
        const price = selectedPart ? (selectedPart.sellingPrice ?? selectedPart.unitPrice ?? selectedPart.purchasePrice ?? 0) : 0;
        copy[index] = {
          ...copy[index],
          partId: Number(val),
          unitPrice: price,
        };
      } else {
        copy[index] = { ...copy[index], [field]: Number(val) };
      }
      return copy;
    });
  };

  const removePart = (index) =>
    setPartsUsed((prev) => prev.filter((_, i) => i !== index));

  // Labour helpers
  const addLabour = () =>
    setLabourItems((prev) => [...prev, { description: '', amount: 500 }]);
  const updateLabour = (index, field, val) =>
    setLabourItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: field === 'amount' ? Number(val) : val };
      return copy;
    });
  const removeLabour = (index) =>
    setLabourItems((prev) => prev.filter((_, i) => i !== index));

  // Totals calculations
  const totalPartsCost = partsUsed.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
    0
  );
  const totalLabourCost = labourItems.reduce(
    (sum, l) => sum + (Number(l.amount) || 0),
    0
  );
  const totalCost = totalPartsCost + totalLabourCost;

  // Real-time Vehicle Price & Refurbishment Adjusted Selling Price
  const baseVehiclePrice = Number(
    selectedVehicle?.sellingPrice ||
    selectedVehicle?.purchasePrice ||
    selectedVehicle?.brokerAskingPrice ||
    0
  );
  const updatedSellingPrice = baseVehiclePrice + totalCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      setServerError('Please select a vehicle');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      vehicleId: Number(selectedVehicleId),
      inspectionId: prefilledInspectionId ? Number(prefilledInspectionId) : null,
      assignedStaff: assignedTo || 'Workshop Mechanic',
      startDate: new Date().toISOString().split('T')[0],
      costResponsibility,
      shopCost: costResponsibility === 'SHOP' ? totalCost : costResponsibility === 'SHARED' ? (totalCost * shopPercentage) / 100 : 0,
      brokerCost: costResponsibility === 'BROKER' ? totalCost : costResponsibility === 'SHARED' ? (totalCost * brokerPercentage) / 100 : 0,
      totalCost,
      remarks: description || 'Refurbishment repair job card',
      tasks: tasks.filter(Boolean).map((t) => ({
        taskDescription: typeof t === 'string' ? t : (t.taskDescription || 'Repair task'),
        estimatedCost: 0,
        actualCost: 0,
      })),
      parts: partsUsed
        .filter((p) => p.partId && p.quantity > 0)
        .map((p) => ({
          partId: Number(p.partId),
          quantity: Number(p.quantity),
          unitPrice: Number(p.unitPrice || 0),
        })),
      labour: labourItems
        .filter((l) => l.description && l.amount > 0)
        .map((l) => ({
          description: l.description,
          labourHours: Number(l.hours || 1),
          hourlyRate: Number(l.amount || 0),
        })),
    };

    try {
      const res = await jobCardService.createJobCard(payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Job Card Created',
          message: `Job Card #${res.id} initialized and stock reserved.`,
        })
      );
      navigate(`/job-cards/${res.id}`);
    } catch (err) {
      setServerError(err.message || 'Failed to create job card');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Workshop Job Card"
        subtitle="Schedule repair work, issue parts from inventory, and configure cost allocation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Job Cards', href: '/job-cards' },
          { label: 'New Job Card' },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </PageHeader>

      {serverError && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3">
          <AlertCircle size={16} className="text-danger flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* VEHICLE & ASSIGNMENT */}
        <div className="app-card p-4 mb-4">
          <h2 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
            1. Vehicle & Technician Assignment
          </h2>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="jcVehicleSelect">
                Select Vehicle *
              </label>
              <select
                id="jcVehicleSelect"
                className="form-select"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => {
                  const vPrice = v.sellingPrice || v.purchasePrice || v.brokerAskingPrice || 0;
                  return (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)}) — [{v.ownership}] {vPrice > 0 ? `— Base: ₹${vPrice}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Vehicle Base & Dynamic Selling Price Banner */}
            {selectedVehicle && (
              <div className="col-12">
                <div className="p-3 bg-light rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {selectedVehicle.ownership === 'OWN' ? 'Dealership Owned' : 'Broker Consigned'}
                      </span>
                      <span className="fw-bold text-dark fs-6">
                        {selectedVehicle.brand} {selectedVehicle.model} ({formatRegNumber(selectedVehicle.registrationNumber)})
                      </span>
                    </div>
                    <div className="text-muted small">
                      Approx / Base Price:{' '}
                      <span className="fw-semibold text-dark">
                        <MoneyDisplay amount={baseVehiclePrice} />
                      </span>
                    </div>
                  </div>

                  <div className="text-sm-end">
                    <div className="text-muted small">
                      Base Price (<MoneyDisplay amount={baseVehiclePrice} />) + Refurbishment Repair (<MoneyDisplay amount={totalCost} />)
                    </div>
                    <div className="fs-5 fw-bold text-success font-monospace">
                      Updated Selling Price: <MoneyDisplay amount={updatedSellingPrice} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="assignedMechanicInput">
                Assigned Mechanic / Lead Technician
              </label>
              <input
                id="assignedMechanicInput"
                type="text"
                className="form-control"
                placeholder="e.g. Anand Sharma"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="jcDescInput">
                Job Card Scope / Purpose
              </label>
              <input
                id="jcDescInput"
                type="text"
                className="form-control"
                placeholder="e.g. Pre-sale refurbishing, brake pad replacement and detailing"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* COST RESPONSIBILITY SPLIT */}
        <div className="app-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h6 fw-bold text-dark text-uppercase mb-0 letter-spacing-wider">
              2. Cost Responsibility Split
            </h2>
            {selectedVehicle?.ownership === 'BROKER' && (
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                Broker Consigned Vehicle
              </span>
            )}
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label d-block">Who pays for these refurbishment repairs?</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn btn-outline-primary ${costResponsibility === 'SHOP' ? 'active' : ''}`}
                  onClick={() => setCostResponsibility('SHOP')}
                >
                  Dealership (SHOP)
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-warning ${costResponsibility === 'BROKER' ? 'active' : ''}`}
                  onClick={() => setCostResponsibility('BROKER')}
                >
                  Consigner (BROKER)
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-info ${costResponsibility === 'SHARED' ? 'active' : ''}`}
                  onClick={() => setCostResponsibility('SHARED')}
                >
                  Split (SHARED)
                </button>
              </div>
            </div>

            {costResponsibility === 'SHARED' && (
              <div className="col-12 col-md-6">
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label">Shop %</label>
                    <input
                      type="number"
                      className="form-control"
                      value={shopPercentage}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value)));
                        setShopPercentage(val);
                        setBrokerPercentage(100 - val);
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Broker %</label>
                    <input
                      type="number"
                      className="form-control"
                      value={brokerPercentage}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value)));
                        setBrokerPercentage(val);
                        setShopPercentage(100 - val);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REPAIR TASKS */}
        <div className="app-card mb-4">
          <div className="app-card-header">
            <h3 className="app-card-title">3. Repair Tasks Checklist</h3>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={addTask}
            >
              <Plus size={14} /> Add Task
            </button>
          </div>
          <div className="app-card-body">
            <div className="d-flex flex-column gap-2">
              {tasks.map((task, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2">
                  <span className="text-muted small fw-bold" style={{ width: '20px' }}>
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Enter repair task description..."
                    value={task}
                    onChange={(e) => updateTask(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger p-1"
                    onClick={() => removeTask(idx)}
                    title="Remove task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PARTS USED FROM INVENTORY */}
        <div className="app-card mb-4">
          <div className="app-card-header">
            <h3 className="app-card-title">4. Spare Parts Consumed (Inventory)</h3>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={addPart}
            >
              <Plus size={14} /> Issue Part from Stock
            </button>
          </div>
          <div className="table-responsive">
            <table className="app-table table mb-0">
              <thead>
                <tr>
                  <th>Parts</th>
                  <th style={{ width: '120px' }}>Quantity</th>
                  <th style={{ width: '150px' }} className="text-end">Unit Price</th>
                  <th style={{ width: '150px' }} className="text-end">Line Total</th>
                  <th style={{ width: '50px' }} />
                </tr>
              </thead>
              <tbody>
                {partsUsed.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={p.partId || ''}
                        onChange={(e) => updatePart(idx, 'partId', e.target.value)}
                      >
                        <option value="">Select stock part...</option>
                        {availableParts.map((item) => {
                          const partTitle = item.name || item.partName || item.sku || 'Spare Part';
                          const stockCount = item.currentStock ?? item.stockQuantity ?? 0;
                          const price = item.sellingPrice ?? item.unitPrice ?? item.purchasePrice ?? 0;
                          const skuCode = item.sku || item.partNumber;

                          return (
                            <option key={item.id} value={item.id}>
                              {partTitle} {skuCode ? `(${skuCode})` : ''} — Stock: {stockCount} {item.unit || 'PCS'} — ₹{price}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="1"
                        value={p.quantity}
                        onChange={(e) => updatePart(idx, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="text-end">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end font-monospace"
                          value={p.unitPrice}
                          onChange={(e) => updatePart(idx, 'unitPrice', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="text-end fw-bold font-monospace align-middle">
                      ₹{(p.quantity || 0) * (p.unitPrice || 0)}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => removePart(idx)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {partsUsed.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted small py-3">
                      No spare parts added to this job card yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LABOUR CHARGES */}
        <div className="app-card mb-4">
          <div className="app-card-header">
            <h3 className="app-card-title">5. Labour Charges</h3>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={addLabour}
            >
              <Plus size={14} /> Add Labour Item
            </button>
          </div>
          <div className="table-responsive">
            <table className="app-table table mb-0">
              <thead>
                <tr>
                  <th>Labour / Work Description</th>
                  <th style={{ width: '180px' }} className="text-end">Amount (₹)</th>
                  <th style={{ width: '50px' }} />
                </tr>
              </thead>
              <tbody>
                {labourItems.map((l, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Brake pad installation & alignment"
                        value={l.description}
                        onChange={(e) => updateLabour(idx, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end fw-bold"
                        value={l.amount}
                        onChange={(e) => updateLabour(idx, 'amount', e.target.value)}
                      />
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => removeLabour(idx)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUMMARY TOTALS & SELLING PRICE ADJUSTMENT & SUBMISSION */}
        <div className="app-card p-4 mb-4 bg-light border-2">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
            <div>
              <div className="text-muted small">
                Spare Parts: <MoneyDisplay amount={totalPartsCost} /> • Labour Work: <MoneyDisplay amount={totalLabourCost} />
              </div>
              <div className="h4 fw-bold text-dark mb-1 font-heading">
                Total Repair Cost: <MoneyDisplay amount={totalCost} />
              </div>

              {selectedVehicle && (
                <div className="d-inline-flex align-items-center gap-2 mt-2 px-3 py-2 bg-white rounded border border-success-subtle shadow-sm">
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Selling Price Impact
                  </span>
                  <span className="small text-muted">
                    Approx/Base Price: <strong className="text-dark"><MoneyDisplay amount={baseVehiclePrice} /></strong> + Repair: <strong className="text-dark"><MoneyDisplay amount={totalCost} /></strong> =
                  </span>
                  <span className="fw-bold text-success fs-6 font-monospace">
                    Updated Selling Price: <MoneyDisplay amount={updatedSellingPrice} />
                  </span>
                </div>
              )}
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
                className="btn btn-primary d-flex align-items-center gap-2 px-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Creating Job Card...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save & Issue Job Card
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default JobCardCreatePage;
