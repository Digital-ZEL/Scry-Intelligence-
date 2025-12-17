import type { NextFunction, Request, Response } from "express";

/**
 * Minimal cookie parsing middleware to avoid external dependency on `cookie-parser`.
 * - Parses the `Cookie` header into `req.cookies`
 * - Supports URL-decoded cookie values
 */
export default function cookieParser() {
  return function parseCookies(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.cookie;
    const cookies: Record<string, string> = {};

    if (header) {
      header.split(";").forEach((cookie) => {
        const [rawName, ...rest] = cookie.split("=");
        const name = rawName?.trim();
        if (!name) return;
        const value = rest.join("=").trim();
        // Decode safely; fall back to raw value on decode errors
        try {
          cookies[name] = decodeURIComponent(value);
        } catch {
          cookies[name] = value;
        }
      });
    }

    (req as Request & { cookies: Record<string, string> }).cookies = cookies;
    next();
  };
}

