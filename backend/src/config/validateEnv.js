import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().min(1).optional(),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().min(1).optional(),
  DB_USER: z.string().min(1).optional(),
  DB_PASSWORD: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRE: z.string().default('15m'),
  JWT_REFRESH_EXPIRE: z.string().default('7d'),
  GEMINI_API_KEY: z.string().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5242880),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(500),
}).superRefine((data, ctx) => {
  const hasUrl = Boolean(data.DATABASE_URL);
  const hasParts = data.DB_HOST && data.DB_NAME && data.DB_USER && data.DB_PASSWORD;
  if (!hasUrl && !hasParts) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Set DATABASE_URL or DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD',
      path: ['DATABASE_URL'],
    });
  }
});

export function loadAndValidateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error('Invalid environment configuration:', formatted);
    throw new Error('Environment validation failed. Check backend/.env');
  }
  return parsed.data;
}
