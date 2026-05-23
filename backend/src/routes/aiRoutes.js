import express from 'express';
import aiController from '../controllers/aiController.js';
import { authenticate } from '../middlewares/auth.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(aiLimiter);
router.use(authenticate);

router.get('/business-insights', aiController.businessInsights);
router.post('/generate-description', aiController.generateDescription);
router.post('/generate-invoice-notes', aiController.generateInvoiceNotes);
router.post('/suggest-tax', aiController.suggestTaxRate);
router.post('/categorize-expense', aiController.categorizeExpense);
router.post('/suggest-recurring', aiController.suggestRecurring);
router.post('/autofill-customer', aiController.autoFillCustomer);

export default router;
