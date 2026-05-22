import axios from './axios';

export const transactionApi = {
  getTransactions: (params) => axios.get('/transactions', { params }),
  getTransactionById: (id) => axios.get(`/transactions/${id}`),
  createTransaction: (data) => axios.post('/transactions', data),
  getTransactionStats: (params) => axios.get('/transactions/stats', { params }),
};
