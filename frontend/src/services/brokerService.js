import apiClient from './apiClient';

export const brokerService = {
  getAllBrokers: async (params = {}) => {
    const res = await apiClient.get('/brokers', { params });
    return res.data;
  },

  getBrokerById: async (id) => {
    const res = await apiClient.get(`/brokers/${id}`);
    return res.data;
  },

  createBroker: async (payload) => {
    const res = await apiClient.post('/brokers', payload);
    return res.data;
  },

  updateBroker: async (id, payload) => {
    const res = await apiClient.put(`/brokers/${id}`, payload);
    return res.data;
  },

  addBrokerVehicleListing: async (brokerId, payload) => {
    const res = await apiClient.post(`/brokers/${brokerId}/vehicles`, payload);
    return res.data;
  },

  getBrokerListings: async (brokerId) => {
    const res = await apiClient.get(`/brokers/${brokerId}/vehicles`);
    return res.data;
  },

  getBrokerDashboard: async (brokerId) => {
    const res = await apiClient.get(`/brokers/${brokerId}/dashboard`);
    return res.data;
  },

  getSettlements: async (params = {}) => {
    const res = await apiClient.get('/settlements', { params });
    return res.data;
  },

  getSettlementById: async (id) => {
    const res = await apiClient.get(`/settlements/${id}`);
    return res.data;
  },

  recordSettlementPayment: async (settlementId, payload) => {
    const res = await apiClient.post(`/settlements/${settlementId}/payments`, payload);
    return res.data;
  },
};

export default brokerService;
