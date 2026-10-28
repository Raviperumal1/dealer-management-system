import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { vehicleService } from '../../services/vehicleService';
import { brokerService } from '../../services/brokerService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import { VehicleRegistrationStepper, WIZARD_STEPS } from './wizard/VehicleRegistrationStepper';
import Step1VehicleType from './wizard/Step1VehicleType';
import Step2VehicleDetails from './wizard/Step2VehicleDetails';
import Step3Ownership from './wizard/Step3Ownership';
import Step4RegistrationDocuments from './wizard/Step4RegistrationDocuments';
import Step5PricingReview from './wizard/Step5PricingReview';
import Step6Confirmation from './wizard/Step6Confirmation';
import { ArrowLeft, ArrowRight, Save, X, AlertCircle } from 'lucide-react';

const DRAFT_STORAGE_KEY = 'automanage_vehicle_wizard_draft';

const INITIAL_FORM_DATA = {
  type: 'CAR',
  registrationCategory: 'PRIVATE',
  ownership: 'OWN',
  brand: '',
  model: '',
  variant: '',
  manufacturingYear: new Date().getFullYear(),
  registrationYear: new Date().getFullYear(),
  color: 'White',
  ownershipCount: '1st Owner',
  fuelType: 'PETROL',
  transmission: 'MANUAL',
  engineCapacity: '',
  odometerKm: 25000,
  registrationStatus: 'REGISTERED',
  // Own acquisition
  purchasePrice: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  purchaseExpenses: '',
  sellerName: '',
  sellerPhone: '',
  sellerAddress: '',
  purchaseRemarks: '',
  // Broker consignment
  brokerId: '',
  brokerAskingPrice: '',
  commissionType: 'FIXED',
  commissionValue: 15000,
  listingDate: new Date().toISOString().split('T')[0],
  consignmentRef: '',
  // Identification & RC
  registrationNumber: '',
  engineNumber: '',
  chassisNumber: '',
  rcStatus: 'VALID',
  rcExpiryDate: '',
  insuranceType: 'COMPREHENSIVE',
  insuranceExpiryDate: '',
  insuranceCompany: '',
  insurancePolicyNumber: '',
  pucExpiryDate: '',
  hypothecationStatus: 'NONE',
  // Transport commercial compliance
  fitnessExpiryDate: '',
  permitDetails: '',
  permitExpiryDate: '',
  // Pricing
  sellingPrice: '',
  pricingFlexibility: 'SLIGHTLY_NEGOTIABLE',
};

export function VehicleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const queryOwnership = searchParams.get('ownership');

  const [currentStep, setCurrentStep] = useState(1);
  const [highestVisitedStep, setHighestVisitedStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [stepErrors, setStepErrors] = useState({});

  // Files staged during wizard
  const [photoFiles, setPhotoFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);

  // Async states
  const [brokers, setBrokers] = useState([]);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [createdVehicle, setCreatedVehicle] = useState(null);

  // Restore draft or query parameters if creating new
  useEffect(() => {
    if (!isEdit) {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
            setFormData((prev) => ({ ...prev, ...parsed }));
          }
        } catch (e) {
          console.warn('Could not parse saved vehicle draft', e);
        }
      }

      if (queryOwnership && (queryOwnership === 'OWN' || queryOwnership === 'BROKER')) {
        setFormData((prev) => ({ ...prev, ownership: queryOwnership }));
      }
    }
  }, [isEdit, queryOwnership]);

  // Load registered brokers for consignment dropdown
  const fetchBrokers = async () => {
    setIsLoadingBrokers(true);
    try {
      const res = await brokerService.getAllBrokers({ size: 100, active: true });
      const list = res?.content || res?.data?.content || (Array.isArray(res) ? res : []);
      setBrokers(list);
    } catch (err) {
      console.error('Failed to load brokers:', err);
    } finally {
      setIsLoadingBrokers(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // Load existing vehicle if editing
  useEffect(() => {
    if (isEdit) {
      const fetchVehicle = async () => {
        setIsLoadingVehicle(true);
        try {
          const v = await vehicleService.getVehicleById(id);
          setFormData({
            type: v.vehicleType || v.type || 'CAR',
            registrationCategory: v.vehicleType === 'CAR' ? 'PRIVATE' : 'PRIVATE',
            ownership: v.ownershipType || v.ownership || 'OWN',
            brand: v.brand || '',
            model: v.model || '',
            variant: v.variant || '',
            manufacturingYear: v.manufacturingYear || 2020,
            registrationYear: v.registrationYear || v.manufacturingYear || 2020,
            color: v.color || '',
            ownershipCount: '1st Owner',
            fuelType: v.fuelType || 'PETROL',
            transmission: v.transmission || 'MANUAL',
            engineCapacity: '',
            odometerKm: v.odometerReading || v.odometerKm || 0,
            registrationStatus: 'REGISTERED',
            purchasePrice: v.purchase?.purchasePrice || v.purchasePrice || '',
            purchaseDate: v.purchase?.purchaseDate || v.purchaseDate || '',
            purchaseExpenses: v.purchase?.purchaseExpenses || '',
            sellerName: v.purchase?.sellerName || v.sellerName || '',
            sellerPhone: v.purchase?.sellerPhone || '',
            sellerAddress: v.purchase?.sellerAddress || '',
            purchaseRemarks: v.purchase?.notes || v.purchaseRemarks || '',
            brokerId: v.brokerListing?.brokerId || v.brokerId || '',
            brokerAskingPrice: v.brokerListing?.askingPrice || v.brokerAskingPrice || '',
            commissionType: v.brokerListing?.commissionType || v.commissionType || 'FIXED',
            commissionValue: v.brokerListing?.commissionRate || v.commissionValue || '',
            listingDate: v.brokerListing?.listingDate || '',
            consignmentRef: '',
            registrationNumber: v.registrationNumber || '',
            engineNumber: v.engineNumber || '',
            chassisNumber: v.chassisNumber || '',
            rcStatus: v.rcStatus || 'VALID',
            rcExpiryDate: v.rcExpiryDate || '',
            insuranceType: 'COMPREHENSIVE',
            insuranceExpiryDate: v.insuranceValidityDate || v.insuranceExpiryDate || '',
            insuranceCompany: v.insuranceCompany || '',
            insurancePolicyNumber: v.insurancePolicyNumber || '',
            pucExpiryDate: '',
            hypothecationStatus: 'NONE',
            fitnessExpiryDate: '',
            permitDetails: '',
            permitExpiryDate: '',
            sellingPrice: v.sellingPrice || '',
            pricingFlexibility: 'SLIGHTLY_NEGOTIABLE',
          });
        } catch (err) {
          setGlobalError(err.message || 'Failed to load vehicle details');
        } finally {
          setIsLoadingVehicle(false);
        }
      };
      fetchVehicle();
    }
  }, [id, isEdit]);

  // Update a field in the form state and clear any specific error
  const updateField = (key, value) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-save draft if creating
      if (!isEdit && currentStep < 6) {
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          // ignore storage quota issues
        }
      }
      return next;
    });

    if (stepErrors[key]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Step-by-Step Validation before moving forward
  const validateStep = (stepNumber) => {
    const errs = {};

    if (stepNumber === 1) {
      if (!formData.type) errs.type = 'Vehicle type is required';
      if (!formData.registrationCategory) errs.registrationCategory = 'Registration category is required';
      if (!formData.ownership) errs.ownership = 'Ownership channel is required';
    }

    if (stepNumber === 2) {
      if (!formData.brand?.trim()) errs.brand = 'Brand / Manufacturer is required';
      if (!formData.model?.trim()) errs.model = 'Model name is required';
      if (!formData.manufacturingYear) errs.manufacturingYear = 'Manufacturing year is required';
      if (!formData.color?.trim()) errs.color = 'Exterior colour is required';
      if (formData.odometerKm === '' || Number(formData.odometerKm) < 0) {
        errs.odometerKm = 'Valid odometer reading (KM) is required';
      }
    }

    if (stepNumber === 3) {
      if (formData.ownership === 'OWN') {
        if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
          errs.purchasePrice = 'Purchase price is mandatory for own vehicle inventory';
        }
        if (!formData.purchaseDate) {
          errs.purchaseDate = 'Purchase date is required';
        }
        if (!formData.sellerName?.trim()) {
          errs.sellerName = 'Seller / Previous Owner name is required';
        }
      } else {
        if (!formData.brokerId) {
          errs.brokerId = 'Please select a registered consigning broker';
        }
        if (!formData.brokerAskingPrice || Number(formData.brokerAskingPrice) <= 0) {
          errs.brokerAskingPrice = 'Broker asking price / minimum payout is required';
        }
      }
    }

    if (stepNumber === 4) {
      if (formData.registrationStatus !== 'UNREGISTERED') {
        if (!formData.registrationNumber || formData.registrationNumber.length < 5) {
          errs.registrationNumber = 'Valid registration number is required (min 5 characters)';
        }
      }
      if (!formData.engineNumber?.trim()) {
        errs.engineNumber = 'Engine number is required for vehicle identification';
      }
      if (!formData.chassisNumber?.trim()) {
        errs.chassisNumber = 'Chassis number (VIN) is required';
      }
    }

    if (stepNumber === 5) {
      if (!formData.sellingPrice || Number(formData.sellingPrice) < 1000) {
        errs.sellingPrice = 'Target selling price must be at least ₹1,000';
      }
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setGlobalError(null);
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (nextStep > highestVisitedStep) {
        setHighestVisitedStep(nextStep);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setGlobalError('Please fill all required fields in this step before proceeding.');
    }
  };

  const handleBack = () => {
    setGlobalError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (stepId) => {
    if (stepId <= highestVisitedStep) {
      setCurrentStep(stepId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Form Submission
  const handleFinalSubmit = async () => {
    // Validate Step 5
    if (!validateStep(5)) {
      setGlobalError('Please fix validation errors on Step 5.');
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const regNoFormatted = formData.registrationNumber
        ? formData.registrationNumber.toUpperCase().replace(/\s+/g, '')
        : `PENDING-${Date.now()}`;

      if (isEdit) {
        const updatePayload = {
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          variant: formData.variant?.trim() || null,
          manufacturingYear: Number(formData.manufacturingYear),
          registrationYear: Number(formData.registrationYear || formData.manufacturingYear),
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          color: formData.color.trim(),
          odometerReading: Number(formData.odometerKm || 0),
          rcNumber: formData.rcNumber || null,
          rcExpiryDate: formData.rcExpiryDate || null,
          insurancePolicyNumber: formData.insurancePolicyNumber || null,
          insuranceValidityDate: formData.insuranceExpiryDate || null,
        };

        const updated = await vehicleService.updateVehicle(id, updatePayload);
        dispatch(
          addToast({
            type: 'success',
            title: 'Vehicle Updated',
            message: `${updated.brand} ${updated.model} specifications updated successfully.`,
          })
        );
        navigate(`/vehicles/${id}`);
      } else {
        const createPayload = {
          registrationNumber: regNoFormatted,
          vehicleType: formData.type,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          variant: formData.variant?.trim() || null,
          manufacturingYear: Number(formData.manufacturingYear),
          registrationYear: Number(formData.registrationYear || formData.manufacturingYear),
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          color: formData.color.trim(),
          odometerReading: Number(formData.odometerKm || 0),
          chassisNumber: formData.chassisNumber?.trim() || `CHAS-${Date.now()}`,
          engineNumber: formData.engineNumber?.trim() || `ENG-${Date.now()}`,
          rcNumber: formData.rcNumber || null,
          rcExpiryDate: formData.rcExpiryDate || null,
          insurancePolicyNumber: formData.insurancePolicyNumber || null,
          insuranceValidityDate: formData.insuranceExpiryDate || null,
          ownershipType: formData.ownership,
        };

        if (formData.ownership === 'OWN') {
          createPayload.purchasePrice = Number(formData.purchasePrice || formData.sellingPrice || 0);
          createPayload.purchaseDate = formData.purchaseDate || new Date().toISOString().split('T')[0];
          createPayload.sellerName = formData.sellerName?.trim() || 'Direct Seller';
          createPayload.sellerPhone = formData.sellerPhone?.trim() || '9876543210';
          createPayload.sellerAddress = formData.sellerAddress?.trim() || '';
          createPayload.purchaseExpenses = Number(formData.purchaseExpenses || 0);
          createPayload.purchaseNotes = formData.purchaseRemarks || '';
        } else {
          createPayload.brokerId = Number(formData.brokerId);
          createPayload.brokerAskingPrice = Number(formData.brokerAskingPrice || formData.sellingPrice || 0);
          createPayload.expectedSellingPrice = Number(formData.sellingPrice || 0);
          createPayload.commissionType = formData.commissionType || 'FIXED';
          createPayload.commissionRate = Number(formData.commissionValue || 0);
          createPayload.listingDate = formData.listingDate || new Date().toISOString().split('T')[0];
          createPayload.listingNotes = formData.purchaseRemarks || '';
        }

        const created = await vehicleService.createVehicle(createPayload);

        // Upload staged photos sequentially if any
        if (photoFiles.length > 0) {
          for (let i = 0; i < photoFiles.length; i++) {
            const file = photoFiles[i];
            const pForm = new FormData();
            pForm.append('file', file);
            pForm.append('caption', `Showroom View ${i + 1}`);
            pForm.append('isPrimary', i === 0 ? 'true' : 'false');
            try {
              await vehicleService.uploadPhoto(created.id, pForm);
            } catch (pErr) {
              console.warn('Failed to upload photo file', file.name, pErr);
            }
          }
        }

        // Upload staged documents sequentially if any
        if (docFiles.length > 0) {
          for (const doc of docFiles) {
            const dForm = new FormData();
            dForm.append('file', doc.file);
            dForm.append('documentType', doc.type || 'RC');
            dForm.append('documentName', doc.name);
            try {
              await vehicleService.uploadDocument(created.id, dForm);
            } catch (dErr) {
              console.warn('Failed to upload document file', doc.name, dErr);
            }
          }
        }

        // Clear draft
        localStorage.removeItem(DRAFT_STORAGE_KEY);

        setCreatedVehicle(created);
        setCurrentStep(6);
        setHighestVisitedStep(6);

        dispatch(
          addToast({
            type: 'success',
            title: 'Vehicle Registered',
            message: `${created.brand} ${created.model} successfully registered into inventory.`,
          })
        );
      }
    } catch (err) {
      setGlobalError(err.message || 'Failed to register vehicle. Please check duplicate records.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      dispatch(
        addToast({
          type: 'success',
          title: 'Draft Saved',
          message: 'Vehicle registration draft saved to local browser storage.',
        })
      );
    } catch (e) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Storage Error',
          message: 'Unable to save draft.',
        })
      );
    }
  };

  const handleClearDraftAndReset = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData(INITIAL_FORM_DATA);
    setPhotoFiles([]);
    setDocFiles([]);
    setCurrentStep(1);
    setHighestVisitedStep(1);
    setCreatedVehicle(null);
  };

  if (isLoadingVehicle) {
    return (
      <div>
        <PageHeader title="Edit Vehicle" subtitle="Loading record..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  return (
    <div className="container-fluid px-0 pb-5" style={{ maxWidth: '980px' }}>
      {/* Page Header */}
      <PageHeader
        title={isEdit ? 'Edit Vehicle Specifications' : 'Register Vehicle Inventory'}
        subtitle={
          isEdit
            ? 'Update vehicle details, registration, or commercial prices'
            : 'Guided 6-step registration wizard for cars, motorcycles, own-inventory and broker consignments'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Vehicles', href: '/vehicles' },
          { label: isEdit ? 'Edit' : 'Registration Wizard' },
        ]}
      >
        <div className="d-flex align-items-center gap-2">
          {!isEdit && currentStep < 6 && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-3"
              onClick={handleSaveDraft}
              title="Save current values to browser local storage"
            >
              Save Draft
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-3"
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft size={14} /> Vehicles List
          </button>
        </div>
      </PageHeader>

      {/* Stepper Header (Only shown during steps 1-5 or Confirmation) */}
      <VehicleRegistrationStepper
        currentStep={currentStep}
        onStepClick={handleStepClick}
        highestVisitedStep={highestVisitedStep}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4 rounded-3 shadow-sm">
          <AlertCircle size={16} className="text-danger flex-shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Step Content Container Card */}
      <div
        className="bg-white border rounded-4 p-4 p-md-5 mb-4 shadow-none"
        style={{ borderColor: '#e2e8f0', minHeight: '440px' }}
      >
        {currentStep === 1 && (
          <Step1VehicleType
            formData={formData}
            updateField={updateField}
            errors={stepErrors}
          />
        )}

        {currentStep === 2 && (
          <Step2VehicleDetails
            formData={formData}
            updateField={updateField}
            errors={stepErrors}
            photoFiles={photoFiles}
            setPhotoFiles={setPhotoFiles}
          />
        )}

        {currentStep === 3 && (
          <Step3Ownership
            formData={formData}
            updateField={updateField}
            errors={stepErrors}
            brokers={brokers}
            isLoadingBrokers={isLoadingBrokers}
            fetchBrokers={fetchBrokers}
          />
        )}

        {currentStep === 4 && (
          <Step4RegistrationDocuments
            formData={formData}
            updateField={updateField}
            errors={stepErrors}
            docFiles={docFiles}
            setDocFiles={setDocFiles}
          />
        )}

        {currentStep === 5 && (
          <Step5PricingReview
            formData={formData}
            updateField={updateField}
            errors={stepErrors}
            photoFiles={photoFiles}
            docFiles={docFiles}
            onEditStep={(stepNum) => setCurrentStep(stepNum)}
          />
        )}

        {currentStep === 6 && (
          <Step6Confirmation
            createdVehicle={createdVehicle}
            onReset={handleClearDraftAndReset}
            onViewDetails={() => navigate(`/vehicles/${createdVehicle?.id}`)}
            onGoToInventory={() => navigate('/vehicles')}
          />
        )}
      </div>

      {/* Footer Navigation Bar (Steps 1 to 5) */}
      {currentStep < 6 && (
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 rounded-3"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary px-3 py-2 rounded-3"
                onClick={() => navigate('/vehicles')}
              >
                Cancel
              </button>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {currentStep < 5 ? (
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-semibold shadow-sm"
                style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                onClick={handleNext}
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-semibold shadow-sm"
                style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    Registering Vehicle...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Confirm & Register Vehicle
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleFormPage;
