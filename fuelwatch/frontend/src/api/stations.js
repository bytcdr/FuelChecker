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
  getBarangays: async () => {
    const res = await client.get('/stations/meta/barangays');
    return res.data;
  },
};
