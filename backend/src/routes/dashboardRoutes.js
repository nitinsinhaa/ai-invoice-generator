import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', dashboardController.getDashboardStats);

export default router;
