import React, { useRef } from 'react';
import { Shield, FileText, CheckCircle2, AlertTriangle, Upload, Trash2, FileCheck, Info } from 'lucide-react';
import { formatRegNumber } from '../../../utils/formatters';

export function Step4RegistrationDocuments({
  formData,
  updateField,
  errors,
  docFiles = [],
  setDocFiles,
}) {
  const fileInputRef = useRef(null);
  const isCommercial = formData.registrationCategory === 'COMMERCIAL';
  const isUnregistered = formData.registrationStatus === 'UNREGISTERED';

  // Handle document file staging
  const handleDocSelect = (e, defaultType = 'RC') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFiles((prev) => [
        ...prev,
        {
          file,
          name: file.name,
          type: defaultType,
          size: file.size,
        },
      ]);
    }
  };

  const removeDoc = (index) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Vehicle Identification Numbers */}
      <div>
        <h3 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
          1. Vehicle Identification (Reg, Engine, Chassis)
        </h3>

        <div className="row g-3">
          {/* Registration Number */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Registration Number {!isUnregistered && <span className="text-danger">*</span>}
            </label>
            <input
              type="text"
              className={`form-control font-monospace text-uppercase rounded-3 py-2 ${
                errors?.registrationNumber ? 'is-invalid' : ''
              }`}
              placeholder={isUnregistered ? 'Unregistered / Brand New' : 'e.g. TN29AB1234'}
              value={formData.registrationNumber || ''}
              disabled={isUnregistered}
              onChange={(e) => updateField('registrationNumber', e.target.value.toUpperCase().replace(/\s+/g, ''))}
              required={!isUnregistered}
            />
            {errors?.registrationNumber && (
              <div className="invalid-feedback">{errors.registrationNumber}</div>
            )}
            {formData.registrationNumber && (
              <div className="small text-muted mt-1">
                Display: <strong>{formatRegNumber(formData.registrationNumber)}</strong>
              </div>
            )}
          </div>

          {/* Engine Number */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Engine Number <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control font-monospace rounded-3 py-2 ${
                errors?.engineNumber ? 'is-invalid' : ''
              }`}
              placeholder="e.g. G4LA1234567"
              value={formData.engineNumber || ''}
              onChange={(e) => updateField('engineNumber', e.target.value)}
              required
            />
            {errors?.engineNumber && <div className="invalid-feedback">{errors.engineNumber}</div>}
          </div>

          {/* Chassis Number (VIN) */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Chassis Number (17-digit VIN) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control font-monospace rounded-3 py-2 text-uppercase ${
                errors?.chassisNumber ? 'is-invalid' : ''
              }`}
              placeholder="e.g. MALBA51BLM1234567"
              value={formData.chassisNumber || ''}
              onChange={(e) => updateField('chassisNumber', e.target.value.toUpperCase())}
              required
            />
            {errors?.chassisNumber && <div className="invalid-feedback">{errors.chassisNumber}</div>}
          </div>
        </div>
      </div>

      <hr className="my-1 text-muted opacity-25" />

      {/* 2. RC & Insurance Details */}
      <div>
        <h3 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
          2. RC & Insurance Details
        </h3>

        <div className="row g-3">
          {/* RC Availability / Status */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              RC Book Availability <span className="text-danger">*</span>
            </label>
            <select
              className="form-select rounded-3 py-2"
              value={formData.rcStatus || 'VALID'}
              onChange={(e) => updateField('rcStatus', e.target.value)}
            >
              <option value="VALID">Original RC Card / Book Available</option>
              <option value="DUPLICATE">Duplicate RC Issued</option>
              <option value="PENDING">RC Transfer In-Process</option>
              <option value="MISSING">RC Missing / NOC Pending</option>
            </select>
          </div>

          {/* RC Expiry Date */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              RC Validity / Expiry Date
            </label>
            <input
              type="date"
              className="form-control rounded-3 py-2"
              value={formData.rcExpiryDate || ''}
              onChange={(e) => updateField('rcExpiryDate', e.target.value)}
            />
          </div>

          {/* Insurance Type */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              Insurance Coverage Type
            </label>
            <select
              className="form-select rounded-3 py-2"
              value={formData.insuranceType || 'COMPREHENSIVE'}
              onChange={(e) => updateField('insuranceType', e.target.value)}
            >
              <option value="COMPREHENSIVE">Comprehensive (Full)</option>
              <option value="THIRD_PARTY">Third Party Only</option>
              <option value="ZERO_DEP">Zero Depreciation (Bumper to Bumper)</option>
              <option value="EXPIRED">Expired / Not Active</option>
            </select>
          </div>

          {/* Insurance Expiry Date */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              Insurance Expiry Date
            </label>
            <input
              type="date"
              className="form-control rounded-3 py-2"
              value={formData.insuranceExpiryDate || ''}
              onChange={(e) => updateField('insuranceExpiryDate', e.target.value)}
            />
          </div>

          {/* Insurance Provider */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Insurance Provider / Insurer
            </label>
            <input
              type="text"
              className="form-control rounded-3 py-2"
              placeholder="e.g. ICICI Lombard, HDFC ERGO, Bajaj Allianz, New India"
              value={formData.insuranceCompany || ''}
              onChange={(e) => updateField('insuranceCompany', e.target.value)}
            />
          </div>

          {/* Insurance Policy Number */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Policy Number
            </label>
            <input
              type="text"
              className="form-control rounded-3 py-2 font-monospace"
              placeholder="e.g. POL-9876543210/2026"
              value={formData.insurancePolicyNumber || ''}
              onChange={(e) => updateField('insurancePolicyNumber', e.target.value)}
            />
          </div>

          {/* PUC Validity Date */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Pollution (PUC) Expiry Date
            </label>
            <input
              type="date"
              className="form-control rounded-3 py-2"
              value={formData.pucExpiryDate || ''}
              onChange={(e) => updateField('pucExpiryDate', e.target.value)}
            />
          </div>

          {/* Hypothecation / Loan status */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Financier Hypothecation Status
            </label>
            <select
              className="form-select rounded-3 py-2"
              value={formData.hypothecationStatus || 'NONE'}
              onChange={(e) => updateField('hypothecationStatus', e.target.value)}
            >
              <option value="NONE">No Loan / Hypothecation Free</option>
              <option value="CLEARED">Cleared (Bank NOC & Form 35 Available)</option>
              <option value="ACTIVE">Active Bank Loan (Foreclosure Pending)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Transport Commercial Compliance (If Commercial / T-Board) */}
      {isCommercial && (
        <>
          <hr className="my-1 text-muted opacity-25" />
          <div className="p-3 rounded-4 bg-light border border-warning">
            <div className="d-flex align-items-center gap-2 mb-2 text-warning fw-bold">
              <AlertTriangle size={18} />
              <span>Commercial Transport (T-Board) Compliance Details</span>
            </div>
            <p className="text-muted small mb-3">
              Commercial transport vehicles require valid Fitness Certificate, Permit, and commercial road tax records.
            </p>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-dark mb-1">
                  Fitness Certificate Expiry Date
                </label>
                <input
                  type="date"
                  className="form-control rounded-3 py-2"
                  value={formData.fitnessExpiryDate || ''}
                  onChange={(e) => updateField('fitnessExpiryDate', e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-dark mb-1">
                  Permit Number & Type
                </label>
                <input
                  type="text"
                  className="form-control rounded-3 py-2"
                  placeholder="e.g. All India Tourist Permit / State Taxi"
                  value={formData.permitDetails || ''}
                  onChange={(e) => updateField('permitDetails', e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-dark mb-1">
                  Permit Expiry Date
                </label>
                <input
                  type="date"
                  className="form-control rounded-3 py-2"
                  value={formData.permitExpiryDate || ''}
                  onChange={(e) => updateField('permitExpiryDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <hr className="my-1 text-muted opacity-25" />

      {/* 4. Document Files Staging Upload */}
      <div>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <h3 className="h6 fw-bold text-dark text-uppercase mb-0 letter-spacing-wider">
              3. Document Uploads (RC, Insurance, NOC, Inspection)
            </h3>
            <p className="text-muted small mb-0">
              Attach scanned PDF or images of RC, Insurance, Seller ID, and NOC. Files will be securely linked to this vehicle record.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 rounded-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} /> Attach Document
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="d-none"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => handleDocSelect(e, 'RC')}
        />

        {docFiles.length > 0 ? (
          <div className="table-responsive border rounded-3 bg-white mt-2">
            <table className="table table-sm table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Doc Type</th>
                  <th>File Name</th>
                  <th>Size</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {docFiles.map((doc, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: '160px' }}
                        value={doc.type}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocFiles((prev) => {
                            const updated = [...prev];
                            updated[idx].type = val;
                            return updated;
                          });
                        }}
                      >
                        <option value="RC">RC Copy</option>
                        <option value="INSURANCE">Insurance Policy</option>
                        <option value="POLLUTION">PUC Certificate</option>
                        <option value="SELLER_ID">Seller ID Proof</option>
                        <option value="INVOICE">Purchase Invoice</option>
                        <option value="OTHER">NOC / Other</option>
                      </select>
                    </td>
                    <td className="fw-medium text-dark">{doc.name}</td>
                    <td className="text-muted">{(doc.size / 1024).toFixed(1)} KB</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => removeDoc(idx)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="border border-dashed rounded-4 p-4 text-center bg-light cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText size={28} className="text-muted mb-1 opacity-75" />
            <div className="small fw-semibold text-dark">Click to attach vehicle documents</div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
              PDF, JPEG, PNG supported. Stored securely and protected behind dealership staff authorization.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Step4RegistrationDocuments;
