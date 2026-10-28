import apiClient from './apiClient';

export const authService = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  refreshToken: async (refreshToken) => {
    const res = await apiClient.post('/auth/refresh', { refreshToken });
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  getCurrentUser: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  changePassword: async (passwords) => {
    const res = await apiClient.post('/auth/change-password', passwords);
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (payload) => {
    const res = await apiClient.post('/auth/reset-password', payload);
    return res.data;
  },
};

export default authService;
