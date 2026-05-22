import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/status', notificationController.getStatus);
router.post('/test', notificationController.sendTest);

export default router;
