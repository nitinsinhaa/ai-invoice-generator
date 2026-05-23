import pool from '../config/database.js';

class WalletRepository {
  async create(userId, db = pool) {
    const query = `
      INSERT INTO wallets (user_id, balance)
      VALUES ($1, 0.00)
      RETURNING *
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  async findByUserId(userId, db = pool) {
    const query = 'SELECT * FROM wallets WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  async findByUserIdForUpdate(userId, db = pool) {
    const query = 'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE';
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  async updateBalance(walletId, newBalance, db = pool) {
    const query = `
      UPDATE wallets 
      SET balance = $1 
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [newBalance, walletId]);
    return result.rows[0];
  }

  async createTransaction(transactionData, db = pool) {
    const { wallet_id, transaction_type, amount, balance_after, description, reference_id } =
      transactionData;

    const query = `
      INSERT INTO wallet_transactions (
        wallet_id, transaction_type, amount, balance_after, description, reference_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(query, [
      wallet_id,
      transaction_type,
      amount,
      balance_after,
      description,
      reference_id,
    ]);

    return result.rows[0];
  }

  async getTransactions(walletId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM wallet_transactions 
      WHERE wallet_id = $1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [walletId, limit, offset]);
    return result.rows;
  }

  async getBankAccounts(userId) {
    const query = `
      SELECT * FROM bank_accounts 
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY is_primary DESC, created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async createBankAccount(accountData) {
    const {
      user_id,
      account_name,
      account_number,
      bank_name,
      routing_number,
      account_type,
      is_primary,
    } = accountData;

    const query = `
      INSERT INTO bank_accounts (
        user_id, account_name, account_number, bank_name,
        routing_number, account_type, is_primary
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id,
      account_name,
      account_number,
      bank_name,
      routing_number,
      account_type,
      is_primary,
    ]);

    return result.rows[0];
  }

  async deleteBankAccount(id, userId) {
    const query = `
      UPDATE bank_accounts 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2
    `;

    await pool.query(query, [id, userId]);
  }
}

export default new WalletRepository();
