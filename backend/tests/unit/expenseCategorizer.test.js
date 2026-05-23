import { describe, it, expect } from 'vitest';
import {
  categorizeByKeywords,
  normalizeCategory,
} from '../../src/ai/expenseCategorizer.js';

describe('expenseCategorizer', () => {
  describe('categorizeByKeywords', () => {
    it("identifies Travel from 'uber ride to airport'", () => {
      expect(categorizeByKeywords('uber ride to airport')).toBe('Travel');
    });

    it("identifies Software from 'github subscription'", () => {
      expect(categorizeByKeywords('github subscription')).toBe('Software');
    });

    it("returns 'Other' for unknown descriptions", () => {
      expect(categorizeByKeywords('random misc purchase')).toBe('Other');
    });
  });

  describe('normalizeCategory', () => {
    it('handles case-insensitive matching', () => {
      expect(normalizeCategory('travel')).toBe('Travel');
      expect(normalizeCategory('SOFTWARE')).toBe('Software');
    });

    it('handles partial matches', () => {
      expect(normalizeCategory('Office Supplies purchase')).toBe('Office Supplies');
    });
  });
});
