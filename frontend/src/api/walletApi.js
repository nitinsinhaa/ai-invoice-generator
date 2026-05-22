import axios from './axios';

export const walletApi = {
  getWallet: () => axios.get('/wallet'),
  addFunds: (data) => axios.post('/wallet/add-funds', data),
  withdrawFunds: (data) => axios.post('/wallet/withdraw', data),
  getTransactions: (params) => axios.get('/wallet/transactions', { params }),
  getBankAccounts: () => axios.get('/wallet/bank-accounts'),
  addBankAccount: (data) => axios.post('/wallet/bank-accounts', data),
  removeBankAccount: (id) => axios.delete(`/wallet/bank-accounts/${id}`),
};
