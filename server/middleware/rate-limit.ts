import type { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: Record<string, unknown>;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

interface HitRecord {
  count: number;
  expiresAt: number;
}

function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message,
    standardHeaders = false,
    legacyHeaders = false,
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || "unknown",
    skip = () => false,
  } = options;

  const hits = new Map<string, HitRecord>();

  function cleanup(key: string, record: HitRecord, now: number) {
    if (record.expiresAt <= now) {
      hits.delete(key);
    }
  }

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    if (skip(req)) return next();

    const key = keyGenerator(req);
    const now = Date.now();
    const record = hits.get(key);

    if (!record || record.expiresAt <= now) {
      hits.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    cleanup(key, record, now);

    if (record.count >= max) {
      const retryAfterSec = Math.ceil((record.expiresAt - now) / 1000);

      if (standardHeaders) {
        res.setHeader("RateLimit-Limit", max.toString());
        res.setHeader("RateLimit-Remaining", "0");
        res.setHeader("RateLimit-Reset", Math.ceil(record.expiresAt / 1000).toString());
      }

      if (legacyHeaders) {
        res.setHeader("X-RateLimit-Limit", max.toString());
        res.setHeader("X-RateLimit-Remaining", "0");
        res.setHeader("Retry-After", retryAfterSec.toString());
      }

      return res.status(429).json({ ...message, retryAfter: retryAfterSec });
    }

    record.count += 1;
    hits.set(key, record);

    if (standardHeaders) {
      res.setHeader("RateLimit-Limit", max.toString());
      res.setHeader("RateLimit-Remaining", Math.max(max - record.count, 0).toString());
      res.setHeader("RateLimit-Reset", Math.ceil(record.expiresAt / 1000).toString());
    }

    if (legacyHeaders) {
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", Math.max(max - record.count, 0).toString());
    }

    next();
  };
}

/**
 * Rate limiter for authentication endpoints.
 * Prevents brute-force attacks on login/register.
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: "Too many authentication attempts",
    message: "Please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP + username for more precise limiting
    const username = req.body?.username || "";
    return `${req.ip}-${username}`;
  },
  skip: (req: Request) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Rate limiter for contact form submissions.
 * Prevents spam while allowing legitimate use.
 */
export const contactLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour
  message: {
    error: "Too many contact form submissions",
    message: "Please try again after 1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return process.env.NODE_ENV === "test";
  },
});

/**
 * General API rate limiter.
 * Prevents abuse while allowing normal usage.
 */
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: "Too many requests",
    message: "Please slow down and try again",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip for health checks and in test environment
    return req.path === "/health" || process.env.NODE_ENV === "test";
  },
});
