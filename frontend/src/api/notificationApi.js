import axios from './axios';

export const notificationApi = {
  getStatus: () => axios.get('/notifications/status'),
  sendTest: () => axios.post('/notifications/test'),
};
