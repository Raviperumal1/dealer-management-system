import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { vehicleService } from '../../services/vehicleService';
import { customerService } from '../../services/customerService';
import { serviceRecordService } from '../../services/serviceRecordService';
import { formatRegNumber } from '../../utils/formatters';
import { X, Calendar } from 'lucide-react';

export function ScheduleServiceModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch();

  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('Periodic service');
  const [priority, setPriority] = useState('Urgent');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('9:00 AM to 11:00 AM');
  const [currentOdometer, setCurrentOdometer] = useState(31000);
  const [nextServiceDue, setNextServiceDue] = useState('Auto-suggested');
  const [mechanic, setMechanic] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(3500);
  const [notes, setNotes] = useState('');
  const [sendReminder, setSendReminder] = useState(true);
  const [reminderTiming, setReminderTiming] = useState('1 day before');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      try {
        const [vehRes, custRes] = await Promise.all([
          vehicleService.getAllVehicles({ size: 100 }),
          customerService.getAllCustomers({ size: 100 }),
        ]);
        const vList = vehRes.content || [];
        const cList = custRes.content || [];
        setVehicles(vList);
        setCustomers(cList);
        if (cList.length > 0 && !selectedCustomerId) setSelectedCustomerId(String(cList[0].id));
        if (vList.length > 0 && !selectedVehicleId) setSelectedVehicleId(String(vList[0].id));
      } catch (err) {
        console.error('Failed to load customers or vehicles for scheduling', err);
      }
    };
    loadData();
  }, [isOpen]);

  const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId)) || null;

  // Sync vehicle odometer reading and next service km whenever selected vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      const vOdo = selectedVehicle.odometerReading || 0;
      setCurrentOdometer(vOdo);
      const nextKm = vOdo + 10000;
      setNextServiceDue(nextKm > 0 ? `${nextKm.toLocaleString('en-IN')} KM` : 'Auto-suggested');
    }
  }, [selectedVehicleId, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId) {
      setModalError('Please select both Customer and Vehicle.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const odoNum = Number(currentOdometer || 0);
      const payload = {
        customerId: Number(selectedCustomerId),
        vehicleId: Number(selectedVehicleId),
        serviceDate: scheduledDate,
        currentKm: odoNum,
        customerComplaint: `${serviceType} (${priority} priority) - Slot: ${timeSlot}${notes ? ' - ' + notes : ''}`,
        inspectionNotes: mechanic ? `Assigned to: ${mechanic}. Reminder: ${sendReminder ? reminderTiming : 'No reminder'}` : 'Scheduled via Service Management',
        labourAmount: Number(estimatedCost || 0),
        nextServiceDate: scheduledDate,
        nextServiceKm: odoNum + 10000,
        assignedStaff: mechanic || null,
        status: 'SCHEDULED', // Explicitly schedule the service appointment instead of auto-completing it
        parts: [],
      };

      const res = await serviceRecordService.createServiceRecord(payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Service Scheduled',
          message: `Service appointment #${res.serviceNumber || res.id} successfully scheduled for ${scheduledDate}.`,
        })
      );
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setModalError(err.message || 'Failed to schedule service appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1060 }}
      tabIndex="-1"
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '680px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 p-2 bg-white">
          {/* Header */}
          <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark fs-5 mb-0">Schedule service</h5>
            <button
              type="button"
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-1"
              style={{ width: '32px', height: '32px', backgroundColor: '#dcfce7', color: '#16a34a' }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3">
              {modalError && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                  {modalError}
                </div>
              )}

              {/* Section 1: Customer and vehicle */}
              <div className="mb-3">
                <div className="fw-semibold text-dark small mb-2">Customer and vehicle</div>
                <div className="row g-2 mb-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Customer</label>
                    <select
                      className="form-select rounded-3 py-2 small"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                    >
                      <option value="">Select customer...</option>
                      {customers.map((c) => {
                        const name = c.fullName || c.name || 'Customer';
                        const phone = c.mobileNumber || c.mobile || '';
                        return (
                          <option key={c.id} value={c.id}>
                            {name} {phone ? `(${phone})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Vehicle</label>
                    <select
                      className="form-select rounded-3 py-2 small"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      required
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vehicle information Pill */}
                {selectedVehicle && (
                  <div
                    className="rounded-3 px-3 py-2 small text-primary"
                    style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.8rem' }}
                  >
                    <span>
                      <strong>{formatRegNumber(selectedVehicle.registrationNumber)}</strong> • {selectedVehicle.brand} {selectedVehicle.model} • Current odometer: {selectedVehicle.odometerReading ? `${selectedVehicle.odometerReading.toLocaleString('en-IN')} KM` : 'N/A'}
                    </span>
                  </div>
                )}
              </div>

              {/* Section 2: Service details */}
              <div className="mb-3">
                <div className="fw-semibold text-dark small mb-2">Service details</div>
                <div className="row g-2 mb-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Service type</label>
                    <select
                      className="form-select rounded-3 py-2 small"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                    >
                      <option value="Periodic service">Periodic service</option>
                      <option value="Major service">Major service</option>
                      <option value="General checkup">General checkup</option>
                      <option value="Accident repair">Accident repair</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Priority</label>
                    <select
                      className="form-select rounded-3 py-2 small"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="Normal">Normal</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Scheduled date</label>
                    <div className="input-group">
                      <input
                        type="date"
                        className="form-control rounded-3 py-2 small"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Time slot</label>
                    <select
                      className="form-select rounded-3 py-2 small"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                    >
                      <option value="9:00 AM to 11:00 AM">9:00 AM to 11:00 AM</option>
                      <option value="11:00 AM to 1:00 PM">11:00 AM to 1:00 PM</option>
                      <option value="2:00 PM to 4:00 PM">2:00 PM to 4:00 PM</option>
                      <option value="4:00 PM to 6:00 PM">4:00 PM to 6:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Current odometer (KM)</label>
                    <input
                      type="number"
                      className="form-control rounded-3 py-2 small"
                      value={currentOdometer}
                      onChange={(e) => setCurrentOdometer(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Next service due</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2 small"
                      placeholder="Auto-suggested"
                      value={nextServiceDue}
                      onChange={(e) => setNextServiceDue(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Assignment */}
              <div className="mb-3">
                <div className="fw-semibold text-dark small mb-2">Assignment</div>
                <div className="row g-2 mb-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Mechanic</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2 small"
                      placeholder="e.g. Ramesh K."
                      value={mechanic}
                      onChange={(e) => setMechanic(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Estimated cost (₹)</label>
                    <input
                      type="number"
                      className="form-control rounded-3 py-2 small fw-bold"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label small text-muted mb-1">Complaints or notes</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2 small"
                    placeholder="e.g. Oil leakage check, vibration above 80 km/h"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Section 4: Reminder */}
              <div className="mb-2">
                <div className="fw-semibold text-dark small mb-2">Reminder</div>
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md-6">
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="reminderCheck"
                        checked={sendReminder}
                        onChange={(e) => setSendReminder(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label small text-dark" htmlFor="reminderCheck" style={{ cursor: 'pointer' }}>
                        WhatsApp or SMS reminder
                      </label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-muted mb-1">Send</label>
                    <select
                      className="form-select rounded-3 py-2 small"
                      value={reminderTiming}
                      onChange={(e) => setReminderTiming(e.target.value)}
                    >
                      <option value="1 day before">1 day before</option>
                      <option value="2 days before">2 days before</option>
                      <option value="Same day morning">Same day morning</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 px-4 pt-0 pb-3 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 px-4 py-2 small"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-3 px-4 py-2 small fw-semibold"
                style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule service'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ScheduleServiceModal;
