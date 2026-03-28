import client from './client.js';

export const adminApi = {
  getDashboard: async () => {
    const res = await client.get('/admin/dashboard');
    return res.data;
  },
  getUsers: async () => {
    const res = await client.get('/admin/users');
    return res.data;
  },
  updateUser: async (id, data) => {
    const res = await client.put(`/admin/users/${id}`, data);
    return res.data;
  },
  getFuelProducts: async () => {
    const res = await client.get('/fuel-products/all');
    return res.data;
  },
  createFuelProduct: async (name) => {
    const res = await client.post('/fuel-products', { name });
    return res.data;
  },
  updateFuelProduct: async (id, data) => {
    const res = await client.put(`/fuel-products/${id}`, data);
    return res.data;
  },
};
