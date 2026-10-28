import apiClient from './apiClient';

export const financeService = {
  getAllFinance: async (params = {}) => {
    const res = await apiClient.get('/finance', { params });
    return res.data;
  },

  getFinanceById: async (id) => {
    const res = await apiClient.get(`/finance/${id}`);
    return res.data;
  },

  getFinanceBySaleId: async (saleId) => {
    const res = await apiClient.get(`/finance/sale/${saleId}`);
    return res.data;
  },

  getOverdueEmis: async () => {
    const res = await apiClient.get('/finance/overdue');
    return res.data;
  },

  recordEmiPayment: async (emiId, paidDate = null) => {
    const params = paidDate ? { paidDate } : {};
    const res = await apiClient.post(`/finance/emis/${emiId}/pay`, null, { params });
    return res.data;
  },

  calculateEmi: async (payload) => {
    const rawAmount = payload.vehicleAmount ?? payload.saleAmount;
    const formatted = {
      vehicleAmount: Number(rawAmount || 0),
      downPayment: Number(payload.downPayment || 0),
      tradeInCredit: Number(payload.tradeInCredit || 0),
      financedFees: payload.capitalizeFee ? Number(payload.financedFees ?? payload.processingFee ?? 0) : 0,
      annualInterestRate: Number(payload.annualInterestRate ?? 9.5),
      tenureMonths: Number(payload.tenureMonths ?? 36),
      startDate: payload.startDate || new Date().toISOString().split('T')[0],
    };
    const res = await apiClient.post('/finance/calculate', formatted);
    return res?.data ?? res;
  },

  getActiveLenders: async () => {
    const res = await apiClient.get('/finance/lenders');
    return res.data;
  },

  getLenders: async () => {
    const res = await apiClient.get('/finance/lenders');
    return res.data;
  },

  createLender: async (payload) => {
    const res = await apiClient.post('/finance/lenders', payload);
    return res.data;
  },

  getApplications: async (params = {}) => {
    const res = await apiClient.get('/finance/applications', { params });
    return res.data;
  },

  getApplicationById: async (id) => {
    const res = await apiClient.get(`/finance/applications/${id}`);
    return res.data;
  },

  submitApplication: async (payload) => {
    const res = await apiClient.post('/finance/applications', payload);
    return res.data;
  },

  createApplication: async (payload) => {
    const res = await apiClient.post('/finance/applications', payload);
    return res.data;
  },

  sanctionApplication: async (id, payload) => {
    const res = await apiClient.post(`/finance/applications/${id}/sanction`, payload);
    return res.data;
  },

  disburseApplication: async (id, payload) => {
    const res = await apiClient.post(`/finance/applications/${id}/disburse`, payload);
    return res.data;
  },

  rejectApplication: async (id, reason) => {
    const res = await apiClient.post(`/finance/applications/${id}/reject`, null, { params: { reason } });
    return res.data;
  },

  getPreclosureEligibility: async (loanId, businessDate = null) => {
    const params = businessDate ? { businessDate } : {};
    const res = await apiClient.get(`/finance/${loanId}/eligibility`, { params });
    return res.data;
  },

  getForeclosureQuote: async (loanId) => {
    const res = await apiClient.get(`/finance/${loanId}/foreclosure-quote`);
    return res.data;
  },

  getLoanLedger: async (loanId) => {
    const res = await apiClient.get(`/finance/${loanId}/ledger`);
    return res.data;
  },

  closeLoan: async (loanId, payload) => {
    const res = await apiClient.post(`/finance/${loanId}/close`, payload);
    return res.data;
  },

  getDashboardMetrics: async () => {
    const res = await apiClient.get('/finance/metrics');
    return res.data;
  },

  getFinanceMetrics: async () => {
    const res = await apiClient.get('/finance/metrics');
    return res.data;
  },

  getPolicies: async () => {
    const res = await apiClient.get('/finance/policies');
    return res.data;
  },

  createPolicy: async (payload) => {
    const res = await apiClient.post('/finance/policies', payload);
    return res.data;
  },

  updatePolicy: async (id, payload) => {
    const res = await apiClient.put(`/finance/policies/${id}`, payload);
    return res.data;
  },

  // Lender Commissions, Invoicing, Receipts & Settlement APIs
  getCommissions: async (params = {}) => {
    const res = await apiClient.get('/finance/commissions', { params });
    return res.data;
  },

  getCommissionById: async (id) => {
    const res = await apiClient.get(`/finance/commissions/${id}`);
    return res.data;
  },

  calculateCommissionPreview: async (payload) => {
    const res = await apiClient.post('/finance/commissions/calculate', payload);
    return res.data;
  },

  createCommissionEntry: async (payload) => {
    const res = await apiClient.post('/finance/commissions', payload);
    return res.data;
  },

  approveCommission: async (id, remarks) => {
    const res = await apiClient.post(`/finance/commissions/${id}/approve`, { remarks });
    return res.data;
  },

  rejectCommission: async (id, remarks) => {
    const res = await apiClient.post(`/finance/commissions/${id}/reject`, { remarks });
    return res.data;
  },

  generateCommissionInvoice: async (id, payload) => {
    const res = await apiClient.post(`/finance/commissions/${id}/invoice`, payload);
    return res.data;
  },

  recordCommissionReceipt: async (id, payload) => {
    const res = await apiClient.post(`/finance/commissions/${id}/receipt`, payload);
    return res.data;
  },

  reverseCommission: async (id, reason) => {
    const res = await apiClient.post(`/finance/commissions/${id}/reverse`, { reason });
    return res.data;
  },

  getCommissionMetrics: async () => {
    const res = await apiClient.get('/finance/commissions/metrics');
    return res.data;
  },

  // Detailed EMI Payment
  recordDetailedEmiPayment: async (emiId, payload) => {
    const res = await apiClient.post(`/finance/emis/${emiId}/pay-detailed`, payload);
    return res.data;
  },

  // NOC Verification & Issuance
  checkNocEligibility: async (loanId) => {
    const res = await apiClient.get(`/finance/${loanId}/noc-eligibility`);
    return res.data;
  },

  issueNoc: async (loanId) => {
    const res = await apiClient.post(`/finance/${loanId}/noc`);
    return res.data;
  },

  getNocPdfUrl: (loanId) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1.0';
    return `${baseUrl}/finance/${loanId}/noc/pdf`;
  },

  getRepaymentSchedulePdfUrl: (loanId) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1.0';
    return `${baseUrl}/finance/${loanId}/schedule/pdf`;
  },

  // Centralized Loan Documents
  getLoanDocuments: async (params = {}) => {
    const res = await apiClient.get('/finance/documents', { params });
    return res.data;
  },

  uploadLoanDocument: async (loanId, formData) => {
    const res = await apiClient.post(`/finance/${loanId}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export default financeService;

