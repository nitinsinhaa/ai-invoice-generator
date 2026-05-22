import express from 'express';
import expenseController from '../controllers/expenseController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validateZod.js';
import { expenseSchema } from '../validations/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', expenseController.getExpenseSummary);
router.post('/', validate(expenseSchema), expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', validate(expenseSchema.partial()), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

export default router;
