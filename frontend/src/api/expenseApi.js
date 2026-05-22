import axios from './axios';

export const expenseApi = {
  getExpenses: (params) => axios.get('/expenses', { params }),
  getSummary: (params) => axios.get('/expenses/summary', { params }),
  getExpenseById: (id) => axios.get(`/expenses/${id}`),
  createExpense: (data) => axios.post('/expenses', data),
  updateExpense: (id, data) => axios.put(`/expenses/${id}`, data),
  deleteExpense: (id) => axios.delete(`/expenses/${id}`),
};
