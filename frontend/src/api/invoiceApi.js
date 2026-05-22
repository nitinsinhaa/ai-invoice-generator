import axios from './axios';

export const invoiceApi = {
  getInvoices: (params) => axios.get('/invoices', { params }),
  getInvoiceById: (id) => axios.get(`/invoices/${id}`),
  createInvoice: (data) => axios.post('/invoices', data),
  updateInvoice: (id, data) => axios.put(`/invoices/${id}`, data),
  markAsPaid: (id) => axios.patch(`/invoices/${id}/mark-paid`),
  deleteInvoice: (id) => axios.delete(`/invoices/${id}`),
  downloadInvoice: (id) => axios.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  sendInvoice: (id, data) => axios.post(`/invoices/${id}/send`, data),
  getInvoiceStats: () => axios.get('/invoices/stats'),
};
