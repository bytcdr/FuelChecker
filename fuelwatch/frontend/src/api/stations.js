import client from './client.js';

export const stationsApi = {
  getAll: async (params = {}) => {
    const res = await client.get('/stations', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await client.get(`/stations/${id}`);
    return res.data;
  },
  // User: submit a new station for approval
  submit: async (data) => {
    const res = await client.post('/stations/submit', data);
    return res.data;
  },
  getMySubmissions: async () => {
    const res = await client.get('/stations/my/submissions');
    return res.data;
  },
  // Admin
  adminGetAll: async (params = {}) => {
    const res = await client.get('/stations/admin/all', { params });
    return res.data;
  },
  adminGetPending: async () => {
    const res = await client.get('/stations/admin/pending');
    return res.data;
  },
  approve: async (id) => {
    const res = await client.put(`/stations/${id}/approve`);
    return res.data;
  },
  reject: async (id, rejection_note = '') => {
    const res = await client.put(`/stations/${id}/reject`, { rejection_note });
    return res.data;
  },
  create: async (data) => {
    const res = await client.post('/stations', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await client.put(`/stations/${id}`, data);
    return res.data;
  },
  deactivate: async (id) => {
    const res = await client.delete(`/stations/${id}`);
    return res.data;
  },
  getBrands: async () => {
    const res = await client.get('/stations/meta/brands');
    return res.data;
  },
  getCities: async () => {
    const res = await client.get('/stations/meta/cities');
    return res.data;
  },
  getBarangays: async () => {
    const res = await client.get('/stations/meta/barangays');
    return res.data;
  },
};
