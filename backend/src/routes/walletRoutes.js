import express from 'express';
import walletController from '../controllers/walletController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', walletController.getWallet);
router.post('/add-funds', walletController.addFunds);
router.post('/withdraw', walletController.withdrawFunds);
router.get('/transactions', walletController.getTransactions);
router.get('/bank-accounts', walletController.getBankAccounts);
router.post('/bank-accounts', walletController.addBankAccount);
router.delete('/bank-accounts/:id', walletController.removeBankAccount);

export default router;
