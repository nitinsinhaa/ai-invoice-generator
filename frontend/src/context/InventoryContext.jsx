import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productApi } from '../api/productApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await productApi.getProducts();
      const data = response.data.data || response.data;
      setProducts(data || []);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Failed to fetch products:', error);
        toast.error('Failed to load products');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [user, authLoading, fetchProducts]);

  const addProduct = async (productData) => {
    try {
      const response = await productApi.createProduct(productData);
      const newProduct = response.data.data || response.data;
      setProducts([...products, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  };

  const updateProduct = async (id, updatedProduct) => {
    try {
      const response = await productApi.updateProduct(id, updatedProduct);
      const updated = response.data.data || response.data;
      setProducts(products.map(p => p.id === id ? updated : p));
      return updated;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productApi.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  const getProductById = (id) => {
    return products.find(p => p.id === id);
  };

  const getAvailableProducts = () => {
    return products.filter(p => p.stock > 0);
  };

  const updateStock = async (id, quantity) => {
    try {
      const response = await productApi.updateStock(id, { quantity });
      const updated = response.data.data || response.data;
      setProducts(products.map(p => p.id === id ? updated : p));
      return updated;
    } catch (error) {
      console.error('Failed to update stock:', error);
      throw error;
    }
  };

  const value = {
    products,
    loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getAvailableProducts,
    updateStock,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
