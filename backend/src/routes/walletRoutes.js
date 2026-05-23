import express from 'express';
import walletController from '../controllers/walletController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validateZod.js';
import { addFundsSchema, bankAccountSchema } from '../validations/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', walletController.getWallet);
router.post('/add-funds', validate(addFundsSchema), walletController.addFunds);
router.post('/withdraw', validate(addFundsSchema), walletController.withdrawFunds);
router.get('/transactions', walletController.getTransactions);
router.get('/bank-accounts', walletController.getBankAccounts);
router.post('/bank-accounts', validate(bankAccountSchema), walletController.addBankAccount);
router.delete('/bank-accounts/:id', walletController.removeBankAccount);

export default router;
