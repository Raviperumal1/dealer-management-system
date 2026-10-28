import apiClient from './apiClient';

export const jobCardService = {
  createJobCard: async (payload) => {
    const res = await apiClient.post('/job-cards', payload);
    return res.data;
  },

  getAllJobCards: async (params = {}) => {
    const res = await apiClient.get('/job-cards', { params });
    return res.data;
  },

  getJobCardById: async (id) => {
    const res = await apiClient.get(`/job-cards/${id}`);
    return res.data;
  },

  getJobCardsByVehicle: async (vehicleId) => {
    const res = await apiClient.get(`/job-cards/vehicle/${vehicleId}`);
    return res.data;
  },

  updateJobCard: async (id, payload) => {
    const res = await apiClient.put(`/job-cards/${id}`, payload);
    return res.data;
  },

  updateJobCardStatus: async (id, payload) => {
    const statusVal = payload.status || payload.targetStatus;
    const body = {
      status: statusVal,
      targetStatus: statusVal,
      remarks: payload.remarks || '',
      completionDate: payload.completionDate || (statusVal === 'COMPLETED' ? new Date().toISOString().split('T')[0] : null),
    };
    const res = await apiClient.patch(`/job-cards/${id}/status`, body);
    return res.data;
  },
};

export default jobCardService;
