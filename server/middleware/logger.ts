import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export interface LogEntry {
  timestamp: string;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  userId?: number;
  level: "info" | "warn" | "error";
}

/**
 * Structured logger that outputs JSON logs.
 * Includes request ID for tracing and excludes PII.
 */
class StructuredLogger {
  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  info(entry: Omit<LogEntry, "level">) {
    console.log(this.formatLogEntry({ ...entry, level: "info" }));
  }

  warn(entry: Omit<LogEntry, "level">) {
    console.warn(this.formatLogEntry({ ...entry, level: "warn" }));
  }

  error(entry: Omit<LogEntry, "level">) {
    console.error(this.formatLogEntry({ ...entry, level: "error" }));
  }

  // Simple message log (for startup messages, etc.)
  log(message: string, source = "server") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
  }
}

export const logger = new StructuredLogger();

/**
 * Middleware that adds request ID and structured logging.
 * - Generates unique request ID for tracing
 * - Logs request metadata (no PII/body content)
 * - Sets X-Request-ID header in response
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Generate unique request ID
  req.requestId = randomBytes(8).toString("hex");
  
  // Set request ID in response header for client-side correlation
  res.setHeader("X-Request-ID", req.requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Only log API requests
    if (req.path.startsWith("/api") || req.path === "/health") {
      const entry: Omit<LogEntry, "level"> = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId!,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers["user-agent"]?.substring(0, 100), // Truncate UA
        ip: (req.ip || req.socket.remoteAddress || "unknown").replace(/^::ffff:/, ""), // Clean IPv4-mapped IPv6
        userId: (req.user as { id?: number } | undefined)?.id,
      };

      // Choose log level based on status code
      if (res.statusCode >= 500) {
        logger.error(entry);
      } else if (res.statusCode >= 400) {
        logger.warn(entry);
      } else {
        logger.info(entry);
      }
    }
  });

  next();
}

