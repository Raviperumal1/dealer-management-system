import apiClient from './apiClient';

export const inspectionService = {
  createInspection: async (payload) => {
    const res = await apiClient.post('/inspections', payload);
    return res.data;
  },

  getInspectionById: async (id) => {
    const res = await apiClient.get(`/inspections/${id}`);
    return res.data;
  },

  getInspectionsByVehicle: async (vehicleId) => {
    const res = await apiClient.get(`/inspections/vehicle/${vehicleId}`);
    return res.data;
  },
};

export default inspectionService;
