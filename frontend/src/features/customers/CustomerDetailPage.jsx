import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatPhone, formatRegNumber } from '../../utils/formatters';
import { formatDate } from '../../utils/date';
import {
  User,
  ShoppingBag,
  CalendarCheck,
  CreditCard,
  History,
  PhoneCall,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Shield,
  Eye,
} from 'lucide-react';

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'bookings' | 'finance' | 'service' | 'followups'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomerData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [custData, histData] = await Promise.all([
        customerService.getCustomerById(id),
        customerService.getCustomerHistory(id).catch(() => null),
      ]);
      setCustomer(custData);
      setHistory(histData);
    } catch (err) {
      setError(err.message || 'Failed to load customer profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Customer 360° Profile" subtitle="Loading customer records..." />
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div>
        <PageHeader title="Customer 360° Profile" />
        <ErrorState message={error || 'Customer not found'} onRetry={fetchCustomerData} />
      </div>
    );
  }

  const sales = history?.sales || [];
  const bookings = history?.bookings || [];
  const financeArrangements = history?.financeArrangements || [];
  const serviceRecords = history?.serviceRecords || [];
  const followUps = history?.followUps || [];

  return (
    <div>
      <PageHeader
        title={customer.name || customer.fullName || 'Customer Details'}
        subtitle={`Customer ID: #${customer.id} • Registered on ${formatDate(customer.createdAt)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Customers', href: '/customers' },
          { label: customer.name || customer.fullName || 'Customer' },
        ]}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate('/customers')}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </PageHeader>

      {/* KYC Profile Card */}
      <div className="app-card p-4 mb-4">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-md-auto text-center text-md-start">
            <div
              className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold fs-2 shadow-xs"
              style={{ width: '70px', height: '70px' }}
            >
              {(customer.name || customer.fullName || 'C')[0]?.toUpperCase()}
            </div>
          </div>

          <div className="col-12 col-md flex-grow-1">
            <h2 className="h4 fw-bold text-dark mb-1 font-heading">{customer.name || customer.fullName || 'Customer'}</h2>
            <div className="d-flex flex-wrap gap-4 text-muted small mt-2">
              <div className="d-flex align-items-center gap-1">
                <Phone size={15} className="text-secondary" />
                <span className="font-monospace text-dark">{formatPhone(customer.mobile || customer.mobileNumber)}</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <Mail size={15} className="text-secondary" />
                <span>{customer.email || 'No email registered'}</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <MapPin size={15} className="text-secondary" />
                <span>{customer.address || customer.city || 'Address on file'}</span>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-auto border-top border-md-top-0 pt-3 pt-md-0 d-flex flex-wrap gap-2">
            <div className="badge bg-light text-dark border p-2 text-start">
              <span className="text-muted d-block small" style={{ fontSize: '0.7rem' }}>
                {customer.idProofType ? `${customer.idProofType} PROOF` : 'ID PROOF'}
              </span>
              <span className="font-monospace fw-bold">
                {customer.idProofNumber || customer.panNumber || customer.aadharNumber || 'NOT PROVIDED'}
              </span>
            </div>
            {customer.idProofType && customer.idProofNumber && (customer.panNumber || customer.aadharNumber) && (
              <div className="badge bg-light text-dark border p-2 text-start">
                <span className="text-muted d-block small" style={{ fontSize: '0.7rem' }}>ADDITIONAL KYC</span>
                <span className="font-monospace fw-bold">{customer.panNumber || customer.aadharNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 360 Degree History Tabs */}
      <div className="app-card">
        <div className="app-card-header p-0 px-3 border-bottom">
          <ul className="nav nav-tabs border-0" role="tablist">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-3 border-0 border-bottom border-2 ${
                  activeTab === 'sales' ? 'active border-primary text-primary fw-bold' : 'text-muted'
                }`}
                onClick={() => setActiveTab('sales')}
              >
                Purchased Vehicles ({sales.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-3 border-0 border-bottom border-2 ${
                  activeTab === 'bookings' ? 'active border-primary text-primary fw-bold' : 'text-muted'
                }`}
                onClick={() => setActiveTab('bookings')}
              >
                Bookings ({bookings.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-3 border-0 border-bottom border-2 ${
                  activeTab === 'finance' ? 'active border-primary text-primary fw-bold' : 'text-muted'
                }`}
                onClick={() => setActiveTab('finance')}
              >
                Finance & Loans ({financeArrangements.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-3 border-0 border-bottom border-2 ${
                  activeTab === 'service' ? 'active border-primary text-primary fw-bold' : 'text-muted'
                }`}
                onClick={() => setActiveTab('service')}
              >
                Service History ({serviceRecords.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link py-3 px-3 border-0 border-bottom border-2 ${
                  activeTab === 'followups' ? 'active border-primary text-primary fw-bold' : 'text-muted'
                }`}
                onClick={() => setActiveTab('followups')}
              >
                CRM Follow-ups ({followUps.length})
              </button>
            </li>
          </ul>
        </div>

        <div className="app-card-body p-0">
          {/* TAB 1: SALES */}
          {activeTab === 'sales' && (
            <div className="table-responsive">
              <table className="app-table table mb-0">
                <thead>
                  <tr>
                    <th>Sale Ref</th>
                    <th>Vehicle</th>
                    <th>Sale Date</th>
                    <th>Type</th>
                    <th className="text-end">Sale Amount</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length > 0 ? (
                    sales.map((s) => (
                      <tr key={s.id}>
                        <td className="fw-bold font-monospace">#{s.id}</td>
                        <td>
                          <div className="fw-semibold text-dark">{s.vehicleName}</div>
                          <span className="badge bg-light text-dark border font-monospace">
                            {formatRegNumber(s.registrationNumber)}
                          </span>
                        </td>
                        <td>{formatDate(s.saleDate)}</td>
                        <td><span className="badge bg-light text-dark border">{s.saleType}</span></td>
                        <td className="text-end fw-bold">
                          <MoneyDisplay amount={s.salePrice} />
                        </td>
                        <td><StatusBadge status={s.status} /></td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary p-1"
                            onClick={() => navigate(`/sales/${s.id}`)}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4 small">
                        No sales transactions recorded for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="table-responsive">
              <table className="app-table table mb-0">
                <thead>
                  <tr>
                    <th>Booking Ref</th>
                    <th>Vehicle</th>
                    <th>Booking Date</th>
                    <th className="text-end">Advance Token</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length > 0 ? (
                    bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="fw-bold font-monospace">#{b.id}</td>
                        <td>
                          <div className="fw-semibold text-dark">{b.vehicleName}</div>
                          <span className="badge bg-light text-dark border font-monospace">
                            {formatRegNumber(b.registrationNumber)}
                          </span>
                        </td>
                        <td>{formatDate(b.bookingDate)}</td>
                        <td className="text-end fw-bold text-success">
                          <MoneyDisplay amount={b.advanceAmount} />
                        </td>
                        <td><StatusBadge status={b.status} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4 small">
                        No vehicle bookings on record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: FINANCE */}
          {activeTab === 'finance' && (
            <div className="table-responsive">
              <table className="app-table table mb-0">
                <thead>
                  <tr>
                    <th>Loan Ref</th>
                    <th>Financier / Bank</th>
                    <th>Loan Amount</th>
                    <th>Monthly EMI</th>
                    <th>Tenure</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {financeArrangements.length > 0 ? (
                    financeArrangements.map((f) => (
                      <tr key={f.id}>
                        <td className="fw-bold font-monospace">#{f.id}</td>
                        <td className="fw-semibold text-dark">{f.bankName}</td>
                        <td className="fw-bold"><MoneyDisplay amount={f.loanAmount} /></td>
                        <td className="fw-bold text-primary"><MoneyDisplay amount={f.monthlyEmi} /></td>
                        <td>{f.tenureMonths} Months</td>
                        <td><StatusBadge status={f.status} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4 small">
                        No finance arrangements on record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: SERVICE HISTORY */}
          {activeTab === 'service' && (
            <div className="table-responsive">
              <table className="app-table table mb-0">
                <thead>
                  <tr>
                    <th>Service ID</th>
                    <th>Service Date</th>
                    <th>Kilometres</th>
                    <th>Complaint / Scope</th>
                    <th className="text-end">Total Amount</th>
                    <th>Next Service Date</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRecords.length > 0 ? (
                    serviceRecords.map((sr) => (
                      <tr key={sr.id}>
                        <td className="fw-bold font-monospace">#{sr.id}</td>
                        <td>{formatDate(sr.serviceDate)}</td>
                        <td>{sr.odometerReading} km</td>
                        <td className="small text-dark">{sr.customerComplaint}</td>
                        <td className="text-end fw-bold"><MoneyDisplay amount={sr.totalAmount} /></td>
                        <td className="text-primary fw-semibold">{formatDate(sr.nextServiceDueDate)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4 small">
                        No service history recorded for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: CRM FOLLOW-UPS */}
          {activeTab === 'followups' && (
            <div className="table-responsive">
              <table className="app-table table mb-0">
                <thead>
                  <tr>
                    <th>Follow-up ID</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Technician / Staff Remarks</th>
                    <th>Next Contact Date</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.length > 0 ? (
                    followUps.map((fu) => (
                      <tr key={fu.id}>
                        <td className="fw-bold font-monospace">#{fu.id}</td>
                        <td>{formatDate(fu.scheduledDate)}</td>
                        <td><StatusBadge status={fu.status} /></td>
                        <td className="small text-dark">{fu.remarks || '—'}</td>
                        <td className="text-primary fw-semibold">{formatDate(fu.nextFollowUpDate)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4 small">
                        No CRM follow-up calls logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailPage;
