import { useMemo } from 'react';

export function calculateInvoiceTotals(items, taxRate, discountRate) {
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  const taxAmount = (subtotal * parseFloat(taxRate || 0)) / 100;
  const discountAmount = (subtotal * parseFloat(discountRate || 0)) / 100;
  const total = subtotal + taxAmount - discountAmount;

  return {
    subtotal,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total,
  };
}

export function useInvoiceCalculations(items, taxRate, discountRate) {
  return useMemo(
    () => calculateInvoiceTotals(items, taxRate, discountRate),
    [items, taxRate, discountRate]
  );
}
