import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { vehicleService } from '../../services/vehicleService';
import { customerService } from '../../services/customerService';
import { inventoryService } from '../../services/inventoryService';
import { serviceRecordService } from '../../services/serviceRecordService';
import PageHeader from '../../components/common/PageHeader';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import { formatRegNumber } from '../../utils/formatters';
import { History, Plus, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react';

export function CreateServiceRecordPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometerReading, setOdometerReading] = useState(30000);
  const [customerComplaint, setCustomerComplaint] = useState('Periodic 10,000 km general service');
  const [inspectionNotes, setInspectionNotes] = useState('Engine oil replaced, air filter cleaned, brake pads checked');
  const [labourAmount, setLabourAmount] = useState(1500);

  // Next service reminder
  const defaultNextDate = new Date();
  defaultNextDate.setMonth(defaultNextDate.getMonth() + 6);
  const [nextServiceDueDate, setNextServiceDueDate] = useState(
    defaultNextDate.toISOString().split('T')[0]
  );
  const [nextServiceDueKm, setNextServiceDueKm] = useState(40000);

  // Consumed parts
  const [partsUsed, setPartsUsed] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Derived selected vehicle & total cost calculation
  const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId)) || null;
  const selectedVehiclePurchasePrice = Number(
    selectedVehicle?.sellingPrice ||
    selectedVehicle?.purchasePrice ||
    selectedVehicle?.purchase?.purchasePrice ||
    selectedVehicle?.brokerAskingPrice ||
    0
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehRes, custRes, partsRes] = await Promise.all([
          vehicleService.getAllVehicles({ size: 100 }),
          customerService.getAllCustomers({ size: 100 }),
          inventoryService.getAllParts({ size: 100 }),
        ]);
        setVehicles(vehRes.content || []);
        setCustomers(custRes.content || []);
        setAvailableParts(partsRes.content || []);

        if (custRes.content?.length > 0) setSelectedCustomerId(String(custRes.content[0].id));
        if (vehRes.content?.length > 0) setSelectedVehicleId(String(vehRes.content[0].id));
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    loadData();
  }, []);

  const addPart = () => {
    const defaultPart = availableParts[0];
    const defaultPrice = defaultPart ? (defaultPart.sellingPrice ?? defaultPart.unitPrice ?? defaultPart.purchasePrice ?? 0) : 0;
    setPartsUsed((prev) => [
      ...prev,
      { partId: defaultPart?.id || '', quantity: 1, unitPrice: defaultPrice },
    ]);
  };

  const updatePart = (index, field, val) => {
    setPartsUsed((prev) => {
      const copy = [...prev];
      if (field === 'partId') {
        const found = availableParts.find((p) => String(p.id) === String(val));
        const price = found ? (found.sellingPrice ?? found.unitPrice ?? found.purchasePrice ?? 0) : 0;
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

  const removePart = (index) => {
    setPartsUsed((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPartsAmount = partsUsed.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
    0
  );
  const grandTotal = totalPartsAmount + Number(labourAmount || 0);
  const totalVehicleCalculatedCost = selectedVehiclePurchasePrice + grandTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId) {
      setServerError('Please select customer and vehicle');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      customerId: Number(selectedCustomerId),
      vehicleId: Number(selectedVehicleId),
      serviceDate,
      currentKm: Number(odometerReading || 0),
      customerComplaint,
      inspectionNotes,
      labourAmount: Number(labourAmount || 0),
      nextServiceDate: nextServiceDueDate || null,
      nextServiceKm: nextServiceDueKm ? Number(nextServiceDueKm) : null,
      parts: partsUsed
        .filter((p) => p.partId && p.quantity > 0)
        .map((p) => ({
          partId: Number(p.partId),
          quantity: Number(p.quantity),
          unitPrice: Number(p.unitPrice || 0),
        })),
    };

    try {
      const res = await serviceRecordService.createServiceRecord(payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Service Record Created',
          message: `Service Record #${res.id} saved and parts deducted from inventory stock.`,
        })
      );
      navigate('/service');
    } catch (err) {
      setServerError(err.message || 'Failed to create service record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Record Vehicle Service"
        subtitle="Log periodic maintenance, consume parts from stock, and schedule automatic customer follow-up"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Service', href: '/service' },
          { label: 'New Service' },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate('/service')}
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
        {/* CUSTOMER & VEHICLE */}
        <div className="app-card p-4 mb-4">
          <h2 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
            1. Service Order Details
          </h2>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="srvCustSelect">
                Customer *
              </label>
              <select
                id="srvCustSelect"
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer...</option>
                {customers.map((c) => {
                  const custName = c.name || c.fullName || 'Customer';
                  const custPhone = c.mobile || c.mobileNumber || '';
                  return (
                    <option key={c.id} value={c.id}>
                      {custName} {custPhone ? `(${custPhone})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="srvVehSelect">
                Vehicle *
              </label>
              <select
                id="srvVehSelect"
                className="form-select"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => {
                  const pPrice = v.purchasePrice || v.purchase?.purchasePrice;
                  const priceLabel = pPrice ? ` — Purchase: ₹${pPrice}` : '';
                  return (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)}){priceLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Vehicle Purchase & Total Cost Calculation Banner */}
            {selectedVehicle && (
              <div className="col-12">
                <div className="p-3 bg-light rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-1">
                      {selectedVehicle.ownership === 'OWN' ? 'Own Fleet Vehicle' : 'Broker Vehicle'}
                    </span>
                    <div className="fw-bold text-dark fs-6">
                      {selectedVehicle.brand} {selectedVehicle.model} ({formatRegNumber(selectedVehicle.registrationNumber)})
                    </div>
                    <div className="text-muted small">
                      Approx / Base Price: <span className="fw-semibold text-dark">₹{selectedVehiclePurchasePrice}</span>
                      {selectedVehicle.ownership === 'OWN' ? ' (Capital Asset Base)' : ' (Consignment Basis)'}
                    </div>
                  </div>

                  <div className="text-sm-end">
                    <div className="text-muted small">
                      Base ₹{selectedVehiclePurchasePrice} + Service (Parts ₹{totalPartsAmount} + Labour ₹{Number(labourAmount || 0)})
                    </div>
                    <div className="fs-5 fw-bold text-success font-monospace">
                      Updated Target Selling Price: ₹{totalVehicleCalculatedCost}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="srvDateInput">
                Service Date *
              </label>
              <input
                id="srvDateInput"
                type="date"
                className="form-control"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="srvOdoInput">
                Odometer Reading (KM) *
              </label>
              <input
                id="srvOdoInput"
                type="number"
                className="form-control"
                value={odometerReading}
                onChange={(e) => setOdometerReading(Number(e.target.value))}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="srvLabourInput">
                Labour Charges (₹) *
              </label>
              <input
                id="srvLabourInput"
                type="number"
                className="form-control fw-bold"
                value={labourAmount}
                onChange={(e) => setLabourAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="srvComplaintInput">
                Customer Complaint / Service Scope *
              </label>
              <input
                id="srvComplaintInput"
                type="text"
                className="form-control"
                value={customerComplaint}
                onChange={(e) => setCustomerComplaint(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="srvNotesInput">
                Technician Inspection & Service Notes
              </label>
              <textarea
                id="srvNotesInput"
                className="form-control"
                rows="2"
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* PARTS CONSUMED FROM STOCK */}
        <div className="app-card mb-4">
          <div className="app-card-header">
            <h3 className="app-card-title">2. Consumed Spare Parts (Inventory Deduction)</h3>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={addPart}
            >
              <Plus size={14} /> Add Part
            </button>
          </div>
          <div className="table-responsive">
            <table className="app-table table mb-0">
              <thead>
                <tr>
                  <th>Part Item</th>
                  <th style={{ width: '120px' }}>Quantity</th>
                  <th style={{ width: '150px' }} className="text-end">Unit Price (₹)</th>
                  <th style={{ width: '150px' }} className="text-end">Total</th>
                  <th style={{ width: '40px' }} />
                </tr>
              </thead>
              <tbody>
                {partsUsed.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={p.partId}
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
                    <td className="text-end font-monospace">₹{p.unitPrice}</td>
                    <td className="text-end fw-bold font-monospace">
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
                      No spare parts issued for this service.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* NEXT SERVICE SCHEDULE */}
        <div className="app-card p-4 mb-4 border-info">
          <h2 className="h6 fw-bold text-info text-uppercase mb-3 letter-spacing-wider">
            3. Next Service Schedule & Automatic CRM Reminder
          </h2>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="nextDueDateInput">
                Next Service Target Date *
              </label>
              <input
                id="nextDueDateInput"
                type="date"
                className="form-control"
                value={nextServiceDueDate}
                onChange={(e) => setNextServiceDueDate(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="nextDueKmInput">
                Next Target Odometer (KM)
              </label>
              <input
                id="nextDueKmInput"
                type="number"
                className="form-control"
                value={nextServiceDueKm}
                onChange={(e) => setNextServiceDueKm(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* TOTALS & SUBMIT */}
        <div className="app-card p-4 mb-4 bg-light">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
            <div>
              <div className="text-muted small">
                Parts: <MoneyDisplay amount={totalPartsAmount} /> • Labour: <MoneyDisplay amount={labourAmount} />
              </div>
              <div className="h4 fw-bold text-dark mb-0 font-heading">
                Invoice Total: <MoneyDisplay amount={grandTotal} />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/service')}
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
                    Recording Service...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Service Record
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

export default CreateServiceRecordPage;
