import transactionService from '../services/transactionService.js';
import { ApiResponse } from '../utils/response.js';

class TransactionController {
  async createTransaction(req, res, next) {
    try {
      const transaction = await transactionService.createTransaction(req.user.id, req.body);

      return ApiResponse.created(res, transaction, 'Transaction created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const {
        type,
        status,
        category,
        search,
        page = 1,
        limit = 10,
        startDate,
        endDate,
      } = req.query;

      const filters = {
        type,
        status,
        category,
        search,
        startDate,
        endDate,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      };

      const result = await transactionService.getAllTransactions(req.user.id, filters);

      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getTransactionById(req, res, next) {
    try {
      const transaction = await transactionService.getTransactionById(
        req.user.id,
        req.params.id
      );

      return ApiResponse.success(res, transaction);
    } catch (error) {
      next(error);
    }
  }

  async getTransactionStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const end = endDate || new Date().toISOString();

      const stats = await transactionService.getTransactionStats(req.user.id, start, end);

      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
