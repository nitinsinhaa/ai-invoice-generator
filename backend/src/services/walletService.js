import walletRepository from '../repositories/walletRepository.js';

class WalletService {
  async getWallet(userId) {
    let wallet = await walletRepository.findByUserId(userId);

    if (!wallet) {
      wallet = await walletRepository.create(userId);
    }

    return wallet;
  }

  async addFunds(userId, amount, description) {
    const wallet = await this.getWallet(userId);
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

    const updatedWallet = await walletRepository.updateBalance(wallet.id, newBalance);

    await walletRepository.createTransaction({
      wallet_id: wallet.id,
      transaction_type: 'deposit',
      amount: amount,
      balance_after: newBalance,
      description: description || 'Deposit',
    });

    return updatedWallet;
  }

  async withdrawFunds(userId, amount, description) {
    const wallet = await this.getWallet(userId);
    const currentBalance = parseFloat(wallet.balance);

    if (currentBalance < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }

    const newBalance = currentBalance - parseFloat(amount);

    const updatedWallet = await walletRepository.updateBalance(wallet.id, newBalance);

    await walletRepository.createTransaction({
      wallet_id: wallet.id,
      transaction_type: 'withdrawal',
      amount: amount,
      balance_after: newBalance,
      description: description || 'Withdrawal',
    });

    return updatedWallet;
  }

  async getTransactions(userId, limit, offset) {
    const wallet = await this.getWallet(userId);
    const transactions = await walletRepository.getTransactions(wallet.id, limit, offset);

    return transactions;
  }

  async getBankAccounts(userId) {
    const accounts = await walletRepository.getBankAccounts(userId);
    return accounts;
  }

  async addBankAccount(userId, accountData) {
    const account = await walletRepository.createBankAccount({
      user_id: userId,
      ...accountData,
    });

    return account;
  }

  async removeBankAccount(userId, accountId) {
    await walletRepository.deleteBankAccount(accountId, userId);
  }
}

export default new WalletService();
