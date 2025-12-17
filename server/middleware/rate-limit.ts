import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate limiter for authentication endpoints.
 * Prevents brute-force attacks on login/register.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: "Too many authentication attempts",
    message: "Please try again after 15 minutes",
    retryAfter: 15 * 60,
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
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour
  message: {
    error: "Too many contact form submissions",
    message: "Please try again after 1 hour",
    retryAfter: 60 * 60,
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
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: "Too many requests",
    message: "Please slow down and try again",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip for health checks and in test environment
    return req.path === "/health" || process.env.NODE_ENV === "test";
  },
});

