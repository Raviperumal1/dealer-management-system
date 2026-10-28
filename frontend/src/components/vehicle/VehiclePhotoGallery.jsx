import React, { useState, useRef } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { Camera, Upload, Trash2, Check, Star, ZoomIn, X, AlertCircle } from 'lucide-react';
import VehicleImageViewer from './VehicleImageViewer';

export function VehiclePhotoGallery({ vehicleId, photos = [], primaryPhotoUrl, onPhotosUpdated, canEdit = true }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedPhotoForViewer, setSelectedPhotoForViewer] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
      if (!caption) {
        // Default caption from filename without extension
        const name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setCaption(name.replace(/[-_]/g, ' '));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (caption) formData.append('caption', caption);
    formData.append('isPrimary', makePrimary ? 'true' : 'false');

    try {
      const updatedVehicle = await vehicleService.uploadPhoto(vehicleId, formData);
      setSelectedFile(null);
      setCaption('');
      setMakePrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onPhotosUpdated) onPhotosUpdated(updatedVehicle);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      const updatedVehicle = await vehicleService.setPrimaryPhoto(vehicleId, photoId);
      if (onPhotosUpdated) onPhotosUpdated(updatedVehicle);
    } catch (err) {
      setUploadError(err.message || 'Failed to update primary photo');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle photo?')) return;
    try {
      const updatedVehicle = await vehicleService.deletePhoto(vehicleId, photoId);
      if (onPhotosUpdated) onPhotosUpdated(updatedVehicle);
    } catch (err) {
      setUploadError(err.message || 'Failed to delete photo');
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Map to proxy
    if (url.startsWith('/documents/')) return `/api/v1.0${url}`;
    return url;
  };

  return (
    <div className="app-card mb-4">
      <div className="app-card-header d-flex justify-content-between align-items-center">
        <h3 className="app-card-title d-flex align-items-center gap-2">
          <Camera size={18} className="text-primary" /> Vehicle Photo Gallery
        </h3>
        <span className="badge bg-secondary-subtle text-secondary font-monospace">
          {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
        </span>
      </div>

      <div className="app-card-body">
        {uploadError && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3" role="alert">
            <AlertCircle size={16} className="text-danger flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload Dropzone / Action area */}
        {canEdit && (
          <form onSubmit={handleUpload} className="p-3 border rounded-3 bg-light mb-4">
            <div className="d-flex flex-column flex-md-row gap-3 align-items-start align-items-md-center">
              <div className="flex-grow-1 w-100">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="form-control form-control-sm"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>

              {selectedFile && (
                <>
                  <div style={{ minWidth: '180px' }}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Caption (e.g. Front View)"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                  <div className="form-check text-nowrap">
                    <input
                      type="checkbox"
                      id="makePrimaryCheck"
                      className="form-check-input"
                      checked={makePrimary || photos.length === 0}
                      onChange={(e) => setMakePrimary(e.target.checked)}
                      disabled={isUploading}
                    />
                    <label htmlFor="makePrimaryCheck" className="form-check-label small">
                      Set as Primary
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary d-flex align-items-center gap-1 text-nowrap"
                    disabled={isUploading}
                  >
                    <Upload size={14} />
                    {isUploading ? 'Uploading...' : 'Save Photo'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
            <div className="text-muted small mt-2" style={{ fontSize: '0.75rem' }}>
              Supported: JPEG, PNG, WEBP (Max 10MB). Photos are stored outside source code in the persistent media store.
            </div>
          </form>
        )}

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <div className="row g-3">
            {photos.map((photo) => {
              const fullUrl = formatImageUrl(photo.photoUrl);
              const isPrimary = photo.primary;

              return (
                <div key={photo.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className={`card h-100 border shadow-xs overflow-hidden ${isPrimary ? 'border-primary ring-2' : ''}`}>
                    <div className="position-relative bg-dark" style={{ height: '170px' }}>
                      <img
                        src={fullUrl}
                        alt={photo.caption || 'Vehicle photograph'}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setSelectedPhotoForViewer(photo)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        }}
                      />
                      {isPrimary && (
                        <span className="badge bg-primary position-absolute top-0 start-0 m-2 d-flex align-items-center gap-1 shadow-sm">
                          <Star size={12} fill="white" /> Primary Cover
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-dark bg-opacity-75 text-white position-absolute top-0 end-0 m-2 p-1 rounded-circle"
                        onClick={() => setSelectedPhotoForViewer(photo)}
                        title="View Full Size"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>

                    <div className="card-body p-2 d-flex justify-content-between align-items-center bg-white">
                      <span className="small text-truncate me-2 fw-medium" title={photo.caption || 'Vehicle photo'}>
                        {photo.caption || 'Vehicle photo'}
                      </span>
                      {canEdit && (
                        <div className="d-flex align-items-center gap-1">
                          {!isPrimary && (
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm p-1"
                              style={{ lineHeight: 1 }}
                              onClick={() => handleSetPrimary(photo.id)}
                              title="Make Primary Cover Photo"
                            >
                              <Star size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm p-1"
                            style={{ lineHeight: 1 }}
                            onClick={() => handleDeletePhoto(photo.id)}
                            title="Delete Photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed rounded-3 bg-light">
            <Camera size={36} className="text-muted mb-2 opacity-50" />
            <p className="text-muted small mb-1">No photographs uploaded for this vehicle yet.</p>
            <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
              Upload exterior, interior, and odometer photos for showroom presentation.
            </p>
          </div>
        )}
      </div>

      {/* Full-Resolution Vehicle Image Viewer Modal */}
      <VehicleImageViewer
        isOpen={Boolean(selectedPhotoForViewer)}
        onClose={() => setSelectedPhotoForViewer(null)}
        imageUrl={selectedPhotoForViewer?.photoUrl}
        caption={selectedPhotoForViewer?.caption}
        title="Vehicle Photograph"
      />
    </div>
  );
}

export default VehiclePhotoGallery;
