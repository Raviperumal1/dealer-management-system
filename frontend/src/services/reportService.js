import apiClient from './apiClient';

export const reportService = {
  getVehicleReport: async (params = {}) => {
    const res = await apiClient.get('/reports/vehicles', { params });
    return res.data;
  },

  getSalesReport: async (params = {}) => {
    const res = await apiClient.get('/reports/sales', { params });
    return res.data;
  },

  getProfitReport: async (params = {}) => {
    const res = await apiClient.get('/reports/profit', { params });
    return res.data;
  },

  getBrokerReport: async (params = {}) => {
    const res = await apiClient.get('/reports/brokers', { params });
    return res.data;
  },

  getStockReport: async (params = {}) => {
    const res = await apiClient.get('/reports/stock', { params });
    return res.data;
  },

  getServiceReport: async (params = {}) => {
    const res = await apiClient.get('/reports/service', { params });
    return res.data;
  },

  exportExcel: async (type, params = {}) => {
    const res = await apiClient.get(`/reports/${type}/export/excel`, {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([res], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_report.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportPdf: async (type, params = {}) => {
    const res = await apiClient.get(`/reports/${type}/export/pdf`, {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([res], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default reportService;
