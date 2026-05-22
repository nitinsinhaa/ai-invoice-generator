import invoiceService from '../services/invoiceService.js';
import { ApiResponse } from '../utils/response.js';
import pdfGenerator from '../utils/pdfGenerator.js';
import notificationService from '../services/notificationService.js';
import userRepository from '../repositories/userRepository.js';
import { parsePagination } from '../utils/pagination.js';

class InvoiceController {
  async createInvoice(req, res, next) {
    try {
      const invoice = await invoiceService.createInvoice(req.user.id, req.body);

      return ApiResponse.created(res, invoice, 'Invoice created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(req, res, next) {
    try {
      const { status, search, startDate, endDate } = req.query;
      const { page, limit, offset } = parsePagination(req.query);

      const result = await invoiceService.getAllInvoices(req.user.id, {
        status,
        search,
        startDate,
        endDate,
        page,
        limit,
        offset,
      });

      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.user.id, req.params.id);

      return ApiResponse.success(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async markAsPaid(req, res, next) {
    try {
      const invoice = await invoiceService.markAsPaid(req.user.id, req.params.id);
      return ApiResponse.success(res, invoice, 'Invoice marked as paid');
    } catch (error) {
      next(error);
    }
  }

  async updateInvoice(req, res, next) {
    try {
      const invoice = await invoiceService.updateInvoice(
        req.user.id,
        req.params.id,
        req.body
      );

      return ApiResponse.success(res, invoice, 'Invoice updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteInvoice(req, res, next) {
    try {
      await invoiceService.deleteInvoice(req.user.id, req.params.id);

      return ApiResponse.success(res, null, 'Invoice deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async downloadInvoice(req, res, next) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.user.id, req.params.id);
      const user = await userRepository.findById(req.user.id);

      const { filePath } = await pdfGenerator.generateInvoicePDF(invoice, user);

      res.download(filePath, `invoice-${invoice.invoice_number}.pdf`, (err) => {
        if (err) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async sendInvoiceEmail(req, res, next) {
    try {
      const { recipientEmail } = req.body;
      const invoice = await invoiceService.getInvoiceById(req.user.id, req.params.id);
      const user = await userRepository.findById(req.user.id);

      const { filePath } = await pdfGenerator.generateInvoicePDF(invoice, user);

      const result = await notificationService.sendInvoiceToCustomer(
        user,
        invoice,
        filePath,
        recipientEmail
      );

      return ApiResponse.success(
        res,
        { previewUrl: result?.previewUrl },
        result?.previewUrl
          ? 'Invoice sent (dev preview URL in response — check server logs)'
          : 'Invoice emailed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceStats(req, res, next) {
    try {
      const stats = await invoiceService.getInvoiceStats(req.user.id);

      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoiceController();
