import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback used when Upstash env vars are not configured.
const _mem = new Map();
function memoryRatelimit(limit, windowMs) {
  return {
    limit: async (key) => {
      const now = Date.now();
      const e = _mem.get(key) ?? { n: 0, reset: now + windowMs };
      if (now > e.reset) { e.n = 0; e.reset = now + windowMs; }
      e.n++;
      _mem.set(key, e);
      const success = e.n <= limit;
      return { success, limit, remaining: Math.max(0, limit - e.n), reset: e.reset };
    },
  };
}

function makeRatelimiter(limit, window) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: true,
    });
  }
  // Parse window string like "60 s" → ms
  const windowMs = window.endsWith("s") ? parseInt(window) * 1000 : 60_000;
  return memoryRatelimit(limit, windowMs);
}

// 10 requests per 60 seconds — used by the 1v1 compare endpoint
export const compareRatelimit = makeRatelimiter(10, "60 s");
