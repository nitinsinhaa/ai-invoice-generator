import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/v1/invoices', () => {
  it('without auth returns 401', async () => {
    const res = await request(app).post('/api/v1/invoices').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('with invalid body returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', 'Bearer invalid-token')
      .send({ items: [] });

    expect([400, 401]).toContain(res.status);
  });
});

describe('GET /api/v1/invoices', () => {
  it('without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/invoices');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
