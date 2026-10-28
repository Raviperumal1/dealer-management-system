import React from 'react';
import { IndianRupee, Edit3, ShieldAlert, CheckCircle2, Car, Bike, AlertCircle } from 'lucide-react';
import MoneyDisplay from '../../../components/common/MoneyDisplay';
import { formatRegNumber } from '../../../utils/formatters';

export function Step5PricingReview({
  formData,
  updateField,
  errors,
  photoFiles = [],
  docFiles = [],
  onEditStep,
}) {
  const isOwn = formData.ownership === 'OWN';
  const isBike = formData.type === 'BIKE';

  const sellingPrice = Number(formData.sellingPrice || 0);
  const purchasePrice = Number(formData.purchasePrice || 0);
  const brokerAskingPrice = Number(formData.brokerAskingPrice || 0);

  // Financial calculations
  const expectedProfit = isOwn ? Math.max(0, sellingPrice - purchasePrice) : 0;
  const profitMarginPercent = isOwn && sellingPrice > 0 ? ((expectedProfit / sellingPrice) * 100).toFixed(1) : 0;

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Pricing & Commercials Configuration */}
      <div>
        <h3 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
          1. Inventory Commercials & Target Selling Price
        </h3>

        <div className="row g-3">
          {/* Target Selling Price */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Target Showroom Selling Price (₹) <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">₹</span>
              <input
                type="number"
                min="1000"
                className={`form-control rounded-end-3 py-2 fs-5 fw-bold font-monospace text-primary ${
                  errors?.sellingPrice ? 'is-invalid' : ''
                }`}
                placeholder="e.g. 650000"
                value={formData.sellingPrice || ''}
                onChange={(e) => updateField('sellingPrice', e.target.value)}
                required
              />
            </div>
            {errors?.sellingPrice && (
              <div className="text-danger small mt-1">{errors.sellingPrice}</div>
            )}
          </div>

          {/* Pricing Flexibility */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Price Negotiation Policy
            </label>
            <select
              className="form-select rounded-3 py-2"
              value={formData.pricingFlexibility || 'SLIGHTLY_NEGOTIABLE'}
              onChange={(e) => updateField('pricingFlexibility', e.target.value)}
            >
              <option value="FIXED">Strictly Fixed Price</option>
              <option value="SLIGHTLY_NEGOTIABLE">Slightly Negotiable (₹5k - ₹15k margin)</option>
              <option value="NEGOTIABLE">Negotiable on Table</option>
            </select>
          </div>

          {/* Real-time Commercials Card */}
          <div className="col-12">
            <div className="p-3 rounded-4 bg-light border d-flex flex-wrap align-items-center justify-content-between gap-3">
              {isOwn ? (
                <>
                  <div>
                    <span className="text-muted small d-block">Cost Base Breakdown</span>
                    <span className="fw-semibold text-dark">
                      Purchase: <MoneyDisplay amount={purchasePrice} />
                    </span>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Selling Target</span>
                    <span className="fw-bold text-dark fs-6">
                      <MoneyDisplay amount={sellingPrice} />
                    </span>
                  </div>
                  <div className="text-md-end">
                    <span className="text-muted small d-block">Estimated Gross Margin (Pre-expense)</span>
                    <span className="fs-5 fw-bold text-success font-monospace">
                      ₹{expectedProfit.toLocaleString('en-IN')} ({profitMarginPercent}%)
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-muted small d-block">Broker Minimum Settlement</span>
                    <span className="fw-semibold text-dark">
                      <MoneyDisplay amount={brokerAskingPrice} />
                    </span>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Agreed Brokerage</span>
                    <span className="fw-bold text-dark">
                      {formData.commissionType === 'PERCENTAGE'
                        ? `${formData.commissionValue || 0}%`
                        : `₹${Number(formData.commissionValue || 0).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="text-md-end">
                    <span className="text-muted small d-block">Target Showroom Price</span>
                    <span className="fs-5 fw-bold text-primary font-monospace">
                      <MoneyDisplay amount={sellingPrice} />
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="my-1 text-muted opacity-25" />

      {/* 2. Review Summary Cards with Section-wise Edit Buttons */}
      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="h6 fw-bold text-dark text-uppercase mb-0 letter-spacing-wider">
            2. Review All Vehicle Information Before Submission
          </h3>
          <span className="small text-muted">Click "Edit" on any section to adjust data</span>
        </div>

        <div className="d-flex flex-column gap-3">
          {/* Section A: Type & Category */}
          <div className="border rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small text-uppercase letter-spacing-wider">
                Vehicle Type & Category
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold small"
                onClick={() => onEditStep(1)}
              >
                <Edit3 size={13} className="me-1" /> Edit
              </button>
            </div>
            <div className="row g-2 small">
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">Type:</span>
                <span className="fw-semibold text-dark">{isBike ? 'Two-Wheeler (Bike)' : 'Four-Wheeler (Car)'}</span>
              </div>
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">Plate Category:</span>
                <span className="fw-semibold text-dark">
                  {formData.registrationCategory === 'COMMERCIAL'
                    ? 'Transport / Commercial (Yellow Plate)'
                    : 'Private / Non-Transport (White Plate)'}
                </span>
              </div>
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">Ownership Channel:</span>
                <span className="fw-semibold text-dark">
                  {isOwn ? 'Own Dealership Inventory' : 'Broker Consignment'}
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Specifications */}
          <div className="border rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small text-uppercase letter-spacing-wider">
                Specifications & Mechanicals
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold small"
                onClick={() => onEditStep(2)}
              >
                <Edit3 size={13} className="me-1" /> Edit
              </button>
            </div>
            <div className="row g-2 small">
              <div className="col-6 col-sm-3">
                <span className="text-muted d-block">Vehicle:</span>
                <span className="fw-semibold text-dark">
                  {formData.brand} {formData.model} {formData.variant || ''}
                </span>
              </div>
              <div className="col-6 col-sm-3">
                <span className="text-muted d-block">Year:</span>
                <span className="fw-semibold text-dark">{formData.manufacturingYear}</span>
              </div>
              <div className="col-6 col-sm-3">
                <span className="text-muted d-block">Colour:</span>
                <span className="fw-semibold text-dark">{formData.color}</span>
              </div>
              <div className="col-6 col-sm-3">
                <span className="text-muted d-block">Fuel & Transmission:</span>
                <span className="fw-semibold text-dark">
                  {formData.fuelType} • {formData.transmission}
                </span>
              </div>
              <div className="col-6 col-sm-3">
                <span className="text-muted d-block">Odometer Reading:</span>
                <span className="fw-semibold text-dark">
                  {Number(formData.odometerKm || 0).toLocaleString('en-IN')} KM
                </span>
              </div>
              <div className="col-6 col-sm-3">
                <span className="text-muted d-block">Owners:</span>
                <span className="fw-semibold text-dark">{formData.ownershipCount || '1st Owner'}</span>
              </div>
              <div className="col-6 col-sm-6">
                <span className="text-muted d-block">Photos Attached:</span>
                <span className="fw-semibold text-dark">
                  {photoFiles.length > 0 ? `${photoFiles.length} photos ready for upload` : 'None attached'}
                </span>
              </div>
            </div>
          </div>

          {/* Section C: Ownership & Acquisition */}
          <div className="border rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small text-uppercase letter-spacing-wider">
                Acquisition / Consignment
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold small"
                onClick={() => onEditStep(3)}
              >
                <Edit3 size={13} className="me-1" /> Edit
              </button>
            </div>
            {isOwn ? (
              <div className="row g-2 small">
                <div className="col-12 col-sm-4">
                  <span className="text-muted d-block">Purchase Price:</span>
                  <span className="fw-bold text-dark font-monospace">₹{purchasePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="col-12 col-sm-4">
                  <span className="text-muted d-block">Purchase Date:</span>
                  <span className="fw-semibold text-dark">{formData.purchaseDate}</span>
                </div>
                <div className="col-12 col-sm-4">
                  <span className="text-muted d-block">Seller Name:</span>
                  <span className="fw-semibold text-dark">{formData.sellerName}</span>
                </div>
              </div>
            ) : (
              <div className="row g-2 small">
                <div className="col-12 col-sm-4">
                  <span className="text-muted d-block">Broker Asking Price:</span>
                  <span className="fw-bold text-dark font-monospace">₹{brokerAskingPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="col-12 col-sm-4">
                  <span className="text-muted d-block">Commission:</span>
                  <span className="fw-semibold text-dark">
                    {formData.commissionType === 'PERCENTAGE'
                      ? `${formData.commissionValue}%`
                      : `₹${Number(formData.commissionValue || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section D: Registration, RC & Identification */}
          <div className="border rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small text-uppercase letter-spacing-wider">
                Registration, RC & Identification
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold small"
                onClick={() => onEditStep(4)}
              >
                <Edit3 size={13} className="me-1" /> Edit
              </button>
            </div>
            <div className="row g-2 small">
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">Registration Number:</span>
                <span className="fw-bold text-dark font-monospace">
                  {formData.registrationNumber ? formatRegNumber(formData.registrationNumber) : 'UNREGISTERED'}
                </span>
              </div>
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">Engine Number:</span>
                <span className="fw-semibold text-dark font-monospace">{formData.engineNumber || '—'}</span>
              </div>
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">Chassis Number (VIN):</span>
                <span className="fw-semibold text-dark font-monospace">{formData.chassisNumber || '—'}</span>
              </div>
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">RC Status:</span>
                <span className="fw-semibold text-dark">{formData.rcStatus || 'VALID'}</span>
              </div>
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">Insurance:</span>
                <span className="fw-semibold text-dark">
                  {formData.insuranceCompany || 'Standard'} ({formData.insuranceExpiryDate || 'Active'})
                </span>
              </div>
              <div className="col-12 col-sm-4">
                <span className="text-muted d-block">Documents Attached:</span>
                <span className="fw-semibold text-dark">
                  {docFiles.length > 0 ? `${docFiles.length} files attached` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step5PricingReview;
