import express from 'express';
import invoiceController from '../controllers/invoiceController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validateZod.js';
import { createInvoiceSchema, updateInvoiceSchema } from '../validations/schemas.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createInvoiceSchema), invoiceController.createInvoice);
router.get('/stats', invoiceController.getInvoiceStats);
router.get('/', invoiceController.getInvoices);
router.get('/:id/download', invoiceController.downloadInvoice);
router.post('/:id/send', invoiceController.sendInvoiceEmail);
router.patch('/:id/mark-paid', invoiceController.markAsPaid);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', validate(updateInvoiceSchema), invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
