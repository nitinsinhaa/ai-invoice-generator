import pool from '../config/database.js';
import crypto from 'crypto';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

class RefreshTokenRepository {
  async create(userId, token, expiresAt) {
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const result = await pool.query(query, [userId, hashToken(token), expiresAt]);
    return result.rows[0];
  }

  async findValid(userId, token) {
    const query = `
      SELECT * FROM refresh_tokens
      WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > NOW()
      LIMIT 1
    `;
    const result = await pool.query(query, [userId, hashToken(token)]);
    return result.rows[0];
  }

  async revokeByUser(userId) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }

  async revokeToken(userId, token) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND token_hash = $2`,
      [userId, hashToken(token)]
    );
  }
}

export default new RefreshTokenRepository();
