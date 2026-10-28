import apiClient from './apiClient';

export const vehicleService = {
  getAllVehicles: async (params = {}) => {
    const res = await apiClient.get('/vehicles', { params });
    return res.data;
  },

  getAvailableVehicles: async (params = {}) => {
    const res = await apiClient.get('/vehicles/available', { params });
    return res.data;
  },

  getVehicleById: async (id) => {
    const res = await apiClient.get(`/vehicles/${id}`);
    return res.data;
  },

  createVehicle: async (payload) => {
    const res = await apiClient.post('/vehicles', payload);
    return res.data;
  },

  updateVehicle: async (id, payload) => {
    const res = await apiClient.put(`/vehicles/${id}`, payload);
    return res.data;
  },

  updateVehicleStatus: async (id, payload) => {
    const res = await apiClient.patch(`/vehicles/${id}/status`, payload);
    return res.data;
  },

  getVehicleHistory: async (id) => {
    const res = await apiClient.get(`/vehicles/${id}/history`);
    return res.data;
  },

  uploadPhoto: async (vehicleId, formData) => {
    const res = await apiClient.post(`/vehicles/${vehicleId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  setPrimaryPhoto: async (vehicleId, photoId) => {
    const res = await apiClient.patch(`/vehicles/${vehicleId}/photos/${photoId}/primary`);
    return res.data;
  },

  deletePhoto: async (vehicleId, photoId) => {
    const res = await apiClient.delete(`/vehicles/${vehicleId}/photos/${photoId}`);
    return res.data;
  },

  uploadDocument: async (vehicleId, formData) => {
    const res = await apiClient.post(`/vehicles/${vehicleId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteDocument: async (vehicleId, docId) => {
    const res = await apiClient.delete(`/vehicles/${vehicleId}/documents/${docId}`);
    return res.data;
  },
};

export default vehicleService;
