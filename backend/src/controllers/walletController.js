import walletService from '../services/walletService.js';
import { ApiResponse } from '../utils/response.js';

class WalletController {
  async getWallet(req, res, next) {
    try {
      const wallet = await walletService.getWallet(req.user.id);

      return ApiResponse.success(res, wallet);
    } catch (error) {
      next(error);
    }
  }

  async addFunds(req, res, next) {
    try {
      const { amount, description } = req.body;

      const wallet = await walletService.addFunds(req.user.id, amount, description);

      return ApiResponse.success(res, wallet, 'Funds added successfully');
    } catch (error) {
      next(error);
    }
  }

  async withdrawFunds(req, res, next) {
    try {
      const { amount, description } = req.body;

      const wallet = await walletService.withdrawFunds(req.user.id, amount, description);

      return ApiResponse.success(res, wallet, 'Funds withdrawn successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const transactions = await walletService.getTransactions(
        req.user.id,
        parseInt(limit),
        parseInt(offset)
      );

      return ApiResponse.success(res, transactions);
    } catch (error) {
      next(error);
    }
  }

  async getBankAccounts(req, res, next) {
    try {
      const accounts = await walletService.getBankAccounts(req.user.id);

      return ApiResponse.success(res, accounts);
    } catch (error) {
      next(error);
    }
  }

  async addBankAccount(req, res, next) {
    try {
      const account = await walletService.addBankAccount(req.user.id, req.body);

      return ApiResponse.created(res, account, 'Bank account added successfully');
    } catch (error) {
      next(error);
    }
  }

  async removeBankAccount(req, res, next) {
    try {
      await walletService.removeBankAccount(req.user.id, req.params.id);

      return ApiResponse.success(res, null, 'Bank account removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new WalletController();
