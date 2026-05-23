import { describe, it, expect, vi } from 'vitest';
import invoiceRepository from '../../src/repositories/invoiceRepository.js';

const userId = '11111111-1111-1111-1111-111111111111';

describe('invoiceRepository.getNextInvoiceNumber', () => {
  it('returns correctly zero-padded numbers', async () => {
    const mockDb = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ max_num: 42 }] }),
    };

    const num = await invoiceRepository.getNextInvoiceNumber(userId, mockDb);
    expect(num).toBe('INV-0043');
    expect(mockDb.query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock($1, $2)',
      expect.any(Array)
    );
  });
});
