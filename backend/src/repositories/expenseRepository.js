import pool from '../config/database.js';

class ExpenseRepository {
  async create(expenseData) {
    const {
      user_id,
      description,
      amount,
      category,
      expense_date,
      payment_method,
      vendor,
      notes,
      status,
    } = expenseData;

    const query = `
      INSERT INTO expenses (
        user_id, description, amount, category, expense_date,
        payment_method, vendor, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id,
      description,
      amount,
      category,
      expense_date,
      payment_method,
      vendor,
      notes,
      status || 'pending',
    ]);

    return result.rows[0];
  }

  async findAll(userId, filters = {}) {
    let query = `
      SELECT * FROM expenses
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const values = [userId];
    let paramCount = 2;

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND expense_date >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND expense_date <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (description ILIKE $${paramCount} OR vendor ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async findById(id, userId) {
    const query = `
      SELECT * FROM expenses
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  async update(id, userId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id, userId);
    const query = `
      UPDATE expenses
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(id, userId) {
    const query = `
      UPDATE expenses
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
    `;
    await pool.query(query, [id, userId]);
  }

  async getSummary(userId, filters = {}) {
    const expenses = await this.findAll(userId, filters);
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const byCategory = {};

    expenses.forEach((exp) => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + parseFloat(exp.amount);
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const thisMonth = expenses
      .filter((e) => e.expense_date >= monthStart)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return {
      total,
      thisMonth,
      paidCount: expenses.filter((e) => e.status === 'paid').length,
      pendingCount: expenses.filter((e) => e.status === 'pending').length,
      byCategory,
    };
  }
}

export default new ExpenseRepository();
