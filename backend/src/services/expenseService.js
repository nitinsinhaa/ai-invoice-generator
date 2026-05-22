import expenseRepository from '../repositories/expenseRepository.js';
import { AppError } from '../errors/AppError.js';

class ExpenseService {
  async createExpense(userId, data) {
    return expenseRepository.create({
      user_id: userId,
      description: data.description,
      amount: data.amount,
      category: data.category || 'Other',
      expense_date: data.expense_date || new Date().toISOString().split('T')[0],
      payment_method: data.payment_method,
      vendor: data.vendor,
      notes: data.notes,
      status: data.status || 'pending',
    });
  }

  async getExpenses(userId, filters) {
    return expenseRepository.findAll(userId, filters);
  }

  async getExpenseById(userId, id) {
    const expense = await expenseRepository.findById(id, userId);
    if (!expense) {
      throw AppError.notFound('Expense not found');
    }
    return expense;
  }

  async updateExpense(userId, id, data) {
    const expense = await expenseRepository.update(id, userId, data);
    if (!expense) {
      throw AppError.notFound('Expense not found');
    }
    return expense;
  }

  async deleteExpense(userId, id) {
    const existing = await expenseRepository.findById(id, userId);
    if (!existing) {
      throw AppError.notFound('Expense not found');
    }
    await expenseRepository.delete(id, userId);
  }

  async getSummary(userId, filters) {
    return expenseRepository.getSummary(userId, filters);
  }
}

export default new ExpenseService();
