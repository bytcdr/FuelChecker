import client from './client.js';

export const pricesApi = {
  getByStation: async (stationId) => {
    const res = await client.get(`/prices/station/${stationId}`);
    return res.data;
  },
  getHistory: async (stationId, params = {}) => {
    const res = await client.get(`/prices/station/${stationId}/history`, { params });
    return res.data;
  },
};
