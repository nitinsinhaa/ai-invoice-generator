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
    const p = req.originalUrl || req.path;
    return p === '/api/health' || p === '/api/v1/health' || p === '/health';
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10000 : 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'AI request limit reached. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'Email send limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
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
