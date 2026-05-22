import axios from './axios';

export const aiApi = {
  businessInsights: (params) => axios.get('/ai/business-insights', { params }),
  generateDescription: (data) => axios.post('/ai/generate-description', data),
  generateInvoiceNotes: (data) => axios.post('/ai/generate-invoice-notes', data),
  suggestTax: (data) => axios.post('/ai/suggest-tax', data),
  categorizeExpense: (data) => axios.post('/ai/categorize-expense', data),
  suggestRecurring: (data) => axios.post('/ai/suggest-recurring', data),
  autoFillCustomer: (data) => axios.post('/ai/autofill-customer', data),
};
