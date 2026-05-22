import geminiService from '../ai/geminiService.js';
import dashboardService from '../services/dashboardService.js';
import { ApiResponse } from '../utils/response.js';

class AIController {
  async generateDescription(req, res, next) {
    try {
      const { productName, context } = req.body;

      const result = await geminiService.generateInvoiceDescription(
        productName,
        context
      );

      return ApiResponse.success(res, {
        description: result.text,
        usedFallback: result.usedFallback,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateInvoiceNotes(req, res, next) {
    try {
      const { customerName, items, subtotal, taxRate, total, dueDate } = req.body;

      const result = await geminiService.generateInvoiceNotes({
        customerName,
        items,
        subtotal,
        taxRate,
        total,
        dueDate,
      });

      return ApiResponse.success(res, {
        notes: result.text,
        usedFallback: result.usedFallback,
      });
    } catch (error) {
      next(error);
    }
  }

  async suggestTaxRate(req, res, next) {
    try {
      const { category, location } = req.body;

      const taxRate = await geminiService.suggestTaxRate(category, location);

      return ApiResponse.success(res, { taxRate });
    } catch (error) {
      next(error);
    }
  }

  async categorizeExpense(req, res, next) {
    try {
      const { description, amount } = req.body;

      const result = await geminiService.categorizeExpense(description, amount);

      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async suggestRecurring(req, res, next) {
    try {
      const { customerHistory } = req.body;

      const suggestion = await geminiService.suggestRecurringInvoice(customerHistory);

      return ApiResponse.success(res, suggestion);
    } catch (error) {
      next(error);
    }
  }

  async businessInsights(req, res, next) {
    try {
      const { timeframe = 'monthly' } = req.query;
      const payload = await dashboardService.getInsightsPayload(req.user.id, timeframe);

      let insights = '';
      let usedFallback = false;
      try {
        insights = await geminiService.generateBusinessInsights(payload);
      } catch (aiError) {
        usedFallback = true;
        const rev = payload.totalRevenue ?? 0;
        const exp = payload.totalExpenses ?? 0;
        insights = `• Revenue (paid invoices): ${rev}\n• Expenses: ${exp}\n• Net: ${rev - exp}\n• Pending invoices: ${payload.pendingInvoices ?? 0}\n(AI insights temporarily unavailable — try again later.)`;
      }

      return ApiResponse.success(res, { insights, stats: payload, usedFallback });
    } catch (error) {
      next(error);
    }
  }

  async autoFillCustomer(req, res, next) {
    try {
      const { partialInfo } = req.body;

      const suggestions = await geminiService.autoFillCustomerDetails(partialInfo);

      return ApiResponse.success(res, suggestions);
    } catch (error) {
      next(error);
    }
  }
}

export default new AIController();
