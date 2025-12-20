import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { requestLogger, logger } from "./middleware/logger";
import { apiLimiter } from "./middleware/rate-limit";
import { securityHeaders } from "./middleware/security";

const app = express();

// Structured request logging with request IDs (place early to capture all errors)
app.use(requestLogger);

app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// General API rate limiting
app.use("/api", apiLimiter);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const duration = req.requestStartTime
      ? Date.now() - req.requestStartTime
      : 0;

    // Log error with request ID for tracing
    logger.error({
      timestamp: new Date().toISOString(),
      requestId: req.requestId || "unknown",
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: status,
      duration,
      userAgent: req.headers["user-agent"]?.substring(0, 100),
      ip: (req.ip || req.socket.remoteAddress || "unknown").replace(
        /^::ffff:/,
        "",
      ),
      userId: (req.user as any)?.id,
      errorMessage: message,
    });

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
