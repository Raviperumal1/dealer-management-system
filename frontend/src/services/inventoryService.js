import apiClient from './apiClient';

export const inventoryService = {
  // Parts Master
  getAllParts: async (params = {}) => {
    const res = await apiClient.get('/parts', { params });
    return res.data;
  },

  getPartById: async (id) => {
    const res = await apiClient.get(`/parts/${id}`);
    return res.data;
  },

  createPart: async (payload) => {
    const res = await apiClient.post('/parts', payload);
    return res.data;
  },

  updatePart: async (id, payload) => {
    const res = await apiClient.put(`/parts/${id}`, payload);
    return res.data;
  },

  adjustStock: async (payload) => {
    const res = await apiClient.post('/parts/adjust', payload);
    return res.data;
  },

  getLowStockParts: async () => {
    const res = await apiClient.get('/stock/low-stock');
    return res.data;
  },

  getStockMovements: async (params = {}) => {
    const res = await apiClient.get('/stock/movements', { params });
    return res.data;
  },

  getInventoryMetrics: async () => {
    const res = await apiClient.get('/stock/metrics');
    return res.data;
  },

  // Suppliers Master
  getAllSuppliers: async (params = {}) => {
    const res = await apiClient.get('/suppliers', { params });
    return res.data;
  },

  getSupplierById: async (id) => {
    const res = await apiClient.get(`/suppliers/${id}`);
    return res.data;
  },

  createSupplier: async (payload) => {
    const res = await apiClient.post('/suppliers', payload);
    return res.data;
  },

  updateSupplier: async (id, payload) => {
    const res = await apiClient.put(`/suppliers/${id}`, payload);
    return res.data;
  },

  deactivateSupplier: async (id) => {
    const res = await apiClient.patch(`/suppliers/${id}/deactivate`);
    return res.data;
  },

  getSupplierLedger: async (id, params = {}) => {
    const res = await apiClient.get(`/suppliers/${id}/ledger`, { params });
    return res.data;
  },

  getSupplierStatement: async (id, params = {}) => {
    const res = await apiClient.get(`/suppliers/${id}/statement`, { params });
    return res.data;
  },

  getSupplierPayments: async (id, params = {}) => {
    const res = await apiClient.get(`/suppliers/${id}/payments`, { params });
    return res.data;
  },

  // Purchase Invoices & Orders
  getAllPurchaseInvoices: async (params = {}) => {
    const res = await apiClient.get('/purchase-invoices', { params });
    return res.data;
  },

  getPurchaseInvoiceById: async (id) => {
    const res = await apiClient.get(`/purchase-invoices/${id}`);
    return res.data;
  },

  createPurchaseInvoice: async (payload) => {
    const res = await apiClient.post('/purchase-invoices', payload);
    return res.data;
  },

  postPurchaseInvoice: async (id) => {
    const res = await apiClient.post(`/purchase-invoices/${id}/post`);
    return res.data;
  },

  cancelPurchaseInvoice: async (id, reason) => {
    const res = await apiClient.post(`/purchase-invoices/${id}/cancel`, null, { params: { reason } });
    return res.data;
  },

  // Supplier Payments
  recordSupplierPayment: async (payload) => {
    const res = await apiClient.post('/supplier-payments', payload);
    return res.data;
  },

  getAllSupplierPayments: async (params = {}) => {
    const res = await apiClient.get('/supplier-payments', { params });
    return res.data;
  },
};

export default inventoryService;
