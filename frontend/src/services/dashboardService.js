import apiClient from './apiClient';

export const dashboardService = {
  getDashboardSummary: async () => {
    const res = await apiClient.get('/dashboard/summary');
    return res.data;
  },
};

export default dashboardService;
