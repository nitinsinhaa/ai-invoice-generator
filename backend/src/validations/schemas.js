import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2).max(100),
  company_name: z.string().max(200).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const invoiceItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  product_name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(1),
  unit_price: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

export const createInvoiceSchema = z.object({
  customer_id: z.string().uuid().optional(),
  customer: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  invoice_date: z.string(),
  due_date: z.string(),
  subtotal: z.coerce.number().min(0),
  tax_rate: z.coerce.number().min(0).default(0),
  tax_amount: z.coerce.number().min(0).default(0),
  discount_rate: z.coerce.number().min(0).default(0),
  discount_amount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  notes: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  items: z.array(invoiceItemSchema).min(1),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  category: z.string().min(1),
  expense_date: z.string(),
  payment_method: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'paid']).optional(),
});

export const updateProfileSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    full_name: z.string().min(2).max(100).optional(),
    company_name: z.string().max(200).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    zip_code: z.string().max(20).optional(),
    tax_id: z.string().max(50).optional(),
    currency: z.string().max(10).optional(),
    theme: z.enum(['light', 'dark']).optional(),
    email_notifications: z.boolean().optional(),
    tax_type: z.string().max(20).optional(),
    gst_rate: z.coerce.number().min(0).max(100).optional(),
    cgst_rate: z.coerce.number().min(0).max(100).optional(),
    sgst_rate: z.coerce.number().min(0).max(100).optional(),
    igst_rate: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  category: z.string().optional(),
  sku: z.string().optional(),
});
