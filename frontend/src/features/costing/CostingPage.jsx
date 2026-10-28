import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { vehicleService } from '../../services/vehicleService';
import { costingService } from '../../services/costingService';
import { usePermission } from '../../hooks/usePermission';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import {
  DollarSign,
  Plus,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  HandCoins,
  Scale,
  LineChart,
  ShieldAlert,
  Percent,
  CheckCircle2,
} from 'lucide-react';

const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  expenseDate: z.string().min(1, 'Date is required'),
  referenceNumber: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

const comparableSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  variant: z.string().optional(),
  manufacturingYear: z.number().optional(),
  odometerReading: z.number().optional(),
  vehicleCondition: z.string().default('GOOD'),
  location: z.string().optional(),
  askingPrice: z.number().min(1, 'Asking price is required'),
  listingSource: z.string().optional(),
  observationDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

export function CostingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();
  const canAddExpense = hasPermission('COSTING', 'ADD');

  const paramVehicleId = searchParams.get('vehicleId');

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(paramVehicleId || '');
  const [costing, setCosting] = useState(null);
  const [profitability, setProfitability] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [pricingAnalysis, setPricingAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pricing inputs
  const [markupPercent, setMarkupPercent] = useState('15.0');
  const [targetMarginPercent, setTargetMarginPercent] = useState('15.0');

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Add Market Comparable Modal
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isCompSubmitting, setIsCompSubmitting] = useState(false);
  const [compModalError, setCompModalError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'DETAILING_WASHING',
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 1500,
    },
  });

  const {
    register: registerComp,
    handleSubmit: handleSubmitComp,
    reset: resetComp,
    formState: { errors: errorsComp },
  } = useForm({
    resolver: zodResolver(comparableSchema),
    defaultValues: {
      vehicleCondition: 'GOOD',
      observationDate: new Date().toISOString().split('T')[0],
    },
  });

  // Load vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await vehicleService.getAllVehicles({ size: 100 });
        setVehicles(res.content || []);
        if (!selectedVehicleId && res.content?.length > 0) {
          setSelectedVehicleId(String(res.content[0].id));
        }
      } catch (err) {
        console.error('Failed to load vehicles', err);
      }
    };
    fetchVehicles();
  }, [selectedVehicleId]);

  // Load costing, profitability, and market pricing for selected vehicle
  const fetchCostingData = async () => {
    if (!selectedVehicleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [costRes, profitRes, expRes, priceRes] = await Promise.all([
        costingService.getVehicleCost(selectedVehicleId),
        costingService.getVehicleProfitability(selectedVehicleId),
        costingService.getExpenses({ vehicleId: selectedVehicleId, size: 50 }).catch(() => ({ content: [] })),
        costingService.getPricingAnalysis(selectedVehicleId, {
          markup: Number(markupPercent || 15),
          targetMargin: Number(targetMarginPercent || 15),
        }).catch(() => null),
      ]);
      setCosting(costRes);
      setProfitability(profitRes);
      setExpenses(expRes.content || []);
      setPricingAnalysis(priceRes);
    } catch (err) {
      setError(err.message || 'Failed to load vehicle costing breakdown');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCostingData();
  }, [selectedVehicleId, markupPercent, targetMarginPercent]);

  const onSubmitExpense = async (data) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      await costingService.addExpense({
        category: data.category,
        description: data.description || `${data.category} expense`,
        amount: Number(data.amount),
        expenseDate: data.expenseDate || new Date().toISOString().split('T')[0],
        vehicleId: selectedVehicleId ? Number(selectedVehicleId) : null,
        referenceNo: data.referenceNumber || '',
        paymentMethod: 'CASH',
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Expense Recorded',
          message: `Expense of ₹${data.amount} logged against vehicle.`,
        })
      );
      setIsModalOpen(false);
      reset();
      fetchCostingData();
    } catch (err) {
      setModalError(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitComparable = async (data) => {
    setIsCompSubmitting(true);
    setCompModalError(null);
    try {
      await costingService.addMarketComparable(selectedVehicleId, {
        make: data.make,
        model: data.model,
        variant: data.variant || null,
        manufacturingYear: data.manufacturingYear ? Number(data.manufacturingYear) : null,
        odometerReading: data.odometerReading ? Number(data.odometerReading) : null,
        vehicleCondition: data.vehicleCondition,
        location: data.location || null,
        askingPrice: Number(data.askingPrice),
        listingSource: data.listingSource || 'CarWale / Local Market',
        observationDate: data.observationDate || new Date().toISOString().split('T')[0],
        notes: data.notes || null,
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Comparable Added',
          message: `Market listing of ₹${data.askingPrice} recorded for benchmark pricing.`,
        })
      );
      setIsCompModalOpen(false);
      resetComp();
      fetchCostingData();
    } catch (err) {
      setCompModalError(err.message || 'Failed to add market comparable');
    } finally {
      setIsCompSubmitting(false);
    }
  };

  const isOwn = costing?.ownership === 'OWN';
  const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId));

  return (
    <div>
      <PageHeader
        title="Vehicle Costing & Profitability"
        subtitle="15-point itemized vehicle cost sheet, configurable markup and target margin pricing, and verified market rate comparisons"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Costing' }]}
      >
        <div className="d-flex align-items-center gap-2">
          {canAddExpense && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              onClick={() => {
                reset();
                setModalError(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={14} /> Add Refurbishment Expense
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => {
              resetComp({
                make: selectedVehicle?.brand || '',
                model: selectedVehicle?.model || '',
                variant: selectedVehicle?.variant || '',
                manufacturingYear: selectedVehicle?.manufacturingYear || 2021,
                observationDate: new Date().toISOString().split('T')[0],
              });
              setCompModalError(null);
              setIsCompModalOpen(true);
            }}
          >
            <Plus size={14} /> Add Market Listing
          </button>
        </div>
      </PageHeader>

      {/* Vehicle Picker Toolbar */}
      <div className="app-card p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <label className="form-label small fw-semibold text-muted mb-1" htmlFor="vehSelect">
              Select Vehicle for Cost Sheet & Pricing
            </label>
            <select
              id="vehSelect"
              className="form-select"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {v.brand} {v.model} ({v.ownership}) • Status: {v.status}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1" htmlFor="mInput">
              Markup % Formula
            </label>
            <div className="input-group">
              <input
                id="mInput"
                type="number"
                step="0.5"
                className="form-control font-monospace"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
              />
              <span className="input-group-text">%</span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1" htmlFor="gmInput">
              Target Margin % Formula
            </label>
            <div className="input-group">
              <input
                id="gmInput"
                type="number"
                step="0.5"
                className="form-control font-monospace"
                value={targetMarginPercent}
                onChange={(e) => setTargetMarginPercent(e.target.value)}
              />
              <span className="input-group-text">%</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCostingData} />
      ) : (
        <div>
          {/* Executive KPI Summary */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-3">
              <div className="app-card p-3 border-start border-4 border-primary">
                <span className="text-muted small text-uppercase fw-semibold">Total Attributable Cost</span>
                <div className="h4 fw-bold mb-0 font-monospace text-dark mt-1">
                  <MoneyDisplay amount={costing?.totalVehicleCost || 0} />
                </div>
                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                  Acquisition + Parts + Labour + Expenses
                </span>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="app-card p-3 border-start border-4 border-info">
                <span className="text-muted small text-uppercase fw-semibold">Target Margin Price ({targetMarginPercent}%)</span>
                <div className="h4 fw-bold mb-0 font-monospace text-primary mt-1">
                  <MoneyDisplay amount={pricingAnalysis?.suggestedPriceGrossMargin || 0} />
                </div>
                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                  Expected Profit: <strong className="text-success"><MoneyDisplay amount={pricingAnalysis?.expectedProfitGrossMargin || 0} /></strong>
                </span>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="app-card p-3 border-start border-4 border-success">
                <span className="text-muted small text-uppercase fw-semibold">Markup Price ({markupPercent}%)</span>
                <div className="h4 fw-bold mb-0 font-monospace text-success mt-1">
                  <MoneyDisplay amount={pricingAnalysis?.suggestedPriceMarkup || 0} />
                </div>
                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                  Expected Margin: <strong>{pricingAnalysis?.grossMarginPercentageMarkup || 0}%</strong>
                </span>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="app-card p-3 border-start border-4 border-warning">
                <span className="text-muted small text-uppercase fw-semibold">Market Median Asking Price</span>
                <div className="h4 fw-bold mb-0 font-monospace text-dark mt-1">
                  {pricingAnalysis?.medianAskingPrice ? (
                    <MoneyDisplay amount={pricingAnalysis.medianAskingPrice} />
                  ) : (
                    <span className="text-muted fs-6">No Data</span>
                  )}
                </div>
                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                  {pricingAnalysis?.comparableListingsCount || 0} Comparable Listings
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Warning Banner if target price exceeds market */}
          {pricingAnalysis?.pricingWarning && (
            <div className="alert alert-warning border-warning-subtle d-flex align-items-center gap-3 p-3 rounded-3 mb-4">
              <AlertCircle size={24} className="text-warning flex-shrink-0" />
              <div>
                <strong className="d-block">Pricing Alert: Target Price Above Market Range</strong>
                <span className="small">{pricingAnalysis.warningMessage}</span>
              </div>
            </div>
          )}

          {/* Cost Sheet Table & Market Comparison Grid */}
          <div className="row g-4">
            {/* 1. Itemized Vehicle Cost Sheet */}
            <div className="col-12 col-lg-7">
              <div className="app-card h-100">
                <div className="app-card-header d-flex justify-content-between align-items-center">
                  <h3 className="app-card-title h6 fw-bold mb-0">Itemized Vehicle Cost Breakdown</h3>
                  <StatusBadge status={costing?.ownership} type="ownership" />
                </div>
                <div className="app-card-body p-0">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Cost Category</th>
                        <th>Classification</th>
                        <th className="text-end">Attributable Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>1. Acquisition / Purchase Cost</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Base price paid to seller</div>
                        </td>
                        <td>Capital Cost</td>
                        <td className="text-end font-monospace fw-bold">
                          <MoneyDisplay amount={costing?.purchasePrice || 0} />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>2. Purchase-Related Expenses</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Towing, verification & RTO transfer</div>
                        </td>
                        <td>Acquisition Exp</td>
                        <td className="text-end font-monospace">
                          <MoneyDisplay amount={costing?.purchaseExpenses || 0} />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>3. Spare Parts Consumed</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Parts issued from inventory to Job Cards</div>
                        </td>
                        <td>Refurbishment</td>
                        <td className="text-end font-monospace">
                          <MoneyDisplay amount={costing?.accessoriesCost || 0} />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>4. Labour & Workshop Charges</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>In-house mechanic & technician hours</div>
                        </td>
                        <td>Refurbishment</td>
                        <td className="text-end font-monospace">
                          <MoneyDisplay amount={costing?.labourCost || 0} />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>5. External Workshop / Repair Services</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Shop-borne outsourced job card costs</div>
                        </td>
                        <td>Job Card Services</td>
                        <td className="text-end font-monospace">
                          <MoneyDisplay
                            amount={Math.max(
                              0,
                              Number(costing?.shopRepairCost || 0) -
                                Number(costing?.accessoriesCost || 0) -
                                Number(costing?.labourCost || 0)
                            )}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>6. Detailing, Cleaning & Other Expenses</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Painting, washing & sale prep charges</div>
                        </td>
                        <td>Direct Expenses</td>
                        <td className="text-end font-monospace">
                          <MoneyDisplay amount={costing?.otherExpenses || 0} />
                        </td>
                      </tr>
                      <tr className="table-active border-top border-2">
                        <td colSpan="2" className="fw-bold">
                          TOTAL VEHICLE CAPITAL COST
                        </td>
                        <td className="text-end font-monospace fw-bold fs-6 text-primary">
                          <MoneyDisplay amount={costing?.totalVehicleCost || 0} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 2. Market Pricing & Comparable Listings */}
            <div className="col-12 col-lg-5">
              <div className="app-card h-100">
                <div className="app-card-header">
                  <h3 className="app-card-title h6 fw-bold mb-0">Market Pricing Benchmark</h3>
                </div>
                <div className="app-card-body p-3">
                  <div className="p-3 bg-light rounded-3 mb-3 small">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Observed Price Range:</span>
                      <strong className="font-monospace text-dark">{pricingAnalysis?.competitivePriceRange}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Lowest Asking Price:</span>
                      <span className="font-monospace">
                        {pricingAnalysis?.lowestObservedAskingPrice ? <MoneyDisplay amount={pricingAnalysis.lowestObservedAskingPrice} /> : '—'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Highest Asking Price:</span>
                      <span className="font-monospace">
                        {pricingAnalysis?.highestObservedAskingPrice ? <MoneyDisplay amount={pricingAnalysis.highestObservedAskingPrice} /> : '—'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-2">
                      <span className="text-muted">Median Market Asking Price:</span>
                      <strong className="font-monospace text-primary">
                        {pricingAnalysis?.medianAskingPrice ? <MoneyDisplay amount={pricingAnalysis.medianAskingPrice} /> : '—'}
                      </strong>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-2 small text-uppercase text-muted">
                    Verified Comparable Listings ({pricingAnalysis?.comparables?.length || 0})
                  </h6>
                  {(!pricingAnalysis || !pricingAnalysis.comparables || pricingAnalysis.comparables.length === 0) ? (
                    <div className="text-center py-4 text-muted small border rounded">
                      Insufficient market data. Click "Add Market Listing" above to input benchmark prices.
                    </div>
                  ) : (
                    <div className="overflow-auto" style={{ maxHeight: '280px' }}>
                      <table className="table table-sm small align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Model / Year</th>
                            <th>Source</th>
                            <th className="text-end">Asking Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(pricingAnalysis?.comparables || []).map((c) => (
                            <tr key={c.id}>
                              <td>
                                <div className="fw-semibold">{c.model} ({c.manufacturingYear || '—'})</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{c.location || 'Local'} • {c.odometerReading ? `${c.odometerReading} km` : '—'}</div>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border">{c.listingSource || 'Market'}</span>
                              </td>
                              <td className="text-end font-monospace fw-bold">
                                <MoneyDisplay amount={c.askingPrice} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Market Listing Modal */}
      {isCompModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Add Comparable Market Listing</h5>
                <button type="button" className="btn-close" onClick={() => setIsCompModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmitComp(onSubmitComparable)}>
                <div className="modal-body p-4">
                  {compModalError && <div className="alert alert-danger small py-2 px-3 mb-3">{compModalError}</div>}

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small" htmlFor="cMake">Make*</label>
                      <input id="cMake" type="text" className="form-control form-control-sm" {...registerComp('make')} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="cModel">Model*</label>
                      <input id="cModel" type="text" className="form-control form-control-sm" {...registerComp('model')} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="cYear">Manufacturing Year</label>
                      <input id="cYear" type="number" className="form-control form-control-sm" {...registerComp('manufacturingYear', { valueAsNumber: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="cPrice">Asking Price (₹)*</label>
                      <input id="cPrice" type="number" step="1000" className="form-control form-control-sm font-monospace" {...registerComp('askingPrice', { valueAsNumber: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="cSource">Listing Source</label>
                      <input id="cSource" type="text" className="form-control form-control-sm" placeholder="CarWale / Spinny / Dealer" {...registerComp('listingSource')} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small" htmlFor="cDate">Observation Date*</label>
                      <input id="cDate" type="date" className="form-control form-control-sm" {...registerComp('observationDate')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small" htmlFor="cNotes">Notes / Comparable Condition</label>
                      <input id="cNotes" type="text" className="form-control form-control-sm" placeholder="Condition, mileage remarks" {...registerComp('notes')} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIsCompModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isCompSubmitting}>
                    {isCompSubmitting ? 'Saving...' : 'Save Market Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1050 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Add Refurbishment Expense</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmit(onSubmitExpense)}>
                <div className="modal-body p-4">
                  {modalError && <div className="alert alert-danger small py-2 px-3 mb-3">{modalError}</div>}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="catSelect">Expense Category*</label>
                    <select id="catSelect" className="form-select" {...register('category')}>
                      <option value="DETAILING_WASHING">Detailing, Washing & Cleaning</option>
                      <option value="PAINTING_DENTING">Painting, Denting & Bodywork</option>
                      <option value="MECHANICAL_REPAIR">External Workshop / Mechanic</option>
                      <option value="TRANSPORT_TOWING">Transport & Towing</option>
                      <option value="REGISTRATION_RTO">Registration & RTO Documentation</option>
                      <option value="SALE_PREPARATION">Pre-Delivery Inspection & Prep</option>
                      <option value="OTHER">Other Attributable Cost</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="expAmt">Amount (₹)*</label>
                    <input id="expAmt" type="number" step="0.01" className="form-control" {...register('amount', { valueAsNumber: true })} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="expDt">Date*</label>
                    <input id="expDt" type="date" className="form-control" {...register('expenseDate')} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="expDesc">Description*</label>
                    <textarea id="expDesc" rows="2" className="form-control" placeholder="Work description" {...register('description')} />
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CostingPage;
