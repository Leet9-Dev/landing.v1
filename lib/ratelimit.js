import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis;
let limiters;

function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

function getLimiters() {
  if (!limiters) {
    const r = getRedis();
    limiters = {
      // 5 attempts per 15 minutes per IP
      auth: new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "rl:auth",
      }),
      // 3 registrations per hour per IP
      register: new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        prefix: "rl:register",
      }),
    };
  }
  return limiters;
}

export async function checkRateLimit(type, ip) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return { success: true };
  try {
    const { success, reset } = await getLimiters()[type].limit(ip);
    return { success, reset };
  } catch {
    // If Redis is down, fail open (don't block users)
    return { success: true };
  }
}
