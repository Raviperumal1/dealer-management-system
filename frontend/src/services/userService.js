import apiClient from './apiClient';

export const userService = {
  // Users
  getAllUsers: async (params = {}) => {
    const res = await apiClient.get('/users', { params });
    return res.data;
  },

  getUserById: async (id) => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data;
  },

  createUser: async (payload) => {
    const res = await apiClient.post('/users', payload);
    return res.data;
  },

  updateUser: async (id, payload) => {
    const res = await apiClient.put(`/users/${id}`, payload);
    return res.data;
  },

  activateUser: async (id) => {
    const res = await apiClient.patch(`/users/${id}/activate`);
    return res.data;
  },

  deactivateUser: async (id) => {
    const res = await apiClient.patch(`/users/${id}/deactivate`);
    return res.data;
  },

  // Roles
  getAllRoles: async () => {
    const res = await apiClient.get('/roles');
    return res.data;
  },

  getRoleById: async (id) => {
    const res = await apiClient.get(`/roles/${id}`);
    return res.data;
  },

  createRole: async (payload) => {
    const res = await apiClient.post('/roles', payload);
    return res.data;
  },

  updateRole: async (id, payload) => {
    const res = await apiClient.put(`/roles/${id}`, payload);
    return res.data;
  },

  deleteRole: async (id) => {
    const res = await apiClient.delete(`/roles/${id}`);
    return res.data;
  },

  updateRolePermissions: async (id, permissions) => {
    const res = await apiClient.put(`/roles/${id}/permissions`, { permissions });
    return res.data;
  },

  // Menus
  getAllMenus: async () => {
    const res = await apiClient.get('/menus');
    return res.data;
  },

  getMyMenus: async () => {
    const res = await apiClient.get('/menus/me');
    return res.data;
  },
};

export default userService;
