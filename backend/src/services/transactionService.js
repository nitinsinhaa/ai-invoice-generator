import transactionRepository from '../repositories/transactionRepository.js';

class TransactionService {
  async createTransaction(userId, transactionData) {
    const transaction = await transactionRepository.create({
      user_id: userId,
      ...transactionData,
    });

    return transaction;
  }

  async getAllTransactions(userId, filters) {
    const transactions = await transactionRepository.findAll(userId, filters);
    const total = await transactionRepository.count(userId, filters);

    return {
      transactions,
      total,
      page: filters.offset ? Math.floor(filters.offset / filters.limit) + 1 : 1,
      limit: filters.limit || transactions.length,
    };
  }

  async getTransactionById(userId, transactionId) {
    const transaction = await transactionRepository.findById(transactionId, userId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async getTransactionStats(userId, startDate, endDate) {
    const stats = await transactionRepository.getStats(userId, startDate, endDate);

    const summary = {
      totalRevenue: 0,
      totalExpenses: 0,
      byCategory: {},
      byStatus: {},
    };

    stats.forEach(stat => {
      const amount = parseFloat(stat.total_amount);

      if (stat.transaction_type === 'income') {
        summary.totalRevenue += amount;
      } else if (stat.transaction_type === 'expense') {
        summary.totalExpenses += amount;
      }

      if (stat.category) {
        if (!summary.byCategory[stat.category]) {
          summary.byCategory[stat.category] = 0;
        }
        summary.byCategory[stat.category] += amount;
      }

      if (stat.payment_status) {
        if (!summary.byStatus[stat.payment_status]) {
          summary.byStatus[stat.payment_status] = 0;
        }
        summary.byStatus[stat.payment_status] += amount;
      }
    });

    return summary;
  }
}

export default new TransactionService();
