import pool from '../config/database.js';

class UserRepository {
  async create(userData) {
    const { email, password, full_name, company_name } = userData;
    
    const query = `
      INSERT INTO users (email, password, full_name, company_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, company_name, created_at
    `;
    
    const result = await pool.query(query, [email, password, full_name, company_name]);
    return result.rows[0];
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async findById(id) {
    const query = `
      SELECT id, email, full_name, company_name, company_logo, phone, address, 
             city, state, country, zip_code, tax_id, currency, theme,
             tax_type, gst_rate, cgst_rate, sgst_rate, igst_rate,
             email_notifications, created_at, updated_at
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(userData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, company_name, company_logo, phone, 
                address, city, state, country, zip_code, tax_id, currency, 
                theme, tax_type, gst_rate, cgst_rate, sgst_rate, igst_rate,
                email_notifications
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
  }
}

export default new UserRepository();
