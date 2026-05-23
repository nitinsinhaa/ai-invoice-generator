import pool from '../config/database.js';

class InvoiceRepository {
  async create(invoiceData, db = pool) {
    const {
      user_id, customer_id, invoice_number, invoice_date, due_date,
      subtotal, tax_rate, tax_amount, discount_rate, discount_amount,
      total, notes, status, ai_generated
    } = invoiceData;

    const query = `
      INSERT INTO invoices (
        user_id, customer_id, invoice_number, invoice_date, due_date,
        subtotal, tax_rate, tax_amount, discount_rate, discount_amount,
        total, notes, status, ai_generated
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const result = await db.query(query, [
      user_id, customer_id, invoice_number, invoice_date, due_date,
      subtotal, tax_rate, tax_amount, discount_rate, discount_amount,
      total, notes, status, ai_generated
    ]);

    return result.rows[0];
  }

  async createItem(itemData, db = pool) {
    const { invoice_id, product_id, product_name, description, quantity, unit_price, total } = itemData;

    const query = `
      INSERT INTO invoice_items (invoice_id, product_id, product_name, description, quantity, unit_price, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await db.query(query, [
      invoice_id, product_id || null, product_name, description, quantity, unit_price, total
    ]);

    return result.rows[0];
  }

  async findById(id, userId) {
    const query = `
      SELECT i.*, 
             c.name as customer_name, c.email as customer_email, 
             c.phone as customer_phone, c.address as customer_address,
             c.city as customer_city, c.state as customer_state,
             c.country as customer_country, c.zip_code as customer_zip
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = $1 AND i.user_id = $2 AND i.deleted_at IS NULL
    `;

    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  async findItems(invoiceId) {
    const query = 'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at';
    const result = await pool.query(query, [invoiceId]);
    return result.rows;
  }

  async findAll(userId, filters = {}) {
    let query = `
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.user_id = $1 AND i.deleted_at IS NULL
    `;
    
    const params = [userId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND i.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND i.invoice_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND i.invoice_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (i.invoice_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY i.created_at DESC';

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
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.user_id = $1 AND i.deleted_at IS NULL
    `;
    const params = [userId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND i.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND i.invoice_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND i.invoice_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (i.invoice_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
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
      UPDATE invoices 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(id, userId) {
    const query = `
      UPDATE invoices 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2
    `;
    await pool.query(query, [id, userId]);
  }

  async getNextInvoiceNumber(userId, db = pool) {
    // Use MAX numeric suffix — not created_at (seed rows share identical timestamps).
    const query = `
      SELECT COALESCE(MAX(
        (SUBSTRING(invoice_number FROM 'INV-([0-9]+)'))::integer
      ), 0) AS max_num
      FROM invoices
      WHERE user_id = $1
        AND invoice_number ~ '^INV-[0-9]+$'
    `;

    const result = await db.query(query, [userId]);
    const nextNum = parseInt(result.rows[0].max_num, 10) + 1;
    return `INV-${String(nextNum).padStart(4, '0')}`;
  }
}

export default new InvoiceRepository();
