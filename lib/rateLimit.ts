/**
 * Lightweight in-memory fixed-window rate limiter for auth endpoints.
 *
 * NOTE: state is per process. This is sufficient for a single-instance
 * deployment (the common case for this app). If the app is ever run as
 * multiple serverless instances behind a load balancer, swap this store for a
 * shared backend (e.g. Redis/Upstash) so limits are enforced globally.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Record one attempt against `key` and report whether it is allowed within a
 * fixed window. The window restarts once `resetAt` has passed.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Best-effort client IP extraction, honoring the first proxy hop. */
export function getClientIp(request: { headers: Headers }): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Clear all tracked buckets. Intended for tests and admin resets. */
export function resetRateLimiter(): void {
  buckets.clear();
}
