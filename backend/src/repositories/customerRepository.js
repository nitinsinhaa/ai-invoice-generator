import pool from '../config/database.js';

class CustomerRepository {
  async create(customerData, db = pool) {
    const {
      user_id, name, email, phone, company, address,
      city, state, country, zip_code
    } = customerData;

    const query = `
      INSERT INTO customers (
        user_id, name, email, phone, company, address,
        city, state, country, zip_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await db.query(query, [
      user_id, name, email, phone, company, address,
      city, state, country, zip_code
    ]);

    return result.rows[0];
  }

  async findAll(userId) {
    const query = `
      SELECT * FROM customers 
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async findById(id, userId) {
    const query = `
      SELECT * FROM customers 
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  async findByEmail(email, userId, db = pool) {
    const query = `
      SELECT * FROM customers 
      WHERE email = $1 AND user_id = $2 AND deleted_at IS NULL
    `;

    const result = await db.query(query, [email, userId]);
    return result.rows[0];
  }

  async update(id, userId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id, userId);
    const query = `
      UPDATE customers 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(id, userId) {
    const query = `
      UPDATE customers 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2
    `;

    await pool.query(query, [id, userId]);
  }
}

export default new CustomerRepository();
