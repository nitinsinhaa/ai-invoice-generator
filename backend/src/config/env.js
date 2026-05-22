import dotenv from 'dotenv';
import { loadAndValidateEnv } from './validateEnv.js';

dotenv.config();

const env = loadAndValidateEnv();

const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  frontendUrl: env.FRONTEND_URL,

  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expire: env.JWT_EXPIRE,
    refreshExpire: env.JWT_REFRESH_EXPIRE,
  },

  gemini: {
    apiKey: env.GEMINI_API_KEY,
  },

  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    user: env.EMAIL_USER,
    password: env.EMAIL_PASSWORD,
    from: env.EMAIL_FROM,
  },

  upload: {
    dir: env.UPLOAD_DIR,
    maxSize: env.MAX_FILE_SIZE,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
};

export default config;
