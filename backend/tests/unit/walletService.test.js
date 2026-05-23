import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  walletRepository: {
    findByUserId: vi.fn(),
    findByUserIdForUpdate: vi.fn(),
    create: vi.fn(),
    updateBalance: vi.fn(),
    createTransaction: vi.fn(),
  },
}));

vi.mock('../../src/repositories/walletRepository.js', () => ({
  default: mocks.walletRepository,
}));

vi.mock('../../src/config/transaction.js', () => ({
  withTransaction: async (fn) => fn({ query: vi.fn() }),
}));

import walletService from '../../src/services/walletService.js';

const userId = '11111111-1111-1111-1111-111111111111';

describe('walletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.walletRepository.findByUserIdForUpdate.mockResolvedValue({
      id: 'wallet-1',
      user_id: userId,
      balance: '100.00',
    });
    mocks.walletRepository.updateBalance.mockImplementation((_id, balance) =>
      Promise.resolve({ id: 'wallet-1', balance: String(balance) })
    );
    mocks.walletRepository.createTransaction.mockResolvedValue({ id: 'tx-1' });
  });

  describe('addFunds', () => {
    it('increases balance by the correct amount', async () => {
      const result = await walletService.addFunds(userId, 50, 'Top up');

      expect(mocks.walletRepository.updateBalance).toHaveBeenCalledWith(
        'wallet-1',
        150,
        expect.anything()
      );
      expect(parseFloat(result.balance)).toBe(150);
    });

    it('creates a wallet transaction record', async () => {
      await walletService.addFunds(userId, 25, 'Deposit');

      expect(mocks.walletRepository.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          wallet_id: 'wallet-1',
          transaction_type: 'deposit',
          amount: 25,
          balance_after: 125,
          description: 'Deposit',
        }),
        expect.anything()
      );
    });
  });

  describe('withdrawFunds', () => {
    it('decreases balance by the correct amount', async () => {
      const result = await walletService.withdrawFunds(userId, 30, 'Cash out');

      expect(mocks.walletRepository.updateBalance).toHaveBeenCalledWith(
        'wallet-1',
        70,
        expect.anything()
      );
      expect(parseFloat(result.balance)).toBe(70);
    });

    it("throws 'Insufficient balance' when amount exceeds balance", async () => {
      await expect(walletService.withdrawFunds(userId, 200, 'Too much')).rejects.toMatchObject({
        message: 'Insufficient balance',
      });
      expect(mocks.walletRepository.updateBalance).not.toHaveBeenCalled();
    });
  });
});
