import React from 'react';
import { Car, Bike, Check, Shield, Users, Info } from 'lucide-react';

export function Step1VehicleType({ formData, updateField, errors }) {
  const isBike = formData.type === 'BIKE';
  const isCar = formData.type === 'CAR';

  const handleTypeSelect = (type) => {
    updateField('type', type);
    // If two-wheeler is selected, enforce Private/Non-Transport
    if (type === 'BIKE' && formData.registrationCategory === 'COMMERCIAL') {
      updateField('registrationCategory', 'PRIVATE');
    }
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '920px' }}>
      {/* Step Header */}
      <div className="border-bottom pb-3 mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h2 className="fs-5 fw-bold text-dark mb-1">Vehicle Classification & Acquisition</h2>
            <p className="text-muted small mb-0">
              Select vehicle category, RTO registration class, and dealership acquisition channel.
            </p>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded-pill fw-medium small">
            Step 1 of 5
          </span>
        </div>
      </div>

      <div className="d-flex flex-column gap-4">
        {/* SECTION 1: VEHICLE TYPE */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label fw-bold text-dark fs-6 mb-0">
              1. Vehicle Type <span className="text-danger">*</span>
            </label>
            <span className="text-muted small">Choose category</span>
          </div>

          <div className="row g-3">
            {/* Four-Wheeler Option */}
            <div className="col-12 col-md-6">
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleTypeSelect('CAR')}
                onKeyDown={(e) => e.key === 'Enter' && handleTypeSelect('CAR')}
                className={`position-relative p-3 rounded-3 border transition-all h-100 d-flex flex-column justify-content-between ${
                  isCar
                    ? 'border-primary bg-white shadow-sm ring-1 ring-primary'
                    : 'border-light-subtle bg-white hover-border-secondary'
                }`}
                style={{
                  borderWidth: isCar ? '2px' : '1px',
                  borderColor: isCar ? '#2563eb' : '#e2e8f0',
                  cursor: 'pointer',
                  minHeight: '92px',
                  backgroundColor: isCar ? '#f8faff' : '#ffffff',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: isCar ? '#2563eb' : '#f1f5f9',
                      color: isCar ? '#ffffff' : '#475569',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Car size={22} />
                  </div>
                  <div className="flex-grow-1 pe-4">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-dark fs-6">Four-Wheeler</span>
                      <span className="badge bg-light text-secondary border small">Automobile</span>
                    </div>
                    <div className="text-muted small lh-sm">
                      Cars, SUVs, Sedans, Hatchbacks, MUVs and luxury personal passenger vehicles.
                    </div>
                  </div>
                </div>

                <div
                  className="position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: isCar ? '#2563eb' : '#f1f5f9',
                    color: isCar ? '#ffffff' : 'transparent',
                    border: isCar ? 'none' : '1px solid #cbd5e1',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Two-Wheeler Option */}
            <div className="col-12 col-md-6">
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleTypeSelect('BIKE')}
                onKeyDown={(e) => e.key === 'Enter' && handleTypeSelect('BIKE')}
                className={`position-relative p-3 rounded-3 border transition-all h-100 d-flex flex-column justify-content-between ${
                  isBike
                    ? 'border-primary bg-white shadow-sm ring-1 ring-primary'
                    : 'border-light-subtle bg-white hover-border-secondary'
                }`}
                style={{
                  borderWidth: isBike ? '2px' : '1px',
                  borderColor: isBike ? '#2563eb' : '#e2e8f0',
                  cursor: 'pointer',
                  minHeight: '92px',
                  backgroundColor: isBike ? '#f8faff' : '#ffffff',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: isBike ? '#2563eb' : '#f1f5f9',
                      color: isBike ? '#ffffff' : '#475569',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Bike size={22} />
                  </div>
                  <div className="flex-grow-1 pe-4">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-dark fs-6">Two-Wheeler</span>
                      <span className="badge bg-light text-secondary border small">Motorcycle</span>
                    </div>
                    <div className="text-muted small lh-sm">
                      Commuter bikes, premium motorcycles, scooters, and electric 2-wheelers.
                    </div>
                  </div>
                </div>

                <div
                  className="position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: isBike ? '#2563eb' : '#f1f5f9',
                    color: isBike ? '#ffffff' : 'transparent',
                    border: isBike ? 'none' : '1px solid #cbd5e1',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
          {errors?.type && <div className="text-danger small mt-2">{errors.type}</div>}
        </div>

        {/* SECTION 2: REGISTRATION CATEGORY */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label fw-bold text-dark fs-6 mb-0">
              2. Registration Category <span className="text-danger">*</span>
            </label>
            <span className="text-muted small">RTO License Plate Class</span>
          </div>

          <div className="row g-3">
            {/* Private Non-Transport */}
            <div className="col-12 col-md-6">
              <div
                role="button"
                tabIndex={0}
                onClick={() => updateField('registrationCategory', 'PRIVATE')}
                onKeyDown={(e) => e.key === 'Enter' && updateField('registrationCategory', 'PRIVATE')}
                className={`position-relative p-3 rounded-3 border transition-all h-100 d-flex flex-column justify-content-between ${
                  formData.registrationCategory === 'PRIVATE'
                    ? 'border-primary bg-white shadow-sm'
                    : 'border-light-subtle bg-white hover-border-secondary'
                }`}
                style={{
                  borderWidth: formData.registrationCategory === 'PRIVATE' ? '2px' : '1px',
                  borderColor: formData.registrationCategory === 'PRIVATE' ? '#2563eb' : '#e2e8f0',
                  cursor: 'pointer',
                  minHeight: '92px',
                  backgroundColor: formData.registrationCategory === 'PRIVATE' ? '#f8faff' : '#ffffff',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-2 border font-monospace fw-bold d-flex flex-column align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '54px',
                      height: '44px',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      borderColor: '#94a3b8',
                      fontSize: '0.68rem',
                      lineHeight: '1.1',
                    }}
                  >
                    <span>WHITE</span>
                    <span className="text-muted" style={{ fontSize: '0.6rem' }}>PLATE</span>
                  </div>
                  <div className="flex-grow-1 pe-4">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-dark fs-6">Private / Own Board</span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle small">
                        Non-Transport
                      </span>
                    </div>
                    <div className="text-muted small lh-sm">
                      Registered for personal & family usage. Standard for private cars and all bikes.
                    </div>
                  </div>
                </div>

                <div
                  className="position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: formData.registrationCategory === 'PRIVATE' ? '#2563eb' : '#f1f5f9',
                    color: formData.registrationCategory === 'PRIVATE' ? '#ffffff' : 'transparent',
                    border: formData.registrationCategory === 'PRIVATE' ? 'none' : '1px solid #cbd5e1',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Commercial Transport */}
            <div className="col-12 col-md-6">
              <div
                role="button"
                tabIndex={isBike ? -1 : 0}
                onClick={() => {
                  if (!isBike) updateField('registrationCategory', 'COMMERCIAL');
                }}
                onKeyDown={(e) => {
                  if (!isBike && e.key === 'Enter') updateField('registrationCategory', 'COMMERCIAL');
                }}
                className={`position-relative p-3 rounded-3 border transition-all h-100 d-flex flex-column justify-content-between ${
                  isBike
                    ? 'border-light bg-light opacity-50'
                    : formData.registrationCategory === 'COMMERCIAL'
                    ? 'border-primary bg-white shadow-sm'
                    : 'border-light-subtle bg-white hover-border-secondary'
                }`}
                style={{
                  borderWidth: formData.registrationCategory === 'COMMERCIAL' ? '2px' : '1px',
                  borderColor: formData.registrationCategory === 'COMMERCIAL' ? '#2563eb' : '#e2e8f0',
                  cursor: isBike ? 'not-allowed' : 'pointer',
                  minHeight: '92px',
                  backgroundColor: formData.registrationCategory === 'COMMERCIAL' ? '#f8faff' : isBike ? '#f8fafc' : '#ffffff',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-2 border font-monospace fw-bold d-flex flex-column align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '54px',
                      height: '44px',
                      backgroundColor: '#fef08a',
                      color: '#854d0e',
                      borderColor: '#eab308',
                      fontSize: '0.68rem',
                      lineHeight: '1.1',
                    }}
                  >
                    <span>YELLOW</span>
                    <span style={{ fontSize: '0.6rem' }}>T-BOARD</span>
                  </div>
                  <div className="flex-grow-1 pe-4">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-dark fs-6">Commercial / T-Board</span>
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle small">
                        Transport
                      </span>
                    </div>
                    <div className="text-muted small lh-sm">
                      {isBike
                        ? 'Not applicable for 2-wheelers in current dealership catalog.'
                        : 'Commercial taxis, fleet rentals, and permit vehicles. Requires fitness & commercial tax.'}
                    </div>
                  </div>
                </div>

                <div
                  className="position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: formData.registrationCategory === 'COMMERCIAL' ? '#2563eb' : '#f1f5f9',
                    color: formData.registrationCategory === 'COMMERCIAL' ? '#ffffff' : 'transparent',
                    border: formData.registrationCategory === 'COMMERCIAL' ? 'none' : '1px solid #cbd5e1',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
          {errors?.registrationCategory && (
            <div className="text-danger small mt-2">{errors.registrationCategory}</div>
          )}
        </div>

        {/* SECTION 3: OWNERSHIP CHANNEL */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label fw-bold text-dark fs-6 mb-0">
              3. Inventory Acquisition Channel <span className="text-danger">*</span>
            </label>
            <span className="text-muted small">Ownership model</span>
          </div>

          <div className="row g-3">
            {/* Dealership Own Stock */}
            <div className="col-12 col-md-6">
              <div
                role="button"
                tabIndex={0}
                onClick={() => updateField('ownership', 'OWN')}
                onKeyDown={(e) => e.key === 'Enter' && updateField('ownership', 'OWN')}
                className={`position-relative p-3 rounded-3 border transition-all h-100 d-flex flex-column justify-content-between ${
                  formData.ownership === 'OWN'
                    ? 'border-primary bg-white shadow-sm'
                    : 'border-light-subtle bg-white hover-border-secondary'
                }`}
                style={{
                  borderWidth: formData.ownership === 'OWN' ? '2px' : '1px',
                  borderColor: formData.ownership === 'OWN' ? '#2563eb' : '#e2e8f0',
                  cursor: 'pointer',
                  minHeight: '92px',
                  backgroundColor: formData.ownership === 'OWN' ? '#f8faff' : '#ffffff',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: formData.ownership === 'OWN' ? '#2563eb' : '#f1f5f9',
                      color: formData.ownership === 'OWN' ? '#ffffff' : '#475569',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Shield size={20} />
                  </div>
                  <div className="flex-grow-1 pe-4">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-dark fs-6">Dealership Outright Purchase</span>
                    </div>
                    <div className="text-muted small lh-sm">
                      Bought using dealership capital. Full company inventory asset on books.
                    </div>
                  </div>
                </div>

                <div
                  className="position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: formData.ownership === 'OWN' ? '#2563eb' : '#f1f5f9',
                    color: formData.ownership === 'OWN' ? '#ffffff' : 'transparent',
                    border: formData.ownership === 'OWN' ? 'none' : '1px solid #cbd5e1',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Broker Consignment */}
            <div className="col-12 col-md-6">
              <div
                role="button"
                tabIndex={0}
                onClick={() => updateField('ownership', 'BROKER')}
                onKeyDown={(e) => e.key === 'Enter' && updateField('ownership', 'BROKER')}
                className={`position-relative p-3 rounded-3 border transition-all h-100 d-flex flex-column justify-content-between ${
                  formData.ownership === 'BROKER'
                    ? 'border-warning bg-white shadow-sm'
                    : 'border-light-subtle bg-white hover-border-secondary'
                }`}
                style={{
                  borderWidth: formData.ownership === 'BROKER' ? '2px' : '1px',
                  borderColor: formData.ownership === 'BROKER' ? '#d97706' : '#e2e8f0',
                  cursor: 'pointer',
                  minHeight: '92px',
                  backgroundColor: formData.ownership === 'BROKER' ? '#fffdf5' : '#ffffff',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: formData.ownership === 'BROKER' ? '#d97706' : '#f1f5f9',
                      color: formData.ownership === 'BROKER' ? '#ffffff' : '#475569',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <div className="flex-grow-1 pe-4">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-dark fs-6">Broker Consignment Stock</span>
                    </div>
                    <div className="text-muted small lh-sm">
                      Vehicle placed by third-party broker on consignment. Commission paid on sale.
                    </div>
                  </div>
                </div>

                <div
                  className="position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: formData.ownership === 'BROKER' ? '#d97706' : '#f1f5f9',
                    color: formData.ownership === 'BROKER' ? '#ffffff' : 'transparent',
                    border: formData.ownership === 'BROKER' ? 'none' : '1px solid #cbd5e1',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
          {errors?.ownership && <div className="text-danger small mt-2">{errors.ownership}</div>}
        </div>

        {/* Selected Summary Card */}
        <div className="card border rounded-3 bg-light bg-opacity-50 mt-2">
          <div className="card-body p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                  style={{ width: '22px', height: '22px' }}
                >
                  <Check size={13} strokeWidth={2.5} />
                </div>
                <span className="fw-semibold text-dark small">Selected Setup:</span>
                <span className="text-dark small">
                  <strong>{isCar ? 'Four-Wheeler' : 'Two-Wheeler'}</strong>
                  {' • '}
                  {formData.registrationCategory === 'PRIVATE' ? 'Private (White Plate)' : 'Commercial (Yellow Plate)'}
                  {' • '}
                  {formData.ownership === 'OWN' ? 'Dealership Owned' : 'Broker Consignment'}
                </span>
              </div>
              <span className="text-muted small">Proceed to Step 2 to enter vehicle details</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step1VehicleType;
