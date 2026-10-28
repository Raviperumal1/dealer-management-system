import apiClient from './apiClient';

export const costingService = {
  getVehicleCost: async (vehicleId) => {
    const res = await apiClient.get(`/vehicles/${vehicleId}/costing`);
    return res.data;
  },

  getVehicleProfitability: async (vehicleId) => {
    const res = await apiClient.get(`/vehicles/${vehicleId}/profitability`);
    return res.data;
  },

  getExpenses: async (params = {}) => {
    const res = await apiClient.get('/expenses', { params });
    return res.data;
  },

  addExpense: async (payload) => {
    const res = await apiClient.post('/expenses', payload);
    return res.data;
  },

  getPricingAnalysis: async (vehicleId, params = {}) => {
    const res = await apiClient.get(`/vehicles/${vehicleId}/pricing`, { params });
    return res.data;
  },

  getMarketComparables: async (vehicleId) => {
    const res = await apiClient.get(`/vehicles/${vehicleId}/comparables`);
    return res.data;
  },

  addMarketComparable: async (vehicleId, payload) => {
    const res = await apiClient.post(`/vehicles/${vehicleId}/comparables`, payload);
    return res.data;
  },
};

export default costingService;
