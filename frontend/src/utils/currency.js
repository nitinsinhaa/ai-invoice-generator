// Currency utility functions

export const CURRENCY_SYMBOLS = {
  INR: '₹',
};

export const formatCurrency = (amount, currency = 'INR') => {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  const numAmount = parseFloat(amount) || 0;
  
  // Indian number formatting with lakhs and crores
  return `${symbol}${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getCurrencySymbol = (currency = 'INR') => {
  return CURRENCY_SYMBOLS[currency] || '₹';
};
