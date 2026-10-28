import React, { useRef } from 'react';
import { Camera, Upload, Trash2, AlertCircle, Info, Sparkles } from 'lucide-react';

const COMMON_CAR_BRANDS = [
  'Maruti Suzuki',
  'Hyundai',
  'Tata',
  'Mahindra',
  'Kia',
  'Toyota',
  'Honda',
  'Volkswagen',
  'Skoda',
  'Renault',
  'MG',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
];

const COMMON_BIKE_BRANDS = [
  'Hero',
  'Honda',
  'TVS',
  'Bajaj',
  'Royal Enfield',
  'Yamaha',
  'Suzuki',
  'KTM',
  'Jawa',
  'Ather',
  'Ola Electric',
];

export function Step2VehicleDetails({
  formData,
  updateField,
  errors,
  photoFiles = [],
  setPhotoFiles,
}) {
  const fileInputRef = useRef(null);
  const isBike = formData.type === 'BIKE';
  const brandsList = isBike ? COMMON_BIKE_BRANDS : COMMON_CAR_BRANDS;

  // Handle local photo files for upload
  const handlePhotoSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotoFiles((prev) => [...prev, ...files]);
    }
  };

  const removePhoto = (index) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Brand, Model & Variant */}
      <div>
        <h3 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
          1. Brand, Model & Variant Specifications
        </h3>

        <div className="row g-3">
          {/* Brand with datalist */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Brand / Manufacturer <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              list="brandsDataList"
              className={`form-control rounded-3 py-2 ${errors?.brand ? 'is-invalid' : ''}`}
              placeholder="e.g. Hyundai, Honda, Hero"
              value={formData.brand || ''}
              onChange={(e) => updateField('brand', e.target.value)}
              required
            />
            <datalist id="brandsDataList">
              {brandsList.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            {errors?.brand && <div className="invalid-feedback">{errors.brand}</div>}
          </div>

          {/* Model */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Model <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control rounded-3 py-2 ${errors?.model ? 'is-invalid' : ''}`}
              placeholder={isBike ? 'e.g. Splendor Plus, Activa 6G, Classic 350' : 'e.g. Creta, Swift, Nexon, City'}
              value={formData.model || ''}
              onChange={(e) => updateField('model', e.target.value)}
              required
            />
            {errors?.model && <div className="invalid-feedback">{errors.model}</div>}
          </div>

          {/* Variant */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Variant / Trim
            </label>
            <input
              type="text"
              className="form-control rounded-3 py-2"
              placeholder={isBike ? 'e.g. Disc, Drum, Pro, Dual Channel ABS' : 'e.g. SX (O), VXi, XZ Plus, ZX'}
              value={formData.variant || ''}
              onChange={(e) => updateField('variant', e.target.value)}
            />
          </div>

          {/* Manufacturing Year */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              Manufacturing Year <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1995"
              max={new Date().getFullYear() + 1}
              className={`form-control rounded-3 py-2 ${errors?.manufacturingYear ? 'is-invalid' : ''}`}
              value={formData.manufacturingYear || ''}
              onChange={(e) => updateField('manufacturingYear', e.target.value)}
              required
            />
            {errors?.manufacturingYear && (
              <div className="invalid-feedback">{errors.manufacturingYear}</div>
            )}
          </div>

          {/* Registration Year */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              Registration Year <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1995"
              max={new Date().getFullYear() + 1}
              className={`form-control rounded-3 py-2 ${errors?.registrationYear ? 'is-invalid' : ''}`}
              value={formData.registrationYear || formData.manufacturingYear || ''}
              onChange={(e) => updateField('registrationYear', e.target.value)}
              required
            />
          </div>

          {/* Colour */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              Exterior Colour <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control rounded-3 py-2 ${errors?.color ? 'is-invalid' : ''}`}
              placeholder="e.g. Polar White, Metallic Grey"
              value={formData.color || ''}
              onChange={(e) => updateField('color', e.target.value)}
              required
            />
            {errors?.color && <div className="invalid-feedback">{errors.color}</div>}
          </div>

          {/* Number of Previous Owners */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              Number of Owners <span className="text-danger">*</span>
            </label>
            <select
              className="form-select rounded-3 py-2"
              value={formData.ownershipCount || '1st Owner'}
              onChange={(e) => updateField('ownershipCount', e.target.value)}
            >
              <option value="1st Owner">1st Owner</option>
              <option value="2nd Owner">2nd Owner</option>
              <option value="3rd Owner">3rd Owner</option>
              <option value="4th+ Owner">4th+ Owner</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="my-1 text-muted opacity-25" />

      {/* 2. Powertrain & Mechanicals */}
      <div>
        <h3 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
          2. Powertrain & Mechanical Specifications
        </h3>

        <div className="row g-3">
          {/* Fuel Type */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Fuel Type <span className="text-danger">*</span>
            </label>
            <select
              className="form-select rounded-3 py-2"
              value={formData.fuelType || 'PETROL'}
              onChange={(e) => updateField('fuelType', e.target.value)}
            >
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="ELECTRIC">Electric (EV)</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>

          {/* Transmission */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Transmission <span className="text-danger">*</span>
            </label>
            <select
              className="form-select rounded-3 py-2"
              value={formData.transmission || 'MANUAL'}
              onChange={(e) => updateField('transmission', e.target.value)}
            >
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automatic</option>
              <option value="CVT">CVT / e-CVT</option>
              <option value="IMT">Intelligent Manual (iMT)</option>
            </select>
          </div>

          {/* Engine Capacity (cc) */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-dark mb-1">
              Engine Displacement (CC)
            </label>
            <input
              type="number"
              className="form-control rounded-3 py-2"
              placeholder={isBike ? 'e.g. 125, 350' : 'e.g. 1197, 1498'}
              value={formData.engineCapacity || ''}
              onChange={(e) => updateField('engineCapacity', e.target.value)}
            />
          </div>

          {/* Odometer Reading (KM) */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Odometer Reading (KM) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="0"
              className={`form-control rounded-3 py-2 ${errors?.odometerKm ? 'is-invalid' : ''}`}
              placeholder="e.g. 42500"
              value={formData.odometerKm || ''}
              onChange={(e) => updateField('odometerKm', e.target.value)}
              required
            />
            {errors?.odometerKm && <div className="invalid-feedback">{errors.odometerKm}</div>}
          </div>

          {/* Vehicle Registration Status */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Registration Status <span className="text-danger">*</span>
            </label>
            <select
              className="form-select rounded-3 py-2"
              value={formData.registrationStatus || 'REGISTERED'}
              onChange={(e) => updateField('registrationStatus', e.target.value)}
            >
              <option value="REGISTERED">Registered (Has License Plate Number)</option>
              <option value="UNREGISTERED">Unregistered / Brand New (No Plate Yet)</option>
              <option value="PENDING">Registration In-Process / Transfer Awaiting</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="my-1 text-muted opacity-25" />

      {/* 3. Photos Upload Preview */}
      <div>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <h3 className="h6 fw-bold text-dark text-uppercase mb-0 letter-spacing-wider">
              3. Vehicle Photographs (Optional)
            </h3>
            <p className="text-muted small mb-0">
              Attach showcase photos (Front, Rear, Side, Odometer) for inventory listing and digital showroom.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 rounded-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={15} /> Select Photos
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="d-none"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotoSelect}
        />

        {photoFiles.length > 0 ? (
          <div className="row g-2 mt-1">
            {photoFiles.map((file, idx) => (
              <div key={idx} className="col-6 col-md-3 col-lg-2">
                <div className="position-relative border rounded-3 p-1 bg-light">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Vehicle upload preview ${idx + 1}`}
                    className="w-100 rounded-2 object-fit-cover"
                    style={{ height: '90px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0.5 rounded-circle"
                    style={{ width: '22px', height: '22px' }}
                    onClick={() => removePhoto(idx)}
                    title="Remove Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="small text-truncate d-block text-muted px-1 mt-1" style={{ fontSize: '0.7rem' }}>
                    {file.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="border border-dashed rounded-4 p-4 text-center bg-light cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={28} className="text-muted mb-1 opacity-75" />
            <div className="small fw-semibold text-dark">Click to select vehicle photos</div>
            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
              JPEG, PNG, WEBP supported. You can also upload photos later from the vehicle details page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Step2VehicleDetails;
