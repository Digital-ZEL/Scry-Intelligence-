import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMessageSchema } from "@shared/schema";
import { ZodError } from "zod";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
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

  // API Routes
  
  // Contact form submission
  app.post("/api/contact", async (req, res, next) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
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
      const area = await storage.createResearchArea(req.body);
      res.status(201).json(area);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
