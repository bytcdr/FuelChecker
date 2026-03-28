import client from './client.js';

export const authApi = {
  register: async (name, email, password) => {
    const res = await client.post('/auth/register', { name, email, password });
    return res.data;
  },
  login: async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    return res.data;
  },
  me: async (token) => {
    const res = await client.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
