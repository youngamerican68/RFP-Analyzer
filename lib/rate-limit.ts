/**
 * Simple in-memory rate limiter for API routes
 *
 * For production, consider using:
 * - Redis-based rate limiting (for multi-instance deployments)
 * - Vercel Edge Config
 * - Upstash Rate Limit
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store: IP -> { count, resetAt }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Remaining requests in the current window
   */
  remaining: number;

  /**
   * When the rate limit resets (Unix timestamp)
   */
  resetAt: number;

  /**
   * Time until reset in milliseconds
   */
  retryAfter?: number;
}

/**
 * Check if a request should be rate-limited
 *
 * @param identifier - Usually IP address or user ID
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or entry expired - allow and create new entry
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Entry exists and not expired
  if (entry.count < config.maxRequests) {
    // Under limit - increment and allow
    entry.count++;

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  // Over limit - deny
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    retryAfter: entry.resetAt - now,
  };
}

/**
 * Get client IP from request headers
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIP(headers: Headers): string {
  // Try various headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default
  return 'unknown';
}
