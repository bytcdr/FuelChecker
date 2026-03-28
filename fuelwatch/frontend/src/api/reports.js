import client from './client.js';

export const reportsApi = {
  create: async (data) => {
    const res = await client.post('/reports', data);
    return res.data;
  },
  getAll: async (params = {}) => {
    const res = await client.get('/reports', { params });
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await client.put(`/reports/${id}/status`, { status });
    return res.data;
  },
};
