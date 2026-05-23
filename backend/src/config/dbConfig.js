/** Parse DATABASE_URL into DB_* when individual vars are not set (Render, Railway, etc.). */
export function hydrateDbEnvFromUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || process.env.DB_HOST) return;

  try {
    const parsed = new URL(url);
    process.env.DB_HOST = parsed.hostname;
    process.env.DB_PORT = parsed.port || '5432';
    process.env.DB_NAME = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    process.env.DB_USER = decodeURIComponent(parsed.username);
    process.env.DB_PASSWORD = decodeURIComponent(parsed.password);
  } catch {
  }
}

export function getDatabasePoolConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const common = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  if (process.env.DATABASE_URL) {
    return {
      ...common,
      connectionString: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    ...common,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
}
