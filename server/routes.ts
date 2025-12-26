import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMessageSchema, insertResearchAreaSchema } from "@shared/schema";
import { ZodError } from "zod";
import { pool } from "./db";
import { csrfProtection, csrfTokenEndpoint } from "./middleware/csrf";
import { contactLimiter } from "./middleware/rate-limit";
import authExtendedRoutes from "./routes/auth-extended";

// Middleware to check if user is authenticated
const _isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Forbidden" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // CSRF token endpoint - client should call this to get a token
  app.get("/api/csrf-token", csrfTokenEndpoint);

  // Apply CSRF protection to all state-changing API routes
  app.use("/api", csrfProtection);

  // Extended auth routes (password reset, 2FA)
  app.use(authExtendedRoutes);

  // Health check endpoint for monitoring/load balancers
  app.get("/health", async (_req, res) => {
    try {
      // Check database connectivity
      await pool.query("SELECT 1");
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
          session: "connected"
        }
      });
    } catch {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "disconnected",
          session: "unknown"
        }
      });
    }
  });

  // API Routes
  
  // Contact form submission (with rate limiting)
  app.post("/api/contact", contactLimiter, async (req, res, next) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      await storage.createMessage(messageData);
      res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      next(error);
    }
  });

  // Get research areas
  app.get("/api/research-areas", async (req, res, next) => {
    try {
      const areas = await storage.getResearchAreas();
      res.json(areas);
    } catch (error) {
      next(error);
    }
  });

  // Admin routes - protected with isAdmin middleware
  
  // Get all messages
  app.get("/api/admin/messages", isAdmin, async (req, res, next) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  // Mark message as read
  app.patch("/api/admin/messages/:id/read", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markMessageAsRead(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Create research area
  app.post("/api/admin/research-areas", isAdmin, async (req, res, next) => {
    try {
      const areaData = insertResearchAreaSchema.parse(req.body);
      const area = await storage.createResearchArea(areaData);
      res.status(201).json(area);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
