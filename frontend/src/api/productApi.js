import axios from './axios';

export const productApi = {
  getProducts: (params) => axios.get('/products', { params }),
  getProductById: (id) => axios.get(`/products/${id}`),
  createProduct: (data) => axios.post('/products', data),
  updateProduct: (id, data) => axios.put(`/products/${id}`, data),
  deleteProduct: (id) => axios.delete(`/products/${id}`),
  updateStock: (id, data) => axios.patch(`/products/${id}/stock`, data),
};
