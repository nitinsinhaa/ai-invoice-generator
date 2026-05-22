import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';
import {
  EXPENSE_CATEGORIES,
  categorizeByKeywords,
  normalizeCategory,
} from './expenseCategorizer.js';

// Prefer 2.5 models — new API keys often have zero quota on 2.0 free tier
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class GeminiService {
  ensureConfigured() {
    if (!config.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is not set in backend .env');
    }
  }

  async generateText(prompt) {
    this.ensureConfigured();
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    let lastError;

    for (const modelName of GEMINI_MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text().trim();
        } catch (error) {
          lastError = error;
          const isRetryable =
            error.message?.includes('503') || error.message?.includes('429');
          console.error(`Gemini API Error (${modelName}, attempt ${attempt + 1}):`, error.message?.split('\n')[0]);
          if (isRetryable && attempt < 2) {
            await sleep(2000 * (attempt + 1));
            continue;
          }
          break;
        }
      }
    }

    throw lastError || new Error('Failed to generate AI response');
  }

  async generateInvoiceDescription(productName, context = '') {
    const prompt = `Generate a professional and concise product/service description for an invoice item: "${productName}". ${context ? `Context: ${context}` : ''} Keep it under 100 characters. Only return the description, nothing else.`;
    try {
      const text = await this.generateText(prompt);
      return { text, usedFallback: false };
    } catch (error) {
      const text = `${productName} — professional service delivered as per agreement.`.slice(0, 100);
      return { text, usedFallback: true, reason: error.message };
    }
  }

  async generateInvoiceNotes({ customerName, items, subtotal, taxRate, total, dueDate }) {
    const lineSummary = (items || [])
      .map((i) => `${i.product_name || i.name} x${i.quantity} @ ${i.unit_price}`)
      .join('; ');

    const prompt = `Write professional invoice notes (payment terms, thank-you, brief terms) for:
Customer: ${customerName || 'Customer'}
Items: ${lineSummary || 'services'}
Subtotal: ${subtotal}, Tax: ${taxRate}%, Total: ${total}, Due: ${dueDate || 'as agreed'}
Keep under 200 characters, plain text, no markdown. Only return the notes text.`;

    try {
      const text = await this.generateText(prompt);
      return { text, usedFallback: false };
    } catch (error) {
      const due = dueDate ? `Payment due by ${dueDate}. ` : '';
      const text = `${due}Thank you, ${customerName || 'valued customer'}. Total payable: ${total} (incl. ${taxRate || 0}% tax). Please remit via bank transfer.`;
      return { text, usedFallback: true, reason: error.message };
    }
  }

  async suggestTaxRate(productCategory, location = 'US') {
    try {
      const prompt = `Suggest a typical tax rate percentage for "${productCategory}" in ${location}. Respond with only the numeric percentage value (e.g., 8.5). No explanation, just the number.`;
      const text = await this.generateText(prompt);
      const taxRate = parseFloat(text);
      return isNaN(taxRate) ? 0 : taxRate;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 0;
    }
  }

  async categorizeExpense(description, amount) {
    const keywordCategory = categorizeByKeywords(description);
    const categoryList = EXPENSE_CATEGORIES.join(', ');

    try {
      const prompt = `Categorize this business expense for India/SMB context.
Description: "${description}"
Amount: ${amount} INR
Pick exactly ONE from: ${categoryList}
Reply with only the category name, no punctuation or explanation.`;

      const raw = await this.generateText(prompt);
      const category = normalizeCategory(raw) || keywordCategory;

      return {
        category,
        source: 'ai',
        usedFallback: false,
      };
    } catch (error) {
      console.error('Gemini categorize fallback:', error.message);
      return {
        category: keywordCategory,
        source: 'keywords',
        usedFallback: true,
        reason: error.message?.includes('429')
          ? 'API quota exceeded — using smart keyword match'
          : 'AI unavailable — using smart keyword match',
      };
    }
  }

  async suggestRecurringInvoice(customerHistory) {
    try {
      const prompt = `Based on this customer's invoice history: ${JSON.stringify(customerHistory)}, should this be a recurring invoice? If yes, suggest frequency (weekly, monthly, quarterly, yearly). Respond in JSON format only: {"recurring": true/false, "frequency": "monthly"}`;
      const text = await this.generateText(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { recurring: false, frequency: null };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { recurring: false, frequency: null };
    }
  }

  async generateBusinessInsights(statsPayload) {
    const prompt = `You are a business finance advisor for a small business using an invoice & expense app.
Analyze this data and respond in 3-4 short bullet points (plain English, actionable):
${JSON.stringify(statsPayload, null, 2)}

Cover: cash health, outstanding invoices, top spending areas, one practical tip.
No markdown headers, use bullet points starting with "•". Keep under 120 words.`;
    return this.generateText(prompt);
  }

  async autoFillCustomerDetails(partialInfo) {
    try {
      const prompt = `Based on this partial customer information: ${JSON.stringify(partialInfo)}, suggest likely missing details for a business customer. Return JSON with suggested values for missing fields. Only return valid JSON, no explanation.`;
      const text = await this.generateText(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.error('Gemini API Error:', error);
      return {};
    }
  }
}

export default new GeminiService();
