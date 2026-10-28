import React from 'react';
import {
  Car,
  FileText,
  UserCheck,
  ShieldCheck,
  BadgePercent,
  CheckCircle2,
  Check,
} from 'lucide-react';

export const WIZARD_STEPS = [
  { id: 1, label: 'Vehicle Type', subtitle: 'Category & Source', icon: Car, key: 'type' },
  { id: 2, label: 'Vehicle Details', subtitle: 'Specs & Photos', icon: FileText, key: 'details' },
  { id: 3, label: 'Ownership', subtitle: 'Cost & Vendor', icon: UserCheck, key: 'ownership' },
  { id: 4, label: 'RC & Documents', subtitle: 'RTO & Insurance', icon: ShieldCheck, key: 'documents' },
  { id: 5, label: 'Pricing & Review', subtitle: 'Margin & Pricing', icon: BadgePercent, key: 'pricing' },
  { id: 6, label: 'Confirmation', subtitle: 'Final Register', icon: CheckCircle2, key: 'confirmation' },
];

export function VehicleRegistrationStepper({ currentStep, onStepClick, highestVisitedStep = 1 }) {
  // Calculate percentage of line to fill with active blue
  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100)
  );

  return (
    <div
      className="bg-white rounded-3 px-3 px-md-4 py-3 mb-3 border position-relative overflow-hidden"
      style={{
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Desktop & Tablet Stepper */}
      <div className="d-none d-md-block py-2">
        <div className="position-relative d-flex justify-content-between align-items-start px-3">
          {/* Background Connecting Bar */}
          <div
            className="position-absolute start-0 end-0"
            style={{
              top: '24px',
              left: '60px',
              right: '60px',
              height: '3px',
              backgroundColor: '#e2e8f0',
              borderRadius: '999px',
              zIndex: 1,
            }}
          >
            {/* Active Filled Progress Bar */}
            <div
              className="h-100"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: '#2563eb',
                borderRadius: '999px',
                transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>

          {/* Stepper Step Items */}
          {WIZARD_STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isPending = step.id > currentStep;
            const canNavigate = step.id <= highestVisitedStep && currentStep !== 6;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="d-flex flex-column align-items-center position-relative text-center"
                style={{
                  zIndex: 3,
                  cursor: canNavigate ? 'pointer' : 'default',
                  userSelect: 'none',
                  width: '130px',
                }}
                onClick={() => {
                  if (canNavigate && onStepClick) {
                    onStepClick(step.id);
                  }
                }}
              >
                {/* Stepper Circle Indicator */}
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center position-relative"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: isCurrent
                      ? '#2563eb'
                      : isCompleted
                      ? '#eff6ff'
                      : '#ffffff',
                    color: isCurrent
                      ? '#ffffff'
                      : isCompleted
                      ? '#2563eb'
                      : '#94a3b8',
                    border: isCurrent
                      ? '3px solid #bfdbfe'
                      : isCompleted
                      ? '2px solid #2563eb'
                      : '2px solid #cbd5e1',
                    boxShadow: isCurrent
                      ? '0 4px 14px rgba(37, 99, 235, 0.28)'
                      : isCompleted
                      ? '0 2px 6px rgba(37, 99, 235, 0.12)'
                      : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    transform: isCurrent ? 'scale(1.06)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {isCompleted ? (
                    <Check size={22} strokeWidth={2.8} />
                  ) : (
                    <Icon size={20} strokeWidth={isCurrent ? 2.2 : 1.8} />
                  )}

                  {/* Micro Step Number Badge on Active Step */}
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                    style={{
                      fontSize: '0.62rem',
                      padding: '2px 5px',
                      backgroundColor: isCurrent
                        ? '#1d4ed8'
                        : isCompleted
                        ? '#2563eb'
                        : '#94a3b8',
                      color: '#ffffff',
                      border: '1.5px solid #ffffff',
                    }}
                  >
                    0{step.id}
                  </span>
                </div>

                {/* Step Title & Subtitle */}
                <div className="mt-2.5 d-flex flex-column align-items-center">
                  <span
                    className="text-nowrap"
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: isCurrent ? '700' : isCompleted ? '600' : '500',
                      color: isCurrent
                        ? '#1e293b'
                        : isCompleted
                        ? '#334155'
                        : '#94a3b8',
                      letterSpacing: '-0.01em',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="text-nowrap"
                    style={{
                      fontSize: '0.68rem',
                      color: isCurrent ? '#2563eb' : '#94a3b8',
                      fontWeight: isCurrent ? '600' : '400',
                      marginTop: '1px',
                    }}
                  >
                    {step.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper View */}
      <div className="d-md-none py-1">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: '24px', height: '24px', fontSize: '0.72rem' }}
            >
              {currentStep}
            </span>
            <span className="fw-bold text-dark small">
              {WIZARD_STEPS[currentStep - 1]?.label}
            </span>
          </div>
          <span className="badge bg-light text-muted border small">
            Step {currentStep} of {WIZARD_STEPS.length}
          </span>
        </div>
        <div className="progress" style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px' }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{
              width: `${(currentStep / WIZARD_STEPS.length) * 100}%`,
              backgroundColor: '#2563eb',
              borderRadius: '999px',
            }}
            aria-valuenow={(currentStep / WIZARD_STEPS.length) * 100}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>
    </div>
  );
}

export default VehicleRegistrationStepper;

