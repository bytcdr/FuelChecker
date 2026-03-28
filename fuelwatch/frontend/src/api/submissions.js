import client from './client.js';

export const submissionsApi = {
  getMy: async () => {
    const res = await client.get('/submissions/my');
    return res.data;
  },
  submit: async (formData) => {
    const res = await client.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getPending: async () => {
    const res = await client.get('/submissions/pending');
    return res.data;
  },
  getAll: async (params = {}) => {
    const res = await client.get('/submissions', { params });
    return res.data;
  },
  approve: async (id) => {
    const res = await client.put(`/submissions/${id}/approve`);
    return res.data;
  },
  reject: async (id, moderation_notes = '') => {
    const res = await client.put(`/submissions/${id}/reject`, { moderation_notes });
    return res.data;
  },
  editAndApprove: async (id, data) => {
    const res = await client.put(`/submissions/${id}/edit`, data);
    return res.data;
  },
};
