import apiClient from './apiClient';

export const documentService = {
  uploadFile: async (file, category = 'GENERAL') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const res = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getFileDownloadUrl: (fileKey) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1.0';
    return `${baseUrl}/documents/${fileKey}/download`;
  },
};

export default documentService;
