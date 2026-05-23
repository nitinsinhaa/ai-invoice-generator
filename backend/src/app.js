import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from './config/env.js';
import { corsOriginCallback } from './config/cors.js';
import pool from './config/database.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import productRoutes from './routes/productRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const API_PREFIX = '/api/v1';

app.set('trust proxy', 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '../../frontend/dist');
const serveFrontend = config.nodeEnv === 'production' && fs.existsSync(clientDist);

app.use(helmet(serveFrontend ? { contentSecurityPolicy: false } : {}));
app.use(
  cors({
    origin: corsOriginCallback,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(
  morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', {
    stream:
      config.nodeEnv === 'production'
        ? { write: (message) => logger.http(message.trim()) }
        : undefined,
  })
);

const healthHandler = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      message: 'AI Invoice Generator API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'DEGRADED',
      message: 'API up but database unreachable',
      database: 'disconnected',
    });
  }
};

app.get('/api/health', healthHandler);
app.get(`${API_PREFIX}/health`, healthHandler);

app.use('/api', apiLimiter);
app.use(API_PREFIX, apiLimiter);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/invoices`, invoiceRoutes);
app.use(`${API_PREFIX}/transactions`, transactionRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/expenses`, expenseRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);

if (serveFrontend) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'AI Invoice Generator API',
      hint: 'Run the frontend dev server locally, or deploy with scripts/render-build.sh',
      health: `${API_PREFIX}/health`,
    });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
