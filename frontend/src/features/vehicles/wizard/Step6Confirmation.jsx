import React from 'react';
import { CheckCircle2, ArrowRight, Eye, List, PlusCircle, Car, Bike, Sparkles } from 'lucide-react';
import { formatRegNumber } from '../../../utils/formatters';

export function Step6Confirmation({ createdVehicle, onReset, onViewDetails, onGoToInventory }) {
  if (!createdVehicle) return null;

  const isCar = createdVehicle.vehicleType === 'CAR' || createdVehicle.type === 'CAR';
  const regNo = createdVehicle.registrationNumber || '';
  const title = `${createdVehicle.brand} ${createdVehicle.model} ${createdVehicle.variant || ''}`.trim();

  return (
    <div className="text-center py-4 px-2">
      {/* Success Badge */}
      <div
        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
        style={{
          width: '72px',
          height: '72px',
          backgroundColor: '#dcfce7',
          color: '#16a34a',
          boxShadow: '0 0 0 8px rgba(22, 163, 74, 0.1)',
        }}
      >
        <CheckCircle2 size={38} strokeWidth={2.5} />
      </div>

      <h2 className="h4 fw-bold text-dark font-heading mb-1">
        Vehicle Registered Successfully!
      </h2>
      <p className="text-muted small mb-4" style={{ maxWidth: '520px', margin: '0 auto' }}>
        The vehicle record has been saved and assigned an inventory ID. It is now part of the active dealership stock and available for inspection, showroom showcase, and customer bookings.
      </p>

      {/* Summary Card */}
      <div
        className="bg-light border rounded-4 p-4 text-start mx-auto mb-4"
        style={{ maxWidth: '620px', borderColor: '#e2e8f0' }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: isCar ? '#eff6ff' : '#f0fdf4',
                color: isCar ? '#2563eb' : '#16a34a',
              }}
            >
              {isCar ? <Car size={18} /> : <Bike size={18} />}
            </div>
            <div>
              <div className="fw-bold text-dark fs-6">{title}</div>
              <span className="small text-muted font-monospace">{formatRegNumber(regNo)}</span>
            </div>
          </div>
          <span className="badge rounded-pill px-3 py-1 bg-success text-white">
            {createdVehicle.status || 'AVAILABLE'}
          </span>
        </div>

        <div className="row g-2 small">
          <div className="col-6 col-sm-4">
            <span className="text-muted d-block">Inventory Vehicle ID</span>
            <span className="fw-bold text-dark font-monospace">#{createdVehicle.id}</span>
          </div>
          <div className="col-6 col-sm-4">
            <span className="text-muted d-block">Ownership Channel</span>
            <span className="fw-semibold text-dark">
              {createdVehicle.ownershipType === 'OWN' ? 'Own Dealership Stock' : 'Broker Consignment'}
            </span>
          </div>
          <div className="col-6 col-sm-4">
            <span className="text-muted d-block">Manufacturing Year</span>
            <span className="fw-semibold text-dark">{createdVehicle.manufacturingYear}</span>
          </div>
          <div className="col-6 col-sm-4">
            <span className="text-muted d-block">Fuel & Transmission</span>
            <span className="fw-semibold text-dark">
              {createdVehicle.fuelType} • {createdVehicle.transmission}
            </span>
          </div>
          <div className="col-6 col-sm-4">
            <span className="text-muted d-block">Odometer</span>
            <span className="fw-semibold text-dark">
              {Number(createdVehicle.odometerReading || 0).toLocaleString('en-IN')} KM
            </span>
          </div>
          <div className="col-6 col-sm-4">
            <span className="text-muted d-block">Selling Price</span>
            <span className="fw-bold text-primary font-monospace">
              ₹{Number(createdVehicle.sellingPrice || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex flex-wrap justify-content-center gap-3">
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-semibold shadow-sm"
          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
          onClick={onViewDetails}
        >
          <Eye size={16} /> View Vehicle 360° Profile
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-medium"
          onClick={onGoToInventory}
        >
          <List size={16} /> Go to Inventory Fleet
        </button>

        <button
          type="button"
          className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-medium"
          onClick={onReset}
        >
          <PlusCircle size={16} /> Register Another Vehicle
        </button>
      </div>
    </div>
  );
}

export default Step6Confirmation;
