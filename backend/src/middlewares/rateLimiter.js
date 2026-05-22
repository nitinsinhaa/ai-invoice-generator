import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

const isDev = config.nodeEnv === 'development' || config.nodeEnv === 'test';

export const apiLimiter = rateLimit({
  windowMs: Number(config.rateLimit.windowMs) || 15 * 60 * 1000,
  max: isDev ? 10000 : Number(config.rateLimit.maxRequests) || 500,
  message: { success: false, message: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (isDev) return true;
    return req.originalUrl === '/api/health' || req.path === '/health';
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  message: { success: false, message: 'Too many login attempts. Please try again in a few minutes.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});
