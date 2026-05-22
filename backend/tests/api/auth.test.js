import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/auth/login', () => {
  it('rejects invalid payload with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/register', () => {
  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'short',
        full_name: 'Test User',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation/i);
  });
});
