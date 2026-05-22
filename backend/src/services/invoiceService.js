import invoiceRepository from '../repositories/invoiceRepository.js';
import customerRepository from '../repositories/customerRepository.js';
import transactionRepository from '../repositories/transactionRepository.js';
import productRepository from '../repositories/productRepository.js';
import pool from '../config/database.js';
import notificationService from './notificationService.js';
import { withTransaction } from '../config/transaction.js';
import { AppError } from '../errors/AppError.js';
import { paginatedResponse } from '../utils/pagination.js';

class InvoiceService {
  async createInvoice(userId, invoiceData) {
    const status = invoiceData.status || 'pending';

    const { invoice, customerId, stockUpdates } = await withTransaction(async (client) => {
      let customerId = invoiceData.customer_id;

      if (!customerId && invoiceData.customer) {
        const existingCustomer = await customerRepository.findByEmail(
          invoiceData.customer.email,
          userId,
          client
        );
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const newCustomer = await customerRepository.create(
            { user_id: userId, ...invoiceData.customer },
            client
          );
          customerId = newCustomer.id;
        }
      }

      const invoiceNumber = await invoiceRepository.getNextInvoiceNumber(userId, client);

      const invoice = await invoiceRepository.create(
        {
          user_id: userId,
          customer_id: customerId,
          invoice_number: invoiceNumber,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date,
          subtotal: invoiceData.subtotal,
          tax_rate: invoiceData.tax_rate || 0,
          tax_amount: invoiceData.tax_amount || 0,
          discount_rate: invoiceData.discount_rate || 0,
          discount_amount: invoiceData.discount_amount || 0,
          total: invoiceData.total,
          notes: invoiceData.notes,
          status,
          ai_generated: invoiceData.ai_generated || false,
        },
        client
      );

      const stockUpdates = [];

      for (const item of invoiceData.items || []) {
        await invoiceRepository.createItem(
          {
            invoice_id: invoice.id,
            product_id: item.product_id || null,
            product_name: item.product_name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          },
          client
        );

        if (item.product_id && item.quantity > 0) {
          const updated = await productRepository.updateStock(
            item.product_id,
            userId,
            item.quantity,
            client
          );
          stockUpdates.push({
            product_id: item.product_id,
            remaining_stock: updated.stock,
            quantity: item.quantity,
          });
        }
      }

      return { invoice, customerId, stockUpdates };
    });

    if (status === 'paid') {
      await this.recordInvoicePayment(userId, invoice, customerId, stockUpdates);
      const paidInvoice = await this.getInvoiceById(userId, invoice.id);
      notificationService.onInvoicePaid(userId, paidInvoice).catch(() => {});
      return paidInvoice;
    }

    return this.getInvoiceById(userId, invoice.id);
  }

  async recordInvoicePayment(userId, invoice, customerId, stockUpdates = []) {
    const existing = await transactionRepository.findByInvoiceId(invoice.id, userId);
    const primaryStock = stockUpdates[0];

    if (!existing) {
      await transactionRepository.create({
      user_id: userId,
      invoice_id: invoice.id,
      customer_id: customerId,
      product_id: primaryStock?.product_id || null,
      transaction_type: 'income',
      amount: invoice.total,
      quantity: primaryStock?.quantity || null,
      remaining_stock: primaryStock?.remaining_stock ?? null,
      payment_status: 'completed',
      payment_method: invoice.payment_method || 'Bank Transfer',
      category: 'invoice',
      description: `Paid invoice ${invoice.invoice_number}`,
      });
    }

    const paymentExists = await pool.query(
      `SELECT id FROM payments WHERE invoice_id = $1 AND user_id = $2 LIMIT 1`,
      [invoice.id, userId]
    );

    if (paymentExists.rows.length === 0) {
      await pool.query(
        `INSERT INTO payments (user_id, invoice_id, amount, payment_method, status, notes)
         VALUES ($1, $2, $3, $4, 'completed', $5)`,
        [
          userId,
          invoice.id,
          invoice.total,
          invoice.payment_method || 'Bank Transfer',
          `Payment for ${invoice.invoice_number}`,
        ]
      );
    }

    await invoiceRepository.update(invoice.id, userId, {
      paid_at: new Date().toISOString(),
      status: 'paid',
    });
  }

  async markAsPaid(userId, invoiceId) {
    const invoice = await invoiceRepository.findById(invoiceId, userId);
    if (!invoice) {
      throw AppError.notFound('Invoice not found');
    }
    if (invoice.status === 'paid') {
      throw AppError.badRequest('Invoice is already paid');
    }
    if (invoice.status === 'cancelled') {
      throw AppError.badRequest('Cannot mark a cancelled invoice as paid');
    }

    await this.recordInvoicePayment(userId, invoice, invoice.customer_id, []);
    const paidInvoice = await this.getInvoiceById(userId, invoiceId);
    notificationService.onInvoicePaid(userId, paidInvoice).catch(() => {});
    return paidInvoice;
  }

  async getInvoiceById(userId, invoiceId) {
    const invoice = await invoiceRepository.findById(invoiceId, userId);

    if (!invoice) {
      throw AppError.notFound('Invoice not found');
    }

    const items = await invoiceRepository.findItems(invoiceId);

    return {
      ...invoice,
      items,
    };
  }

  async getAllInvoices(userId, filters) {
    const invoices = await invoiceRepository.findAll(userId, filters);
    const total = await invoiceRepository.count(userId, filters);
    const page = filters.page || (filters.offset ? Math.floor(filters.offset / filters.limit) + 1 : 1);
    const limit = filters.limit || 20;
    return paginatedResponse(invoices, total, page, limit);
  }

  async updateInvoice(userId, invoiceId, updateData) {
    const current = await invoiceRepository.findById(invoiceId, userId);
    if (!current) {
      throw AppError.notFound('Invoice not found');
    }

    const invoice = await invoiceRepository.update(invoiceId, userId, updateData);

    if (updateData.status === 'paid' && current.status !== 'paid') {
      await this.recordInvoicePayment(userId, invoice, invoice.customer_id, []);
      const paidInvoice = await this.getInvoiceById(userId, invoiceId);
      notificationService.onInvoicePaid(userId, paidInvoice).catch(() => {});
      return paidInvoice;
    }

    return this.getInvoiceById(userId, invoiceId);
  }

  async deleteInvoice(userId, invoiceId) {
    await invoiceRepository.delete(invoiceId, userId);
  }

  async getInvoiceStats(userId) {
    const allInvoices = await invoiceRepository.findAll(userId);

    return {
      total: allInvoices.length,
      paid: allInvoices.filter((inv) => inv.status === 'paid').length,
      pending: allInvoices.filter((inv) => inv.status === 'pending').length,
      overdue: allInvoices.filter((inv) => inv.status === 'overdue').length,
      totalRevenue: allInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0),
      pendingAmount: allInvoices
        .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0),
    };
  }
}

export default new InvoiceService();
