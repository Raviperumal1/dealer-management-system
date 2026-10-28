import apiClient from './apiClient';

export const salesService = {
  // Bookings
  getAllBookings: async (params = {}) => {
    const res = await apiClient.get('/bookings', { params });
    return res.data;
  },

  getBookingById: async (id) => {
    const res = await apiClient.get(`/bookings/${id}`);
    return res.data;
  },

  createBooking: async (payload) => {
    const res = await apiClient.post('/bookings', payload);
    return res.data;
  },

  cancelBooking: async (id, reason) => {
    const res = await apiClient.post(`/bookings/${id}/cancel`, null, {
      params: { reason },
    });
    return res.data;
  },

  // Sales
  getAllSales: async (params = {}) => {
    const res = await apiClient.get('/sales', { params });
    return res.data;
  },

  getSaleById: async (id) => {
    if (!id || id === 'undefined') {
      throw new Error('Valid sale ID is required');
    }
    const res = await apiClient.get(`/sales/${id}`);
    return res.data;
  },

  confirmSale: async (payload) => {
    const res = await apiClient.post('/sales', payload);
    return res.data;
  },

  recordPayment: async (saleId, payload) => {
    if (!saleId || saleId === 'undefined') {
      throw new Error('Valid sale ID is required');
    }
    const res = await apiClient.post(`/sales/${saleId}/payments`, payload);
    return res.data;
  },

  getSalePayments: async (saleId) => {
    if (!saleId || saleId === 'undefined') {
      throw new Error('Valid sale ID is required');
    }
    const res = await apiClient.get(`/sales/${saleId}/payments`);
    return res.data;
  },

  deliverVehicle: async (saleId, payload) => {
    if (!saleId || saleId === 'undefined') {
      throw new Error('Valid sale ID is required');
    }
    const res = await apiClient.post(`/sales/${saleId}/deliveries`, payload);
    return res.data;
  },

  getSaleDelivery: async (saleId) => {
    if (!saleId || saleId === 'undefined') {
      throw new Error('Valid sale ID is required');
    }
    const res = await apiClient.get(`/sales/${saleId}/delivery`);
    return res.data;
  },
};

export default salesService;
