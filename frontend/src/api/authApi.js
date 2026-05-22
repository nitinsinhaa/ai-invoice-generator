import axios from './axios';

export const authApi = {
  register: (data) => axios.post('/auth/register', data),
  login: (data) => axios.post('/auth/login', data),
  refresh: (refreshToken) => axios.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => axios.post('/auth/logout', { refreshToken }),
  getProfile: () => axios.get('/auth/profile'),
  updateProfile: (data) => axios.put('/auth/profile', data),
};
