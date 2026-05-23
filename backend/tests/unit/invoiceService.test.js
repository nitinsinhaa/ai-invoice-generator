import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  invoiceRepository: {
    getNextInvoiceNumber: vi.fn(),
    create: vi.fn(),
    createItem: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    findItems: vi.fn(),
  },
  transactionRepository: {
    findByInvoiceId: vi.fn(),
    create: vi.fn(),
  },
  customerRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
  productRepository: {
    updateStock: vi.fn(),
  },
  poolQuery: vi.fn(),
}));

vi.mock('../../src/repositories/invoiceRepository.js', () => ({
  default: mocks.invoiceRepository,
}));

vi.mock('../../src/repositories/transactionRepository.js', () => ({
  default: mocks.transactionRepository,
}));

vi.mock('../../src/repositories/customerRepository.js', () => ({
  default: mocks.customerRepository,
}));

vi.mock('../../src/repositories/productRepository.js', () => ({
  default: mocks.productRepository,
}));

vi.mock('../../src/config/database.js', () => ({
  default: { query: mocks.poolQuery },
}));

vi.mock('../../src/config/transaction.js', () => ({
  withTransaction: async (fn) => fn({ query: vi.fn() }),
}));

vi.mock('../../src/services/notificationService.js', () => ({
  default: { onInvoicePaid: vi.fn().mockResolvedValue(undefined) },
}));

import invoiceService from '../../src/services/invoiceService.js';

const userId = '11111111-1111-1111-1111-111111111111';

const baseInvoiceData = {
  invoice_date: '2026-01-01',
  due_date: '2026-01-15',
  subtotal: 100,
  tax_rate: 10,
  tax_amount: 10,
  discount_rate: 5,
  discount_amount: 5,
  total: 105,
  items: [
    {
      product_name: 'Widget',
      description: 'Test item',
      quantity: 2,
      unit_price: 50,
      total: 100,
    },
  ],
};

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invoiceRepository.getNextInvoiceNumber.mockResolvedValue('INV-0001');
    mocks.invoiceRepository.create.mockResolvedValue({
      id: 'inv-1',
      invoice_number: 'INV-0001',
      total: 105,
      status: 'pending',
      customer_id: 'cust-1',
    });
    mocks.invoiceRepository.createItem.mockResolvedValue({});
    mocks.invoiceRepository.findItems.mockResolvedValue([]);
    mocks.invoiceRepository.findById.mockResolvedValue({
      id: 'inv-1',
      invoice_number: 'INV-0001',
      total: 105,
      status: 'pending',
      customer_id: 'cust-1',
    });
    mocks.transactionRepository.findByInvoiceId.mockResolvedValue(null);
    mocks.transactionRepository.create.mockResolvedValue({});
    mocks.poolQuery.mockResolvedValue({ rows: [] });
  });

  describe('createInvoice', () => {
    it('records a transaction when status is paid', async () => {
      mocks.invoiceRepository.create.mockResolvedValue({
        id: 'inv-1',
        invoice_number: 'INV-0001',
        total: 105,
        status: 'paid',
        customer_id: 'cust-1',
      });
      mocks.invoiceRepository.findById.mockResolvedValue({
        id: 'inv-1',
        invoice_number: 'INV-0001',
        total: 105,
        status: 'paid',
        customer_id: 'cust-1',
      });

      await invoiceService.createInvoice(userId, { ...baseInvoiceData, status: 'paid' });

      expect(mocks.transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          invoice_id: 'inv-1',
          transaction_type: 'income',
          amount: 105,
        })
      );
    });

    it('does NOT record a transaction when status is pending', async () => {
      await invoiceService.createInvoice(userId, { ...baseInvoiceData, status: 'pending' });

      expect(mocks.transactionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('markAsPaid', () => {
    it('throws if invoice is already paid', async () => {
      mocks.invoiceRepository.findById.mockResolvedValue({
        id: 'inv-1',
        status: 'paid',
        total: 105,
      });

      await expect(invoiceService.markAsPaid(userId, 'inv-1')).rejects.toMatchObject({
        message: 'Invoice is already paid',
      });
    });

    it('throws if invoice is cancelled', async () => {
      mocks.invoiceRepository.findById.mockResolvedValue({
        id: 'inv-1',
        status: 'cancelled',
        total: 105,
      });

      await expect(invoiceService.markAsPaid(userId, 'inv-1')).rejects.toMatchObject({
        message: 'Cannot mark a cancelled invoice as paid',
      });
    });
  });
});

describe('invoice total calculation', () => {
  function calculateTotals(items, taxRate, discountRate) {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    const taxAmount = (subtotal * parseFloat(taxRate || 0)) / 100;
    const discountAmount = (subtotal * parseFloat(discountRate || 0)) / 100;
    return {
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total: subtotal + taxAmount - discountAmount,
    };
  }

  it('calculates total with tax and discount', () => {
    const items = [{ total: 200 }, { total: 100 }];
    const result = calculateTotals(items, 10, 5);
    expect(result.subtotal).toBe(300);
    expect(result.tax_amount).toBe(30);
    expect(result.discount_amount).toBe(15);
    expect(result.total).toBe(315);
  });
});
