import axios from './axios';

export const dashboardApi = {
  getStats: (params) => axios.get('/dashboard/stats', { params }),
};
