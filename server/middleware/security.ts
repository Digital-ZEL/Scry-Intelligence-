import { Request, Response, NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Basic CSP
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://replit.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://grainy-gradients.vercel.app;"
  );
  
  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // XSS Protection for older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  next();
}

