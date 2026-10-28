import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { jobCardService } from '../../services/jobCardService';
import { costingService } from '../../services/costingService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatRegNumber, formatKilometres, resolveImageUrl } from '../../utils/formatters';
import { formatDate, formatDateTime } from '../../utils/date';
import VehicleImageViewer from '../../components/vehicle/VehicleImageViewer';
import {
  Car,
  Bike,
  Shield,
  FileText,
  DollarSign,
  Wrench,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Edit2,
  ArrowRightCircle,
} from 'lucide-react';
import VehiclePhotoGallery from '../../components/vehicle/VehiclePhotoGallery';
import VehicleDocumentManager from '../../components/vehicle/VehicleDocumentManager';

export function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = usePermission();
  const canEdit = hasPermission('VEHICLES', 'EDIT');
  const canChangeStatus = isAdmin || hasPermission('VEHICLES', 'STATUS');

  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status transition state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [totalRepairCost, setTotalRepairCost] = useState(0);
  const [vehicleCost, setVehicleCost] = useState(null);

  const fetchVehicleData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehicleData, historyData, jobCardsData, costData] = await Promise.all([
        vehicleService.getVehicleById(id),
        vehicleService.getVehicleHistory(id).catch(() => []),
        jobCardService.getJobCardsByVehicle(id).catch(() => []),
        costingService.getVehicleCost(id).catch(() => null),
      ]);
      setVehicle(vehicleData);
      setHistory(historyData || []);
      setVehicleCost(costData);
      setNewStatus(vehicleData.status);

      const finalizedRepairs = costData ? Number(costData.shopRepairCost || 0) : 0;
      setTotalRepairCost(finalizedRepairs);
    } catch (err) {
      setError(err.message || 'Failed to load vehicle details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [id]);

  const handleStatusTransition = async (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === vehicle?.status) {
      setStatusModalOpen(false);
      return;
    }

    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      await vehicleService.updateVehicleStatus(id, {
        status: newStatus,
        reason: statusRemarks || `Transitioned to ${newStatus}`,
      });
      setStatusModalOpen(false);
      setStatusRemarks('');
      fetchVehicleData();
    } catch (err) {
      setStatusError(err.message || 'Failed to update vehicle status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Vehicle Details" subtitle="Loading vehicle record..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div>
        <PageHeader title="Vehicle Details" />
        <ErrorState message={error || 'Vehicle not found'} onRetry={fetchVehicleData} />
      </div>
    );
  }

  const isOwn = vehicle.ownership === 'OWN';

  return (
    <div>
      <PageHeader
        title={`${vehicle.brand} ${vehicle.model} (${vehicle.manufacturingYear})`}
        subtitle={`Reg No: ${formatRegNumber(vehicle.registrationNumber)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Vehicles', href: '/vehicles' },
          { label: `${vehicle.brand} ${vehicle.model}` },
        ]}
      >
        {canEdit && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => navigate(`/vehicles/${id}/edit`)}
          >
            <Edit2 size={15} /> Edit Specs
          </button>
        )}

        <button
          type="button"
          className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
          onClick={() => navigate(`/costing?vehicleId=${id}`)}
        >
          <DollarSign size={15} /> Costing & Profit
        </button>

        {canChangeStatus && (
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
            onClick={() => setStatusModalOpen(true)}
          >
            <ArrowRightCircle size={15} /> Update Status
          </button>
        )}
      </PageHeader>

      {/* Top Banner / Key Details */}
      <div className="app-card p-4 mb-4">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-md-auto text-center text-md-start">
            {(() => {
              const rawImg = vehicle.primaryPhotoUrl || (vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos[0].photoUrl : null);
              const resolvedImg = resolveImageUrl(rawImg);
              return resolvedImg ? (
                <div
                  className="position-relative cursor-pointer group"
                  onClick={() => setIsViewerOpen(true)}
                  title="Click to view full-resolution photo"
                >
                  <img
                    src={resolvedImg}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="rounded-4 shadow-sm border object-fit-cover"
                    style={{ width: '84px', height: '84px' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div
                  className={`rounded-4 p-3 d-inline-flex align-items-center justify-content-center shadow-xs ${
                    vehicle.type === 'CAR' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'
                  }`}
                  style={{ width: '80px', height: '80px' }}
                >
                  {vehicle.type === 'CAR' ? <Car size={44} /> : <Bike size={44} />}
                </div>
              );
            })()}
          </div>

          <div className="col-12 col-md flex-grow-1">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="h4 fw-bold text-dark mb-0 font-heading">
                {vehicle.brand} {vehicle.model}
              </span>
              <span className="badge bg-light text-dark border font-monospace fs-6 px-2 py-1">
                {formatRegNumber(vehicle.registrationNumber)}
              </span>
              <StatusBadge status={vehicle.ownership} type="ownership" />
              <StatusBadge status={vehicle.status} />
            </div>

            <div className="d-flex flex-wrap gap-4 text-muted small">
              <div>
                <strong>Year:</strong> {vehicle.manufacturingYear}
              </div>
              <div>
                <strong>Fuel:</strong> {vehicle.fuelType}
              </div>
              <div>
                <strong>Transmission:</strong> {vehicle.transmission}
              </div>
              <div>
                <strong>Odometer:</strong> {formatKilometres(vehicle.odometerKm)}
              </div>
              <div>
                <strong>Color:</strong> {vehicle.color}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-auto text-md-end border-top border-md-top-0 pt-3 pt-md-0">
            <div className="text-muted small text-uppercase fw-semibold">
              Recommended Selling Price
            </div>
            <div className="h3 fw-bold mb-0 font-monospace text-success">
              <MoneyDisplay amount={vehicleCost?.recommendedSellingPriceGrossMargin || vehicleCost?.recommendedSellingPriceMarkup || vehicle.sellingPrice || vehicle.purchasePrice || 0} />
            </div>
            <div className="text-muted small">
              Finalized Cost: <MoneyDisplay amount={vehicleCost?.finalizedDealerCost || vehicleCost?.totalVehicleCost || vehicle.purchasePrice || 0} />
            </div>
            {Number(vehicleCost?.estimatedRepairExposure || 0) > 0 && (
              <div className="text-warning small">
                Est. Exposure: <MoneyDisplay amount={vehicleCost.estimatedRepairExposure} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Specifications & Identification */}
        <div className="col-12 col-lg-6">
          <div className="app-card h-100">
            <div className="app-card-header">
              <h3 className="app-card-title">Technical Specifications</h3>
            </div>
            <div className="app-card-body">
              <div className="row g-3 small">
                <div className="col-6">
                  <span className="text-muted d-block">Brand</span>
                  <span className="fw-semibold text-dark">{vehicle.brand}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Model</span>
                  <span className="fw-semibold text-dark">{vehicle.model}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Variant</span>
                  <span className="fw-semibold text-dark">{vehicle.variant || 'Standard'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Manufacturing Year</span>
                  <span className="fw-semibold text-dark">{vehicle.manufacturingYear}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Engine Number</span>
                  <span className="fw-semibold text-dark font-monospace">{vehicle.engineNumber || '—'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Chassis Number</span>
                  <span className="fw-semibold text-dark font-monospace">{vehicle.chassisNumber || '—'}</span>
                </div>
              </div>

              <hr className="my-3 text-muted opacity-25" />

              <h4 className="h6 fw-bold text-dark mb-2">RC & Insurance</h4>
              <div className="row g-3 small">
                <div className="col-6">
                  <span className="text-muted d-block">RC Status</span>
                  <span className="fw-semibold text-dark">{vehicle.rcStatus || 'Valid'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Insurance Company</span>
                  <span className="fw-semibold text-dark">{vehicle.insuranceCompany || '—'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Policy Number</span>
                  <span className="fw-semibold text-dark">{vehicle.insurancePolicyNumber || '—'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Insurance Expiry</span>
                  <span className="fw-semibold text-dark">{formatDate(vehicle.insuranceExpiryDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ownership Details: OWN vs BROKER */}
        <div className="col-12 col-lg-6">
          <div className="app-card h-100">
            <div className="app-card-header">
              <h3 className="app-card-title">
                {isOwn ? 'Dealership Purchase Record' : 'Broker Consignment Record'}
              </h3>
              <StatusBadge status={vehicle.ownership} type="ownership" />
            </div>
            <div className="app-card-body">
              {isOwn ? (
                <div>
                  <div className="alert alert-primary bg-primary-subtle border-0 py-2 px-3 small rounded-3 mb-3">
                    This vehicle was bought directly by the dealership and capitalized into dealership inventory assets.
                  </div>
                  <div className="row g-3 small">
                    <div className="col-6">
                      <span className="text-muted d-block">Base Price / Purchase Cost</span>
                      <span className="fw-bold text-dark fs-6">
                        <MoneyDisplay amount={vehicle.purchasePrice || vehicle.sellingPrice} />
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Workshop Repairs Added</span>
                      <span className="fw-bold text-danger fs-6">
                        <MoneyDisplay amount={totalRepairCost} />
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Total Invested Cost</span>
                      <span className="fw-bold text-primary fs-6 font-monospace">
                        <MoneyDisplay amount={Number(vehicle.purchasePrice || vehicle.sellingPrice || 0) + totalRepairCost} />
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Purchase Date</span>
                      <span className="fw-semibold text-dark">{formatDate(vehicle.purchaseDate)}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Seller / Vendor</span>
                      <span className="fw-semibold text-dark">{vehicle.sellerName || 'Direct Owner'}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Purchase Remarks</span>
                      <span className="fw-semibold text-dark">{vehicle.purchaseRemarks || 'None'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="alert alert-warning bg-warning-subtle border-0 py-2 px-3 small rounded-3 mb-3">
                    This vehicle is consigned by an independent broker. The dealership acts as a commission agent and does not own the vehicle.
                  </div>
                  <div className="row g-3 small">
                    <div className="col-6">
                      <span className="text-muted d-block">Consigning Broker</span>
                      <span className="fw-bold text-dark">
                        {vehicle.brokerListing?.brokerName || vehicle.brokerName || 'Consignment Broker'}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Broker Asking / Settlement Basis</span>
                      <span className="fw-bold text-dark fs-6">
                        <MoneyDisplay amount={vehicle.brokerListing?.askingPrice || vehicle.brokerAskingPrice} />
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Commission Type</span>
                      <span className="fw-semibold text-dark">
                        {vehicle.brokerListing?.commissionType || vehicle.commissionType || 'FIXED'}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Agreed Commission</span>
                      <span className="fw-bold text-warning fs-6">
                        {(vehicle.brokerListing?.commissionType || vehicle.commissionType) === 'PERCENTAGE'
                          ? `${vehicle.brokerListing?.commissionRate || vehicle.commissionValue}%`
                          : <MoneyDisplay amount={vehicle.brokerListing?.commissionRate || vehicle.commissionValue} />}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <hr className="my-3 text-muted opacity-25" />

              <h4 className="h6 fw-bold text-dark mb-2">Workshop & Refurbishment History</h4>
              <p className="text-muted small mb-2">
                Perform inspections and assign repair tasks before marking the vehicle ready for sale.
              </p>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => navigate(`/inspections/new?vehicleId=${id}`)}
                >
                  <Wrench size={14} className="me-1" /> New 15-Point Inspection
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => navigate(`/job-cards?vehicleId=${id}`)}
                >
                  View Job Cards
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Photo Gallery */}
        <div className="col-12">
          <VehiclePhotoGallery
            vehicleId={id}
            photos={vehicle.photos || []}
            primaryPhotoUrl={vehicle.primaryPhotoUrl}
            onPhotosUpdated={(updated) => setVehicle(updated)}
            canEdit={canEdit}
          />
        </div>

        {/* Vehicle Documents & Records */}
        <div className="col-12">
          <VehicleDocumentManager
            vehicleId={id}
            documents={vehicle.documents || []}
            onDocumentsUpdated={(updated) => setVehicle(updated)}
            canEdit={canEdit}
          />
        </div>
      </div>

      {/* Status Transition Modal */}
      {statusModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Update Vehicle Status</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setStatusModalOpen(false)}
                />
              </div>
              <form onSubmit={handleStatusTransition}>
                <div className="modal-body p-4">
                  {statusError && (
                    <div className="alert alert-danger small py-2 px-3 mb-3">
                      {statusError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="statusSelect">
                      Target State
                    </label>
                    <select
                      id="statusSelect"
                      className="form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      required
                    >
                      <option value="PURCHASED">PURCHASED</option>
                      <option value="INSPECTION">UNDER INSPECTION</option>
                      <option value="JOB_CARD">JOB CARD</option>
                      <option value="REPAIR">UNDER REPAIR</option>
                      <option value="READY_FOR_SALE">READY FOR SALE</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="BOOKED">BOOKED</option>
                      <option value="SOLD">SOLD</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="statusRemarksInput">
                      Transition Remarks
                    </label>
                    <textarea
                      id="statusRemarksInput"
                      className="form-control"
                      rows="3"
                      placeholder="Enter operational reason for status change (e.g. Completed mechanical refurbishing and detailing)"
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setStatusModalOpen(false)}
                    disabled={isUpdatingStatus}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? 'Transitioning...' : 'Confirm Status Transition'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Full-Resolution Vehicle Image Viewer Modal */}
      <VehicleImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        imageUrl={vehicle.primaryPhotoUrl || (vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos[0].photoUrl : null)}
        title={`${vehicle.brand} ${vehicle.model}`}
        registrationNumber={vehicle.registrationNumber}
        caption={`${vehicle.brand} ${vehicle.model} (${vehicle.manufacturingYear}) — Dealership Vehicle Profile`}
      />
    </div>
  );
}

export default VehicleDetailPage;
