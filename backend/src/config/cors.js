import config from './env.js';

/** Comma-separated FRONTEND_URL values, e.g. https://app.onrender.com,https://api.onrender.com */
function getExplicitOrigins() {
  return config.frontendUrls;
}

/** Render free-tier URLs use random suffixes; allow any *.onrender.com in production. */
function isRenderOrigin(origin) {
  return /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin);
}

export function isOriginAllowed(origin) {
  if (!origin) return true;
  if (getExplicitOrigins().includes(origin)) return true;
  if (config.nodeEnv === 'production' && isRenderOrigin(origin)) return true;
  if (config.nodeEnv === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
}

export function corsOriginCallback(origin, callback) {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`CORS blocked origin: ${origin}`));
}
