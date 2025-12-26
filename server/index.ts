import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { requestLogger, logger } from "./middleware/logger";
import { apiLimiter } from "./middleware/rate-limit";
import { securityHeaders } from "./middleware/security";
import { initSentry, Sentry } from "./sentry";

// Initialize Sentry for error tracking (must be first)
initSentry();

const app = express();
app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Structured request logging with request IDs
app.use(requestLogger);

// General API rate limiting
app.use("/api", apiLimiter);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: Error & { status?: number; statusCode?: number }, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error with request ID for tracing
    logger.error({
      timestamp: new Date().toISOString(),
      requestId: req.requestId || "unknown",
      method: req.method,
      path: req.path,
      statusCode: status,
      duration: 0,
    });

    // Report to Sentry for 5xx errors
    if (status >= 500) {
      Sentry.captureException(err, {
        tags: {
          requestId: req.requestId || "unknown",
          path: req.path,
          method: req.method,
        },
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.error(err.stack);
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the port provided by the environment (Railway) or default to 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.log(`serving on port ${port}`);
  });
})();
