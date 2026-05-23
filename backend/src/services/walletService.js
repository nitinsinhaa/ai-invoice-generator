import walletRepository from '../repositories/walletRepository.js';
import { withTransaction } from '../config/transaction.js';
import { AppError } from '../errors/AppError.js';

class WalletService {
  async getWallet(userId) {
    let wallet = await walletRepository.findByUserId(userId);

    if (!wallet) {
      wallet = await walletRepository.create(userId);
    }

    return wallet;
  }

  async addFunds(userId, amount, description) {
    return withTransaction(async (client) => {
      let wallet = await walletRepository.findByUserIdForUpdate(userId, client);
      if (!wallet) {
        wallet = await walletRepository.create(userId, client);
        wallet = await walletRepository.findByUserIdForUpdate(userId, client);
      }

      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
      const updatedWallet = await walletRepository.updateBalance(wallet.id, newBalance, client);

      await walletRepository.createTransaction(
        {
          wallet_id: wallet.id,
          transaction_type: 'deposit',
          amount,
          balance_after: newBalance,
          description: description || 'Deposit',
        },
        client
      );

      return updatedWallet;
    });
  }

  async withdrawFunds(userId, amount, description) {
    return withTransaction(async (client) => {
      const wallet = await walletRepository.findByUserIdForUpdate(userId, client);
      if (!wallet) {
        throw AppError.notFound('Wallet not found');
      }

      const currentBalance = parseFloat(wallet.balance);
      const withdrawAmount = parseFloat(amount);

      if (currentBalance < withdrawAmount) {
        throw AppError.badRequest('Insufficient balance');
      }

      const newBalance = currentBalance - withdrawAmount;
      const updatedWallet = await walletRepository.updateBalance(wallet.id, newBalance, client);

      await walletRepository.createTransaction(
        {
          wallet_id: wallet.id,
          transaction_type: 'withdrawal',
          amount: withdrawAmount,
          balance_after: newBalance,
          description: description || 'Withdrawal',
        },
        client
      );

      return updatedWallet;
    });
  }

  async getTransactions(userId, limit, offset) {
    const wallet = await this.getWallet(userId);
    return walletRepository.getTransactions(wallet.id, limit, offset);
  }

  async getBankAccounts(userId) {
    return walletRepository.getBankAccounts(userId);
  }

  async addBankAccount(userId, accountData) {
    return walletRepository.createBankAccount({
      user_id: userId,
      ...accountData,
    });
  }

  async removeBankAccount(userId, accountId) {
    await walletRepository.deleteBankAccount(accountId, userId);
  }
}

export default new WalletService();
