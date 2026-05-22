import expenseService from '../services/expenseService.js';
import { ApiResponse } from '../utils/response.js';

class ExpenseController {
  async createExpense(req, res, next) {
    try {
      const expense = await expenseService.createExpense(req.user.id, req.body);
      return ApiResponse.created(res, expense, 'Expense created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getExpenses(req, res, next) {
    try {
      const { category, status, search, startDate, endDate } = req.query;
      const expenses = await expenseService.getExpenses(req.user.id, {
        category,
        status,
        search,
        startDate,
        endDate,
      });
      return ApiResponse.success(res, expenses);
    } catch (error) {
      next(error);
    }
  }

  async getExpenseSummary(req, res, next) {
    try {
      const summary = await expenseService.getSummary(req.user.id, req.query);
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getExpenseById(req, res, next) {
    try {
      const expense = await expenseService.getExpenseById(req.user.id, req.params.id);
      return ApiResponse.success(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const expense = await expenseService.updateExpense(
        req.user.id,
        req.params.id,
        req.body
      );
      return ApiResponse.success(res, expense, 'Expense updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      await expenseService.deleteExpense(req.user.id, req.params.id);
      return ApiResponse.success(res, null, 'Expense deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseController();
