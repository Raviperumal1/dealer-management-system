import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import MoneyDisplay from '../common/MoneyDisplay';
import { formatRegNumber, formatKilometres, resolveImageUrl } from '../../utils/formatters';
import {
  Car,
  Bike,
  Eye,
  Edit2,
  ClipboardCheck,
  DollarSign,
  Calendar,
  Fuel,
  Gauge,
  Maximize2,
} from 'lucide-react';

/**
 * Enterprise Vehicle Card Component (DEALEROS Showroom Architecture)
 * Compliant with Phase 4 specifications:
 * - 16:9 aspect ratio thumbnail
 * - High-res photo zoom trigger
 * - Floating status, ownership & type tags
 * - Authentic Indian HSRP license plate badge
 * - Specs micro-chips (Year, Fuel, KM, Trans)
 * - Financial comparison (Selling Price vs Cost/Broker Basis)
 * - Equal height flexbox layout with primary and secondary action triggers
 */
export function VehicleCard({
  vehicle,
  onImageClick,
  canEdit = false,
  canWorkshop = false,
}) {
  const navigate = useNavigate();

  if (!vehicle) return null;

  const rawPhoto =
    vehicle.primaryPhotoUrl ||
    (vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos[0].photoUrl : null);
  const resolvedUrl = resolveImageUrl(rawPhoto);

  const costBasis =
    vehicle.ownership === 'OWN'
      ? vehicle.purchasePrice
      : vehicle.brokerAskingPrice || vehicle.brokerListing?.askingPrice;

  return (
    <div className="vehicle-grid-card h-100">
      {/* 1. Fixed 16:9 Vehicle Photo Container */}
      <div className="vehicle-card-media">
        {resolvedUrl ? (
          <div className="position-relative w-100 h-100 group">
            <img
              src={resolvedUrl}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="vehicle-card-img cursor-pointer"
              onClick={() => onImageClick && onImageClick(vehicle)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
            {/* Hover overlay hint */}
            <div
              className="position-absolute inset-0 d-flex align-items-center justify-content-center bg-dark bg-opacity-25 opacity-0 hover-opacity-100 transition-all cursor-pointer pointer-events-none"
              style={{ pointerEvents: 'none' }}
            >
              <span className="badge bg-white text-dark shadow-sm d-flex align-items-center gap-1 small py-1 px-2">
                <Maximize2 size={12} /> View Photo
              </span>
            </div>
          </div>
        ) : (
          <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-60">
            {vehicle.type === 'CAR' ? <Car size={42} strokeWidth={1.5} /> : <Bike size={42} strokeWidth={1.5} />}
            <span className="small mt-1" style={{ fontSize: '0.72rem' }}>
              No Photo Uploaded
            </span>
          </div>
        )}

        {/* 2. Floating Ownership and Status Badges */}
        <div className="vehicle-card-badge-left">
          <StatusBadge status={vehicle.ownership} type="ownership" />
        </div>

        <div className="vehicle-card-badge-right">
          <StatusBadge status={vehicle.status} />
        </div>

        <div className="vehicle-card-type-tag">
          {vehicle.type === 'CAR' ? <Car size={12} /> : <Bike size={12} />}
          <span>{vehicle.type === 'CAR' ? 'Car' : 'Bike'}</span>
        </div>
      </div>

      {/* 3. Vehicle Information & Specs */}
      <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
        <div>
          {/* Make, Model & Plate */}
          <div className="d-flex align-items-start justify-content-between gap-1.5 mb-1.5">
            <div className="overflow-hidden">
              <h3
                className="fw-bold text-dark mb-0 text-truncate cursor-pointer font-heading"
                style={{ fontSize: '0.925rem' }}
                title={`${vehicle.brand} ${vehicle.model}`}
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              >
                {vehicle.brand} {vehicle.model}
              </h3>
              {vehicle.variant && (
                <span className="text-muted small text-truncate d-block" style={{ fontSize: '0.75rem' }}>
                  {vehicle.variant}
                </span>
              )}
            </div>

            <div className="license-plate-badge flex-shrink-0">
              <span className="ind-tag">IND</span>
              <span>{formatRegNumber(vehicle.registrationNumber)}</span>
            </div>
          </div>

          {/* Metadata Specification Chips */}
          <div className="d-flex flex-wrap gap-1 mb-2.5">
            <span className="vehicle-spec-chip">
              <Calendar size={11} className="text-secondary" /> {vehicle.manufacturingYear || '—'}
            </span>
            <span className="vehicle-spec-chip">
              <Fuel size={11} className="text-secondary" /> {vehicle.fuelType || 'Petrol'}
            </span>
            <span className="vehicle-spec-chip">
              <Gauge size={11} className="text-secondary" /> {formatKilometres(vehicle.odometerKm || vehicle.odometerReading)}
            </span>
            {vehicle.transmission && (
              <span className="vehicle-spec-chip">
                {vehicle.transmission}
              </span>
            )}
          </div>
        </div>

        {/* 4. Pricing and Actions Area */}
        <div>
          {/* Financial Values Box */}
          <div className="d-flex align-items-end justify-content-between p-2 rounded-2 bg-light border mb-2.5">
            <div>
              <span className="text-muted d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                SELLING PRICE
              </span>
              <div className="fw-bold text-primary fs-6 lh-1 font-monospace mt-0.5">
                <MoneyDisplay amount={vehicle.sellingPrice} />
              </div>
            </div>

            <div className="text-end">
              <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>
                {vehicle.ownership === 'OWN' ? 'COST BASIS' : 'BROKER BASIS'}
              </span>
              <div className="text-muted small font-monospace mt-0.5" style={{ fontSize: '0.75rem' }}>
                {costBasis ? <MoneyDisplay amount={costBasis} /> : '—'}
              </div>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="d-flex align-items-center gap-1 pt-2 border-top">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1 py-1"
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              title="View Complete Vehicle Details"
            >
              <Eye size={13} /> View Details
            </button>

            {canWorkshop && (
              <button
                type="button"
                className="btn btn-sm btn-outline-warning p-1"
                title="15-Point Inspection"
                onClick={() => navigate(`/inspections/new?vehicleId=${vehicle.id}`)}
              >
                <ClipboardCheck size={14} />
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm btn-outline-info p-1"
              title="Costing & Profit Breakdown"
              onClick={() => navigate(`/costing?vehicleId=${vehicle.id}`)}
            >
              <DollarSign size={14} />
            </button>

            {canEdit && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-1"
                title="Edit Vehicle"
                onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;
