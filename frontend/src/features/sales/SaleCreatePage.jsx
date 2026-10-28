import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { vehicleService } from '../../services/vehicleService';
import { customerService } from '../../services/customerService';
import { salesService } from '../../services/salesService';
import { jobCardService } from '../../services/jobCardService';
import { financeService } from '../../services/financeService';
import { costingService } from '../../services/costingService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import { formatRegNumber } from '../../utils/formatters';
import { ShoppingCart, ArrowLeft, ArrowRight, Save, AlertCircle, CheckCircle2, Building, Calculator, ShieldCheck } from 'lucide-react';

export function SaleCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const prefilledVehicleId = searchParams.get('vehicleId');
  const prefilledSaleType = searchParams.get('type');

  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Form selections
  const [selectedVehicleId, setSelectedVehicleId] = useState(prefilledVehicleId || '');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Commercial Terms
  // 3 Payment Methods: 'DIRECT' | 'IN_HOUSE_FINANCE' | 'EXTERNAL_FINANCE'
  const [salePaymentMethod, setSalePaymentMethod] = useState(
    prefilledSaleType === 'FINANCE' ? 'IN_HOUSE_FINANCE' : 'DIRECT'
  );
  const [salePrice, setSalePrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [tradeInAllowance, setTradeInAllowance] = useState(0);
  const [notes, setNotes] = useState('');

  // Method 1: Direct payment terms
  const [initialPayment, setInitialPayment] = useState(50000);
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');

  // Method 2 & 3: Finance terms
  const [lenders, setLenders] = useState([]);
  const [selectedLenderId, setSelectedLenderId] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [downPayment, setDownPayment] = useState(100000);
  const [loanAmount, setLoanAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenureMonths, setTenureMonths] = useState(36);
  const [processingFee, setProcessingFee] = useState(0);
  const [includeFeeInPrincipal, setIncludeFeeInPrincipal] = useState(false);
  const [externalAppNumber, setExternalAppNumber] = useState('');
  const [sanctionedAmount, setSanctionedAmount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehRes, custRes, lendersRes] = await Promise.all([
          vehicleService.getAvailableVehicles({ size: 100 }),
          customerService.getAllCustomers({ size: 100 }),
          financeService.getLenders().catch(() => []),
        ]);
        setAvailableVehicles(vehRes.content || []);
        setCustomers(custRes.content || []);
        const lendersList = Array.isArray(lendersRes) ? lendersRes : lendersRes?.content || [];
        setLenders(lendersList);
        if (lendersList.length > 0) {
          setSelectedLenderId(String(lendersList[0].id));
          setBankName(lendersList[0].name);
          if (lendersList[0].indicativeRoi) setInterestRate(Number(lendersList[0].indicativeRoi));
        }

        const initialVehId = prefilledVehicleId || vehRes.content?.[0]?.id;
        if (initialVehId) {
          setSelectedVehicleId(String(initialVehId));
        }
        if (custRes.content?.length > 0) {
          setSelectedCustomerId(String(custRes.content[0].id));
        }
      } catch (err) {
        console.error('Failed to load vehicles, customers or lenders', err);
      }
    };
    loadData();
  }, [prefilledVehicleId]);

  const [vehicleRepairCost, setVehicleRepairCost] = useState(0);
  const [vehicleCostData, setVehicleCostData] = useState(null);

  // When selected vehicle changes, update defaults using authoritative backend costing
  useEffect(() => {
    if (!selectedVehicleId) return;
    const v = availableVehicles.find((item) => String(item.id) === String(selectedVehicleId));
    if (v) {
      setSelectedVehicle(v);
      const fallbackPrice = Number(v.sellingPrice || v.purchasePrice || 500000);

      // Fetch authoritative vehicle costing from backend costing service
      costingService.getVehicleCost(v.id)
        .then((costRes) => {
          setVehicleCostData(costRes);
          const finalizedCost = Number(costRes.finalizedDealerCost || costRes.totalVehicleCost || fallbackPrice);
          const finalizedRepairs = Number(costRes.shopRepairCost || 0);
          setVehicleRepairCost(finalizedRepairs);

          // Authoritative recommended price from backend (target gross margin or markup price)
          const authoritativePrice = Number(
            costRes.recommendedSellingPriceGrossMargin ||
            costRes.recommendedSellingPriceMarkup ||
            v.sellingPrice ||
            finalizedCost
          );

          setSalePrice(authoritativePrice);

          // Auto-calculate statutory 30% initial down payment
          const minThirtyPercent = Math.round(authoritativePrice * 0.3);
          setDownPayment(minThirtyPercent);
        })
        .catch(() => {
          setVehicleRepairCost(0);
          setSalePrice(fallbackPrice);
          const minThirtyPercent = Math.round(fallbackPrice * 0.3);
          setDownPayment(minThirtyPercent);
        });
    }
  }, [selectedVehicleId, availableVehicles]);

  // When selected customer changes
  useEffect(() => {
    if (!selectedCustomerId) return;
    const c = customers.find((item) => String(item.id) === String(selectedCustomerId));
    setSelectedCustomer(c || null);
  }, [selectedCustomerId, customers]);

  // Recalculate loan principal based on 3 payment modes
  useEffect(() => {
    const netPrice = Math.max(0, Number(salePrice) - Number(discountAmount));
    const baseFinanced = Math.max(0, netPrice - Number(downPayment) - Number(tradeInAllowance));
    const financedWithFees = includeFeeInPrincipal ? baseFinanced + Number(processingFee || 0) : baseFinanced;
    setLoanAmount(financedWithFees);
  }, [salePrice, discountAmount, downPayment, tradeInAllowance, processingFee, includeFeeInPrincipal, salePaymentMethod]);

  // Reducing-Balance Monthly EMI calculation
  const calculateEstimatedEmi = () => {
    if (!loanAmount || !tenureMonths || !interestRate) return 0;
    const monthlyRate = interestRate / 12 / 100;
    const emi =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
  };

  const finalNetSalePrice = Math.max(0, Number(salePrice) - Number(discountAmount));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedCustomerId) {
      setServerError('Please select both an available vehicle and a customer');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const calculatedEmi = calculateEstimatedEmi();

    // Map the 3 UI options to the backend SaleType (DIRECT vs FINANCE)
    const backendSaleType = salePaymentMethod === 'DIRECT' ? 'DIRECT' : 'FINANCE';

    // Agreed gross price before discount
    const payload = {
      vehicleId: Number(selectedVehicleId),
      customerId: Number(selectedCustomerId),
      saleDate: new Date().toISOString().split('T')[0],
      saleType: backendSaleType,
      agreedPrice: Number(salePrice),
      discountAmount: Number(discountAmount || 0),
      notes: notes || `Showroom vehicle sale contract [${salePaymentMethod}]`,
    };

    if (salePaymentMethod === 'DIRECT') {
      payload.initialPayment = Number(initialPayment || 0);
      payload.paymentMode = paymentMode;
      payload.paymentReference = paymentReference || undefined;
    } else if (salePaymentMethod === 'IN_HOUSE_FINANCE') {
      payload.financeCompany = 'DEALEROS In-House Finance';
      payload.loanAccountNumber = `DEALEROS-IH-${Date.now()}`;
      payload.downPayment = Number(downPayment || 0);
      payload.loanAmount = Number(loanAmount || 0);
      payload.interestRate = Number(interestRate || 10);
      payload.tenureMonths = Number(tenureMonths || 36);
      payload.emiAmount = Number(calculatedEmi || 0);
      payload.emiDueDay = 5;
      payload.loanStartDate = new Date().toISOString().split('T')[0];
      payload.financeType = 'IN_HOUSE';
    } else if (salePaymentMethod === 'EXTERNAL_FINANCE') {
      const lenderObj = lenders.find((l) => String(l.id) === String(selectedLenderId));
      payload.financeCompany = lenderObj?.name || bankName || 'Partner Bank / NBFC';
      payload.loanAccountNumber = externalAppNumber ? `EXT-${externalAppNumber}` : `EXT-${Date.now()}`;
      payload.downPayment = Number(downPayment || 0);
      payload.loanAmount = Number(loanAmount || 0);
      payload.interestRate = Number(interestRate || 9.5);
      payload.tenureMonths = Number(tenureMonths || 36);
      payload.emiAmount = Number(calculatedEmi || 0);
      payload.emiDueDay = 5;
      payload.loanStartDate = new Date().toISOString().split('T')[0];
      payload.financeType = 'EXTERNAL_BANK';
      if (selectedLenderId) {
        payload.lenderId = Number(selectedLenderId);
      }
    }

    try {
      const res = await salesService.confirmSale(payload);
      const saleId = res?.id || res?.data?.id;
      dispatch(
        addToast({
          type: 'success',
          title: 'Sale Confirmed',
          message: `Sale Order #${saleId || ''} confirmed successfully. Vehicle transitioned to SOLD.`,
        })
      );
      if (saleId) {
        navigate(`/sales/${saleId}`);
      } else {
        navigate('/sales');
      }
    } catch (err) {
      setServerError(
        err.message ||
          'Failed to confirm sale transaction. Another user may have just booked this vehicle.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Execute Vehicle Sale Order"
        subtitle="Finalize sale agreement, customer financing terms, token realization, and commission snapshots"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/sales' },
          { label: 'New Sale' },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate('/sales')}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </PageHeader>

      {serverError && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3">
          <AlertCircle size={16} className="text-danger flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            {/* STEP 1: VEHICLE SELECTION */}
            <div className="app-card p-4 mb-4">
              <h2 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
                1. Select Vehicle from Inventory
              </h2>
              <div className="mb-3">
                <label className="form-label" htmlFor="saleVehSelect">
                  Available Vehicle *
                </label>
                <select
                  id="saleVehSelect"
                  className="form-select"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  required
                >
                  <option value="">Select available stock...</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({formatRegNumber(v.registrationNumber)}) — [
                      {v.ownership}] — ₹{v.sellingPrice}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVehicle && (
                <div className="border rounded-3 p-3 bg-light d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <div className="fw-bold text-dark fs-6">
                      {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.manufacturingYear})
                    </div>
                    <div className="text-muted small">
                      Reg: <span className="font-monospace text-dark">{formatRegNumber(selectedVehicle.registrationNumber)}</span> •{' '}
                      {selectedVehicle.fuelType} • {selectedVehicle.transmission}
                    </div>
                    {vehicleRepairCost > 0 && (
                      <div className="small text-muted mt-1">
                        Base: <MoneyDisplay amount={selectedVehicle.sellingPrice || selectedVehicle.purchasePrice} /> + Refurbishment: <MoneyDisplay amount={vehicleRepairCost} />
                      </div>
                    )}
                  </div>
                  <div className="text-end">
                    <StatusBadge status={selectedVehicle.ownership} type="ownership" />
                    <div className="fw-bold fs-5 text-success font-monospace mt-1">
                      <MoneyDisplay amount={(selectedVehicle.sellingPrice || selectedVehicle.purchasePrice || 0) + vehicleRepairCost} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: CUSTOMER SELECTION */}
            <div className="app-card p-4 mb-4">
              <h2 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
                2. Customer Selection
              </h2>
              <div className="mb-3">
                <label className="form-label" htmlFor="saleCustSelect">
                  Customer Account *
                </label>
                <select
                  id="saleCustSelect"
                  className="form-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => {
                    const custName = c.fullName || c.name || 'Customer';
                    const custPhone = c.mobileNumber || c.mobile || '';
                    return (
                      <option key={c.id} value={c.id}>
                        {custName} {custPhone ? `(${custPhone})` : ''} — PAN: {c.panNumber || 'Pending'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedCustomer && (
                <div className="border rounded-3 p-3 bg-light small">
                  <div className="row g-2">
                    <div className="col-6">
                      <span className="text-muted d-block">Full Legal Name</span>
                      <span className="fw-bold text-dark">{selectedCustomer.name || selectedCustomer.fullName}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Mobile Contact</span>
                      <span className="font-monospace text-dark">{selectedCustomer.mobile || selectedCustomer.mobileNumber}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">ID Proof</span>
                      <span className="font-monospace text-dark">{selectedCustomer.idProofNumber || selectedCustomer.panNumber || 'N/A'}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Proof Type</span>
                      <span className="font-monospace text-dark">{selectedCustomer.idProofType || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: COMMERCIAL SALE TERMS & PAYMENT CHANNEL */}
            <div className="app-card p-4 mb-4">
              <h2 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
                3. Commercial Sale Structure & Channel
              </h2>

              <div className="mb-4">
                <label className="form-label d-block fw-semibold text-dark">Select Sales Payment Method *</label>
                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    <button
                      type="button"
                      className={`btn w-100 text-start p-3 h-100 border rounded-3 d-flex flex-column justify-content-between ${
                        salePaymentMethod === 'DIRECT'
                          ? 'btn-primary text-white shadow-sm'
                          : 'btn-outline-secondary text-dark bg-white'
                      }`}
                      onClick={() => setSalePaymentMethod('DIRECT')}
                    >
                      <div className="d-flex align-items-center justify-content-between w-100 mb-2">
                        <span className="fw-bold">1. Direct Payment</span>
                        <ShieldCheck size={18} />
                      </div>
                      <small className={salePaymentMethod === 'DIRECT' ? 'text-white-50' : 'text-muted'}>
                        Full or token settlement via Cash, UPI, Cheque or NEFT.
                      </small>
                    </button>
                  </div>

                  <div className="col-12 col-md-4">
                    <button
                      type="button"
                      className={`btn w-100 text-start p-3 h-100 border rounded-3 d-flex flex-column justify-content-between ${
                        salePaymentMethod === 'IN_HOUSE_FINANCE'
                          ? 'btn-primary text-white shadow-sm'
                          : 'btn-outline-secondary text-dark bg-white'
                      }`}
                      onClick={() => setSalePaymentMethod('IN_HOUSE_FINANCE')}
                    >
                      <div className="d-flex align-items-center justify-content-between w-100 mb-2">
                        <span className="fw-bold">2. In-House EMI</span>
                        <Calculator size={18} />
                      </div>
                      <small className={salePaymentMethod === 'IN_HOUSE_FINANCE' ? 'text-white-50' : 'text-muted'}>
                        Dealership financed loan. Monthly EMI collection by showroom.
                      </small>
                    </button>
                  </div>

                  <div className="col-12 col-md-4">
                    <button
                      type="button"
                      className={`btn w-100 text-start p-3 h-100 border rounded-3 d-flex flex-column justify-content-between ${
                        salePaymentMethod === 'EXTERNAL_FINANCE'
                          ? 'btn-primary text-white shadow-sm'
                          : 'btn-outline-secondary text-dark bg-white'
                      }`}
                      onClick={() => setSalePaymentMethod('EXTERNAL_FINANCE')}
                    >
                      <div className="d-flex align-items-center justify-content-between w-100 mb-2">
                        <span className="fw-bold">3. Bank / NBFC Loan</span>
                        <Building size={18} />
                      </div>
                      <small className={salePaymentMethod === 'EXTERNAL_FINANCE' ? 'text-white-50' : 'text-muted'}>
                        Sanctioned via external partner (HDFC, ICICI, Bajaj, etc).
                      </small>
                    </button>
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="salePriceInput">
                    Agreed Sale Price (₹) *
                  </label>
                  <input
                    id="salePriceInput"
                    type="number"
                    className="form-control fw-bold fs-6"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="discountAmtInput">
                    Special Discount (₹)
                  </label>
                  <input
                    id="discountAmtInput"
                    type="number"
                    className="form-control"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="tradeInInput">
                    Trade-In / Exchange Credit (₹)
                  </label>
                  <input
                    id="tradeInInput"
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={tradeInAllowance}
                    onChange={(e) => setTradeInAllowance(Number(e.target.value))}
                  />
                </div>
              </div>

              {salePaymentMethod === 'DIRECT' && (
                /* METHOD A: DIRECT SALE FIELDS */
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="h6 fw-bold text-primary mb-0">Direct Payment Terms & Receipt</h3>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      Zero Debt / Immediate Realization
                    </span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="initialPayInput">
                        Payment Received Upfront (₹)
                      </label>
                      <input
                        id="initialPayInput"
                        type="number"
                        className="form-control fw-bold"
                        value={initialPayment}
                        onChange={(e) => setInitialPayment(Number(e.target.value))}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="directPayModeSelect">
                        Payment Mode
                      </label>
                      <select
                        id="directPayModeSelect"
                        className="form-select"
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                      >
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                        <option value="CHEQUE">Cheque / Demand Draft</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Credit / Debit Card</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="directPayRefInput">
                        Payment Reference / UTR
                      </label>
                      <input
                        id="directPayRefInput"
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. UTR / Chq # / Txn ID"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {salePaymentMethod === 'IN_HOUSE_FINANCE' && (
                /* METHOD B: DEALEROS IN-HOUSE FINANCE */
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="h6 fw-bold text-primary mb-0">DEALEROS In-House EMI Financing Engine</h3>
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      Showroom Managed Loan Ledger
                    </span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label mb-0" htmlFor="inHouseDownPay">
                          Customer Down Payment (₹) *
                        </label>
                        <span className={`badge ${downPayment >= Math.round(salePrice * 0.3) ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} border`}>
                          {salePrice > 0 ? `${Math.round((downPayment / salePrice) * 100)}% of Selling Price` : 'Min 30%'}
                        </span>
                      </div>
                      <input
                        id="inHouseDownPay"
                        type="number"
                        className="form-control fw-bold"
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                        required
                      />
                      <div className="d-flex gap-1 mt-1">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary py-0 px-2 small"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => setDownPayment(Math.round(salePrice * 0.3))}
                        >
                          Min 30% (₹{Math.round(salePrice * 0.3).toLocaleString('en-IN')})
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary py-0 px-2 small"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => setDownPayment(Math.round(salePrice * 0.4))}
                        >
                          40%
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary py-0 px-2 small"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => setDownPayment(Math.round(salePrice * 0.5))}
                        >
                          50%
                        </button>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="inHouseProcessingFee">
                        Loan Processing Fee (₹)
                      </label>
                      <input
                        id="inHouseProcessingFee"
                        type="number"
                        className="form-control"
                        value={processingFee}
                        onChange={(e) => setProcessingFee(Number(e.target.value))}
                      />
                      <div className="form-check mt-1">
                        <input
                          id="feeInPrincipalCheck"
                          type="checkbox"
                          className="form-check-input"
                          checked={includeFeeInPrincipal}
                          onChange={(e) => setIncludeFeeInPrincipal(e.target.checked)}
                        />
                        <label className="form-check-label small text-muted" htmlFor="feeInPrincipalCheck">
                          Capitalize fee into financed principal
                        </label>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="inHousePrincipal">
                        Financed Principal (₹)
                      </label>
                      <input
                        id="inHousePrincipal"
                        type="number"
                        className="form-control fw-bold font-monospace bg-white"
                        value={loanAmount}
                        readOnly
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="inHouseRoi">
                        Interest Rate (Annual % Reducing) *
                      </label>
                      <input
                        id="inHouseRoi"
                        type="number"
                        step="0.1"
                        className="form-control"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="inHouseTenure">
                        Loan Tenure *
                      </label>
                      <select
                        id="inHouseTenure"
                        className="form-select"
                        value={tenureMonths}
                        onChange={(e) => setTenureMonths(Number(e.target.value))}
                      >
                        <option value="6">6 Months</option>
                        <option value="12">12 Months (1 Year)</option>
                        <option value="18">18 Months (1.5 Years)</option>
                        <option value="24">24 Months (2 Years)</option>
                        <option value="36">36 Months (3 Years)</option>
                        <option value="48">48 Months (4 Years)</option>
                        <option value="60">60 Months (5 Years)</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Monthly EMI Projection</label>
                      <div className="form-control fw-bold text-success bg-white font-monospace">
                        ₹{calculateEstimatedEmi().toLocaleString('en-IN')} / mo
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {salePaymentMethod === 'EXTERNAL_FINANCE' && (
                /* METHOD C: EXTERNAL BANK / NBFC FINANCE */
                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="h6 fw-bold text-primary mb-0">External Bank / NBFC Loan Facility</h3>
                    <span className="badge bg-info-subtle text-info border border-info-subtle">
                      Bank Disbursed to Dealership
                    </span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="lenderSelect">
                        Select Partner Bank / NBFC *
                      </label>
                      <select
                        id="lenderSelect"
                        className="form-select"
                        value={selectedLenderId}
                        onChange={(e) => {
                          setSelectedLenderId(e.target.value);
                          const chosen = lenders.find((l) => String(l.id) === e.target.value);
                          if (chosen) {
                            setBankName(chosen.name);
                            if (chosen.indicativeRoi) setInterestRate(Number(chosen.indicativeRoi));
                          }
                        }}
                      >
                        {lenders.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.lenderType || 'BANK'}) — Indicative: {l.indicativeRoi || '9.5'}%
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="extAppNum">
                        Bank Loan App / File Ref #
                      </label>
                      <input
                        id="extAppNum"
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. HDFC-AUTO-88991"
                        value={externalAppNumber}
                        onChange={(e) => setExternalAppNumber(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="extDownPay">
                        Customer Margin Money / Down Pay (₹) *
                      </label>
                      <input
                        id="extDownPay"
                        type="number"
                        className="form-control fw-bold"
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="extLoanAmt">
                        Requested / Financed Loan (₹)
                      </label>
                      <input
                        id="extLoanAmt"
                        type="number"
                        className="form-control fw-bold font-monospace bg-white"
                        value={loanAmount}
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="extTenure">
                        Proposed Tenure
                      </label>
                      <select
                        id="extTenure"
                        className="form-select"
                        value={tenureMonths}
                        onChange={(e) => setTenureMonths(Number(e.target.value))}
                      >
                        <option value="12">12 Months (1 Year)</option>
                        <option value="24">24 Months (2 Years)</option>
                        <option value="36">36 Months (3 Years)</option>
                        <option value="48">48 Months (4 Years)</option>
                        <option value="60">60 Months (5 Years)</option>
                        <option value="84">84 Months (7 Years)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTES */}
              <div className="mt-3">
                <label className="form-label" htmlFor="saleNotesInput">
                  Sale Contract & Agreement Notes
                </label>
                <textarea
                  id="saleNotesInput"
                  rows={2}
                  className="form-control"
                  placeholder="Additional contractual notes, delivery conditions or accessories agreed upon"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SUMMARY SIDEBAR */}
          <div className="col-12 col-lg-4">
            <div className="app-card p-4 position-sticky" style={{ top: '80px' }}>
              <h3 className="h6 fw-bold text-dark text-uppercase mb-3 letter-spacing-wider">
                Sale Transaction Summary
              </h3>

              <div className="d-flex flex-column gap-2 small border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Sale Price</span>
                  <span className="fw-semibold text-dark"><MoneyDisplay amount={salePrice} /></span>
                </div>
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount</span>
                    <span>- <MoneyDisplay amount={discountAmount} /></span>
                  </div>
                )}
                <div className="d-flex justify-content-between fw-bold fs-6">
                  <span className="text-dark">Net Payable</span>
                  <span className="text-dark"><MoneyDisplay amount={finalNetSalePrice} /></span>
                </div>
              </div>

              <div className="d-flex flex-column gap-2 small mb-4">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Payment Type</span>
                  <span className="fw-semibold text-primary">
                    {salePaymentMethod === 'DIRECT'
                      ? 'Direct Settlement'
                      : salePaymentMethod === 'IN_HOUSE_FINANCE'
                      ? 'In-House EMI Loan'
                      : 'Bank / NBFC Finance'}
                  </span>
                </div>
                {salePaymentMethod === 'DIRECT' ? (
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Outstanding Balance</span>
                    <span className="fw-bold text-danger">
                      <MoneyDisplay amount={Math.max(0, finalNetSalePrice - initialPayment - tradeInAllowance)} />
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Down Payment</span>
                      <span className="fw-bold text-success"><MoneyDisplay amount={downPayment} /></span>
                    </div>
                    {tradeInAllowance > 0 && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Trade-In Allowance</span>
                        <span className="fw-bold text-success"><MoneyDisplay amount={tradeInAllowance} /></span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Loan Financed</span>
                      <span className="fw-bold text-info"><MoneyDisplay amount={loanAmount} /></span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Monthly EMI</span>
                      <span className="fw-bold text-primary font-monospace">
                        ₹{calculateEstimatedEmi().toLocaleString('en-IN')} / mo
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-xs"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Executing Sale...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Confirm & Execute Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SaleCreatePage;
