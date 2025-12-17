import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";

declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Double-submit cookie CSRF protection middleware.
 * 
 * For state-changing requests (POST, PUT, PATCH, DELETE):
 * - Validates that the X-CSRF-Token header matches the csrf-token cookie
 * - Rejects requests with missing or mismatched tokens
 * 
 * For all requests:
 * - Sets a CSRF cookie if not present
 * - Provides req.csrfToken() to get the current token for embedding in forms/JS
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Generate or retrieve CSRF token
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  
  if (!token) {
    token = randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by client JS
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    });
  }

  // Attach helper to request
  req.csrfToken = () => token;

  // Skip validation for safe methods
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Validate CSRF token for state-changing methods
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  
  if (!headerToken || headerToken !== token) {
    return res.status(403).json({ 
      error: "CSRF token validation failed",
      message: "Missing or invalid CSRF token" 
    });
  }

  next();
}

/**
 * Endpoint to get a CSRF token for the client.
 * Call this endpoint and include the token in subsequent requests.
 */
export function csrfTokenEndpoint(req: Request, res: Response) {
  const token = req.csrfToken?.() || randomBytes(32).toString("hex");
  
  // Set cookie if not already set
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });
  }
  
  res.json({ csrfToken: token });
}

