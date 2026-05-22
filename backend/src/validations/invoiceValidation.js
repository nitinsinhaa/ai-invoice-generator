import { body } from 'express-validator';

export const createInvoiceValidation = [
  body('invoice_date').isISO8601().withMessage('Valid invoice date is required'),
  body('due_date').isISO8601().withMessage('Valid due date is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
  body('total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_name').notEmpty().withMessage('Product name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
];

export const updateInvoiceValidation = [
  body('invoice_date').optional().isISO8601(),
  body('due_date').optional().isISO8601(),
  body('subtotal').optional().isFloat({ min: 0 }),
  body('total').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']),
];
