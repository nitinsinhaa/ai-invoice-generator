export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Marketing',
  'Utilities',
  'Salaries',
  'Equipment',
  'Software',
  'Services',
  'Other',
];

const KEYWORD_RULES = [
  { category: 'Travel', keywords: ['flight', 'airline', 'hotel', 'airbnb', 'uber', 'ola', 'taxi', 'cab', 'travel', 'trip', 'mileage', 'fuel', 'petrol', 'diesel', 'train', 'bus', 'visa', 'passport'] },
  { category: 'Software', keywords: ['software', 'saas', 'subscription', 'license', 'hosting', 'domain', 'aws', 'azure', 'google cloud', 'github', 'notion', 'slack', 'zoom', 'figma', 'adobe', 'app store'] },
  { category: 'Marketing', keywords: ['marketing', 'advertising', 'ads', 'google ads', 'facebook ads', 'meta ads', 'seo', 'campaign', 'promotion', 'sponsor', 'branding', 'social media'] },
  { category: 'Utilities', keywords: ['electricity', 'electric', 'water bill', 'gas bill', 'internet', 'wifi', 'broadband', 'phone bill', 'mobile bill', 'utility', 'utilities', 'rent'] },
  { category: 'Salaries', keywords: ['salary', 'salaries', 'payroll', 'wages', 'bonus', 'stipend', 'contractor pay', 'employee pay'] },
  { category: 'Equipment', keywords: ['equipment', 'laptop', 'computer', 'monitor', 'printer', 'furniture', 'desk', 'chair', 'hardware', 'machine', 'tool'] },
  { category: 'Office Supplies', keywords: ['office', 'stationery', 'paper', 'pen', 'printer ink', 'supplies', 'stapler', 'folder'] },
  { category: 'Services', keywords: ['consulting', 'legal', 'accounting', 'audit', 'freelance', 'service fee', 'professional fee', 'maintenance', 'repair', 'cleaning', 'insurance'] },
];

export function categorizeByKeywords(description) {
  const text = (description || '').toLowerCase();

  let best = { category: 'Other', score: 0 };

  for (const rule of KEYWORD_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (score > best.score) {
      best = { category: rule.category, score };
    }
  }

  return best.category;
}

export function normalizeCategory(raw, validList = EXPENSE_CATEGORIES) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^["']|["']$/g, '');
  const exact = validList.find((c) => c.toLowerCase() === cleaned.toLowerCase());
  if (exact) return exact;

  const partial = validList.find(
    (c) =>
      cleaned.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(cleaned.toLowerCase())
  );
  if (partial) return partial;

  return categorizeByKeywords(cleaned);
}
