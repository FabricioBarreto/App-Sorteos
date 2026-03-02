// Rate limiter en memoria - simple y efectivo
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  stores.forEach((store) => {
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  name: string;
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const store = getStore(config.name);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

// Configuraciones predefinidas
export const RATE_LIMITS = {
  register: { name: "register", maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 por hora
  login: { name: "login", maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 en 15 min
  api: { name: "api", maxRequests: 60, windowMs: 60 * 1000 }, // 60 por minuto
};
