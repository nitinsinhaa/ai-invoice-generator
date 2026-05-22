import pool from '../config/database.js';
import { AppError } from '../errors/AppError.js';

class ProductRepository {
  async create(productData) {
    const {
      user_id, name, description, sku, price, stock, category
    } = productData;

    const query = `
      INSERT INTO products (
        user_id, name, description, sku, price, stock, category
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, name, description, sku, price, stock, category
    ]);

    return result.rows[0];
  }

  async findAll(userId) {
    const query = `
      SELECT * FROM products 
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async findById(id, userId) {
    const query = `
      SELECT * FROM products 
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [id, userId]);
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
      UPDATE products 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(id, userId) {
    const query = `
      UPDATE products 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2
    `;

    await pool.query(query, [id, userId]);
  }

  async updateStock(id, userId, quantity, db = pool) {
    const query = `
      UPDATE products 
      SET stock = stock - $1
      WHERE id = $2 AND user_id = $3 AND stock >= $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await db.query(query, [quantity, id, userId]);
    if (!result.rows[0]) {
      const product = await this.findById(id, userId);
      if (!product) {
        throw AppError.notFound('Product not found');
      }
      throw AppError.badRequest(
        `Insufficient stock for ${product.name}. Available: ${product.stock}`
      );
    }
    return result.rows[0];
  }
}

export default new ProductRepository();
