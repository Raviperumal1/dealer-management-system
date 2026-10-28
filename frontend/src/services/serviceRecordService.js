import apiClient from './apiClient';

export const serviceRecordService = {
  getAllServiceRecords: async (params = {}) => {
    const res = await apiClient.get('/service-records', { params });
    return res.data;
  },

  getServiceRecordById: async (id) => {
    const res = await apiClient.get(`/service-records/${id}`);
    return res.data;
  },

  createServiceRecord: async (payload) => {
    const res = await apiClient.post('/service-records', payload);
    return res.data;
  },

  getDueServices: async () => {
    const res = await apiClient.get('/service/due');
    return res.data;
  },

  getUpcomingServices: async (days = 7) => {
    const res = await apiClient.get('/service/upcoming', { params: { days } });
    return res.data;
  },

  getOverdueServices: async () => {
    const res = await apiClient.get('/service/overdue');
    return res.data;
  },

  // Customer Follow-ups
  getAllFollowUps: async (params = {}) => {
    const res = await apiClient.get('/follow-ups', { params });
    return res.data;
  },

  createFollowUp: async (payload) => {
    const res = await apiClient.post('/follow-ups', payload);
    return res.data;
  },

  updateFollowUp: async (id, payload) => {
    const res = await apiClient.put(`/follow-ups/${id}`, payload);
    return res.data;
  },
};

export default serviceRecordService;
