import apiClient from './apiClient';

export const customerService = {
  getAllCustomers: async (params = {}) => {
    const res = await apiClient.get('/customers', { params });
    return res.data;
  },

  getCustomerById: async (id) => {
    const res = await apiClient.get(`/customers/${id}`);
    return res.data;
  },

  createCustomer: async (payload) => {
    const res = await apiClient.post('/customers', payload);
    return res.data;
  },

  updateCustomer: async (id, payload) => {
    const res = await apiClient.put(`/customers/${id}`, payload);
    return res.data;
  },

  getCustomerHistory: async (id) => {
    const res = await apiClient.get(`/customers/${id}/history`);
    return res.data;
  },
};

export default customerService;
