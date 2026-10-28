import React from 'react';
import { IndianRupee, User, Phone, MapPin, FileText, Users2, RotateCcw } from 'lucide-react';

export function Step3Ownership({
  formData,
  updateField,
  errors,
  brokers = [],
  isLoadingBrokers = false,
  fetchBrokers,
}) {
  const isOwn = formData.ownership === 'OWN';

  return (
    <div className="d-flex flex-column gap-4">
      {isOwn ? (
        /* OWN INVENTORY DETAILS */
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h3 className="h6 fw-bold text-primary text-uppercase mb-0 letter-spacing-wider">
              Dealership Purchase & Acquisition Details
            </h3>
            <span className="badge bg-primary text-white">Own Capital Asset</span>
          </div>
          <p className="text-muted small mb-3">
            Enter the exact purchase amount and vendor/seller acquisition information for inventory capital valuation.
          </p>

          <div className="row g-3">
            {/* Purchase Price */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-dark mb-1">
                Purchase Price (₹) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">₹</span>
                <input
                  type="number"
                  min="0"
                  className={`form-control rounded-end-3 py-2 fw-bold font-monospace ${
                    errors?.purchasePrice ? 'is-invalid' : ''
                  }`}
                  placeholder="e.g. 520000"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => updateField('purchasePrice', e.target.value)}
                  required
                />
              </div>
              {errors?.purchasePrice && (
                <div className="text-danger small mt-1">{errors.purchasePrice}</div>
              )}
            </div>

            {/* Purchase Date */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-dark mb-1">
                Purchase Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className={`form-control rounded-3 py-2 ${errors?.purchaseDate ? 'is-invalid' : ''}`}
                value={formData.purchaseDate || ''}
                onChange={(e) => updateField('purchaseDate', e.target.value)}
                required
              />
              {errors?.purchaseDate && (
                <div className="text-danger small mt-1">{errors.purchaseDate}</div>
              )}
            </div>

            {/* Purchase Incidental Expenses */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-dark mb-1">
                Initial Transport / Direct Sourcing Cost (₹)
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">₹</span>
                <input
                  type="number"
                  min="0"
                  className="form-control rounded-end-3 py-2 font-monospace"
                  placeholder="e.g. 5000"
                  value={formData.purchaseExpenses || ''}
                  onChange={(e) => updateField('purchaseExpenses', e.target.value)}
                />
              </div>
            </div>

            {/* Seller / Previous Owner Name */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-dark mb-1">
                Seller / Previous Owner Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control rounded-3 py-2 ${errors?.sellerName ? 'is-invalid' : ''}`}
                placeholder="e.g. Ankit Verma / Sourcing Partner"
                value={formData.sellerName || ''}
                onChange={(e) => updateField('sellerName', e.target.value)}
                required
              />
              {errors?.sellerName && (
                <div className="text-danger small mt-1">{errors.sellerName}</div>
              )}
            </div>

            {/* Seller Phone Number */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-dark mb-1">
                Seller Contact Phone
              </label>
              <input
                type="text"
                className="form-control rounded-3 py-2"
                placeholder="e.g. 9876543210"
                value={formData.sellerPhone || ''}
                onChange={(e) => updateField('sellerPhone', e.target.value)}
              />
            </div>

            {/* Seller Address */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-dark mb-1">
                Seller City / Address
              </label>
              <input
                type="text"
                className="form-control rounded-3 py-2"
                placeholder="e.g. Coimbatore, Tamil Nadu"
                value={formData.sellerAddress || ''}
                onChange={(e) => updateField('sellerAddress', e.target.value)}
              />
            </div>

            {/* Purchase Remarks */}
            <div className="col-12">
              <label className="form-label small fw-semibold text-dark mb-1">
                Acquisition Notes & Remarks
              </label>
              <input
                type="text"
                className="form-control rounded-3 py-2"
                placeholder="e.g. Direct customer exchange, single owner, all original service invoices verified"
                value={formData.purchaseRemarks || ''}
                onChange={(e) => updateField('purchaseRemarks', e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : (
        /* BROKER CONSIGNMENT DETAILS */
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h3 className="h6 fw-bold text-warning text-uppercase mb-0 letter-spacing-wider">
              Broker Consignment Agreement Details
            </h3>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-1 px-2.5 d-flex align-items-center gap-1 rounded-3"
              onClick={fetchBrokers}
              disabled={isLoadingBrokers}
            >
              <RotateCcw size={13} /> {isLoadingBrokers ? 'Refreshing...' : 'Refresh Brokers'}
            </button>
          </div>
          <p className="text-muted small mb-3">
            Select the consigning broker partner and enter their agreed minimum payout and brokerage terms.
          </p>

          <div className="row g-3">
            {/* Broker Selection */}
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark mb-1">
                Consigning Broker Partner <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select rounded-3 py-2 ${errors?.brokerId ? 'is-invalid' : ''}`}
                value={formData.brokerId || ''}
                onChange={(e) => updateField('brokerId', e.target.value)}
                required
              >
                <option value="">
                  {isLoadingBrokers
                    ? 'Loading registered brokers...'
                    : brokers.length === 0
                    ? 'No registered brokers found'
                    : '-- Select Consigning Broker --'}
                </option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || b.fullName} {b.mobile || b.mobileNumber ? `(${b.mobile || b.mobileNumber})` : ''}
                  </option>
                ))}
              </select>
              {errors?.brokerId && <div className="text-danger small mt-1">{errors.brokerId}</div>}
              {brokers.length === 0 && !isLoadingBrokers && (
                <div className="small text-danger mt-1">
                  No active brokers registered.{' '}
                  <a
                    href="/brokers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-underline fw-semibold"
                  >
                    Click to register a broker in new tab
                  </a>
                </div>
              )}
            </div>

            {/* Broker Asking Price (Agreed Owner Payout) */}
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark mb-1">
                Broker Asking Price / Minimum Owner Payout (₹) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">₹</span>
                <input
                  type="number"
                  min="0"
                  className={`form-control rounded-end-3 py-2 fw-bold font-monospace ${
                    errors?.brokerAskingPrice ? 'is-invalid' : ''
                  }`}
                  placeholder="e.g. 480000"
                  value={formData.brokerAskingPrice || ''}
                  onChange={(e) => updateField('brokerAskingPrice', e.target.value)}
                  required
                />
              </div>
              {errors?.brokerAskingPrice && (
                <div className="text-danger small mt-1">{errors.brokerAskingPrice}</div>
              )}
            </div>

            {/* Commission Type */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-dark mb-1">
                Commission Type <span className="text-danger">*</span>
              </label>
              <select
                className="form-select rounded-3 py-2"
                value={formData.commissionType || 'FIXED'}
                onChange={(e) => updateField('commissionType', e.target.value)}
              >
                <option value="FIXED">Fixed Amount (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>

            {/* Commission Value */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-dark mb-1">
                {formData.commissionType === 'PERCENTAGE'
                  ? 'Commission Rate (%)'
                  : 'Commission Amount (₹)'}{' '}
                <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="form-control rounded-3 py-2 fw-semibold font-monospace"
                placeholder={formData.commissionType === 'PERCENTAGE' ? 'e.g. 2.5' : 'e.g. 15000'}
                value={formData.commissionValue || ''}
                onChange={(e) => updateField('commissionValue', e.target.value)}
              />
            </div>

            {/* Consignment Start Date */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-dark mb-1">
                Consignment Start Date
              </label>
              <input
                type="date"
                className="form-control rounded-3 py-2"
                value={formData.listingDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateField('listingDate', e.target.value)}
              />
            </div>

            {/* Consignment Agreement Reference */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-dark mb-1">
                Agreement Ref / Token #
              </label>
              <input
                type="text"
                className="form-control rounded-3 py-2"
                placeholder="e.g. AGR-2026-089"
                value={formData.consignmentRef || ''}
                onChange={(e) => updateField('consignmentRef', e.target.value)}
              />
            </div>

            {/* Broker Remarks */}
            <div className="col-12">
              <label className="form-label small fw-semibold text-dark mb-1">
                Consignment Agreement Remarks
              </label>
              <input
                type="text"
                className="form-control rounded-3 py-2"
                placeholder="e.g. Customer leaves car for 30 days consignment, minimum settlement strictly ₹4,80,000"
                value={formData.purchaseRemarks || ''}
                onChange={(e) => updateField('purchaseRemarks', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step3Ownership;
