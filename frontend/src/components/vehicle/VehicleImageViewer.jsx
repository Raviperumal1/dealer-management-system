import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, AlertTriangle, ExternalLink, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { resolveImageUrl, formatRegNumber } from '../../utils/formatters';

/**
 * Enterprise Full-Resolution Vehicle Image Viewer Modal
 * Compliant with Phase 2 specifications:
 * - Clean white header with title and close button
 * - Centered viewport with neutral #f1f5f9 background
 * - Responsive sizing (height: min(75vh, 760px))
 * - object-fit: contain for portrait, landscape, and square images
 * - Escape key, backdrop click, loading state, and error recovery
 */
export function VehicleImageViewer({
  isOpen = false,
  onClose,
  imageUrl,
  title = 'Vehicle Photograph',
  registrationNumber,
  caption,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Reset state when a new image is loaded or modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoaded(false);
      setHasError(false);
      setZoomLevel(1);
    }
  }, [isOpen, imageUrl]);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const resolvedUrl = resolveImageUrl(imageUrl);

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.5 : 1));
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
  };

  return (
    <div
      className="vehicle-image-viewer__overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="vehicle-image-viewer__dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean White Modal Header */}
        <div className="vehicle-image-viewer__header">
          <div className="d-flex align-items-center gap-2.5 overflow-hidden">
            <div
              className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-2 p-1.5 flex-shrink-0"
              style={{ width: '32px', height: '32px' }}
            >
              <ImageIcon size={18} />
            </div>
            <div className="overflow-hidden">
              <div className="d-flex align-items-center gap-2">
                <h5 className="modal-title h6 fw-bold text-dark mb-0 text-truncate font-heading">
                  {title}
                </h5>
                {registrationNumber && (
                  <div className="license-plate-badge" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                    <span className="ind-tag">IND</span>
                    <span>{formatRegNumber(registrationNumber)}</span>
                  </div>
                )}
              </div>
              {caption && (
                <span className="text-muted small text-truncate d-block" style={{ fontSize: '0.75rem' }}>
                  {caption}
                </span>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
            {isLoaded && !hasError && (
              <>
                <button
                  type="button"
                  className={`btn btn-sm ${zoomLevel > 1 ? 'btn-primary' : 'btn-outline-secondary'} p-1.5`}
                  onClick={toggleZoom}
                  title={zoomLevel > 1 ? 'Reset Zoom (100%)' : 'Zoom In (150%)'}
                  aria-label="Toggle zoom"
                >
                  {zoomLevel > 1 ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                </button>
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-secondary p-1.5"
                  title="Open original file in new tab"
                  aria-label="Open original in new tab"
                >
                  <ExternalLink size={16} />
                </a>
              </>
            )}
            <button
              type="button"
              className="btn btn-sm btn-light border text-muted p-1.5 rounded-2"
              onClick={onClose}
              title="Close image viewer (Esc)"
              aria-label="Close"
              autoFocus
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewport with Neutral #f1f5f9 Background */}
        <div className="vehicle-image-viewer__viewport">
          {/* Loading Indicator */}
          {!isLoaded && !hasError && (
            <div className="d-flex flex-column align-items-center justify-content-center text-muted gap-2">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading full-resolution image...</span>
              </div>
              <span className="small text-muted" style={{ fontSize: '0.78rem' }}>
                Loading full-resolution vehicle photograph...
              </span>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="text-center p-4">
              <AlertTriangle size={36} className="text-danger mb-2 opacity-75" />
              <h6 className="fw-bold text-dark mb-1">Failed to load vehicle photograph</h6>
              <p className="text-muted small mb-3">
                The image file could not be retrieved from the dealership media repository.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
                onClick={handleRetry}
              >
                <RotateCcw size={14} /> Retry Loading
              </button>
            </div>
          )}

          {/* Full-Resolution Scaled Image */}
          {!hasError && (
            <img
              src={resolvedUrl}
              alt={title || 'Vehicle Photograph'}
              className="vehicle-image-viewer__image"
              style={{
                transform: `scale(${zoomLevel})`,
                display: isLoaded ? 'block' : 'none',
                cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
              }}
              onClick={toggleZoom}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(false);
              }}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="vehicle-image-viewer__footer">
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {zoomLevel > 1 ? 'Zoomed 150% — Click image to reset' : 'Click image to zoom (150%) • Press Esc to close'}
          </span>
          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
            Original Automotive Inventory Media
          </span>
        </div>
      </div>
    </div>
  );
}

export default VehicleImageViewer;
