import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { applyTheme } from '../utils/theme';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('INR');
  const [theme, setTheme] = useState('light');
  const [taxConfig, setTaxConfig] = useState({
    tax_type: 'GST',
    gst_rate: 18,
    cgst_rate: 9,
    sgst_rate: 9,
    igst_rate: 18,
  });

  useEffect(() => {
    if (user) {
      setCurrency(user.currency || 'INR');
      const userTheme = user.theme || 'light';
      setTheme(userTheme);
      setTaxConfig({
        tax_type: user.tax_type || 'GST',
        gst_rate: user.gst_rate || 18,
        cgst_rate: user.cgst_rate || 9,
        sgst_rate: user.sgst_rate || 9,
        igst_rate: user.igst_rate || 18,
      });
      applyTheme(userTheme);
    }
  }, [user]);

  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency);
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const updateTaxConfig = (newConfig) => {
    setTaxConfig(newConfig);
  };

  const value = {
    currency,
    theme,
    taxConfig,
    updateCurrency,
    updateTheme,
    updateTaxConfig,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
