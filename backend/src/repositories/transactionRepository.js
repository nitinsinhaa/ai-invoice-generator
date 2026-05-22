import pool from '../config/database.js';

class TransactionRepository {
  async create(transactionData) {
    const {
      user_id, invoice_id, product_id, customer_id, transaction_type,
      amount, quantity, remaining_stock, payment_status, payment_method,
      category, description
    } = transactionData;

    const query = `
      INSERT INTO transactions (
        user_id, invoice_id, product_id, customer_id, transaction_type,
        amount, quantity, remaining_stock, payment_status, payment_method,
        category, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, invoice_id, product_id, customer_id, transaction_type,
      amount, quantity, remaining_stock, payment_status, payment_method,
      category, description
    ]);

    return result.rows[0];
  }

  async findAll(userId, filters = {}) {
    let query = `
      SELECT t.*, 
             p.name as product_name,
             c.name as customer_name,
             i.invoice_number
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN invoices i ON t.invoice_id = i.id
      WHERE t.user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    if (filters.type) {
      query += ` AND t.transaction_type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND t.payment_status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND t.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND t.transaction_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND t.transaction_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (
        p.name ILIKE $${paramCount}
        OR c.name ILIKE $${paramCount}
        OR i.invoice_number ILIKE $${paramCount}
        OR t.description ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY t.transaction_date DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  async count(userId, filters = {}) {
    let query = `
      SELECT COUNT(*) 
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN invoices i ON t.invoice_id = i.id
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramCount = 2;

    if (filters.type) {
      query += ` AND t.transaction_type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND t.payment_status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND t.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND t.transaction_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND t.transaction_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (
        p.name ILIKE $${paramCount}
        OR c.name ILIKE $${paramCount}
        OR i.invoice_number ILIKE $${paramCount}
        OR t.description ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async findByInvoiceId(invoiceId, userId) {
    const query = `
      SELECT * FROM transactions
      WHERE invoice_id = $1 AND user_id = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [invoiceId, userId]);
    return result.rows[0];
  }

  async findById(id, userId) {
    const query = `
      SELECT t.*, 
             p.name as product_name,
             c.name as customer_name,
             i.invoice_number
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN invoices i ON t.invoice_id = i.id
      WHERE t.id = $1 AND t.user_id = $2
    `;

    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  async getStats(userId, startDate, endDate) {
    const query = `
      SELECT 
        transaction_type,
        payment_status,
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM transactions
      WHERE user_id = $1 
        AND transaction_date >= $2 
        AND transaction_date <= $3
      GROUP BY transaction_type, payment_status, category
    `;

    const result = await pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  }
}

export default new TransactionRepository();
