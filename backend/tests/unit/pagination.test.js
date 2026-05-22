import { describe, it, expect } from 'vitest';
import { parsePagination, paginatedResponse } from '../../src/utils/pagination.js';

describe('pagination', () => {
  it('parses page and limit with defaults', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('caps limit at max', () => {
    const result = parsePagination({ page: '2', limit: '500' }, { maxLimit: 100 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(100);
  });

  it('builds paginated response', () => {
    const res = paginatedResponse([1, 2], 25, 2, 10);
    expect(res).toEqual({
      items: [1, 2],
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });
});
