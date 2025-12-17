import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

function createTestApp(isAdmin = false) {
  const app = express();
  app.use(express.json());

  // Simulate session middleware
  app.use((req, res, next) => {
    (req as any).isAuthenticated = () => isAdmin;
    (req as any).user = isAdmin ? { id: 1, role: "admin" } : null;
    next();
  });

  // Admin middleware
  const isAdminMiddleware = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user?.role === "admin") {
      return next();
    }
    res.status(403).json({ error: "Forbidden" });
  };

  // Admin routes
  app.get("/api/admin/messages", isAdminMiddleware, (req, res) => {
    res.json([
      { id: 1, name: "Test", email: "test@test.com", message: "Hello", read: false },
    ]);
  });

  app.patch("/api/admin/messages/:id/read", isAdminMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    res.json({ success: true });
  });

  app.post("/api/admin/research-areas", isAdminMiddleware, (req, res) => {
    const { title, description, isRestricted, order } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Validation error" });
    }
    res.status(201).json({
      id: 1,
      title,
      description,
      isRestricted: isRestricted || false,
      order: order || 0,
    });
  });

  return app;
}

describe("Admin Routes", () => {
  describe("Authorization", () => {
    it("should reject non-admin access to messages", async () => {
      const app = createTestApp(false);

      const response = await request(app).get("/api/admin/messages");

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Forbidden");
    });

    it("should reject non-admin access to mark as read", async () => {
      const app = createTestApp(false);

      const response = await request(app).patch("/api/admin/messages/1/read");

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Forbidden");
    });

    it("should reject non-admin access to create research areas", async () => {
      const app = createTestApp(false);

      const response = await request(app).post("/api/admin/research-areas").send({
        title: "Test",
        description: "Test description",
      });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Forbidden");
    });
  });

  describe("Admin Access", () => {
    it("should allow admin to get messages", async () => {
      const app = createTestApp(true);

      const response = await request(app).get("/api/admin/messages");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should allow admin to mark message as read", async () => {
      const app = createTestApp(true);

      const response = await request(app).patch("/api/admin/messages/1/read");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should allow admin to create research area", async () => {
      const app = createTestApp(true);

      const response = await request(app).post("/api/admin/research-areas").send({
        title: "AI Ethics",
        description: "Research on ethical AI development",
        isRestricted: true,
        order: 1,
      });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("AI Ethics");
      expect(response.body.isRestricted).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should reject research area without title", async () => {
      const app = createTestApp(true);

      const response = await request(app).post("/api/admin/research-areas").send({
        description: "Test description",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation error");
    });

    it("should reject research area without description", async () => {
      const app = createTestApp(true);

      const response = await request(app).post("/api/admin/research-areas").send({
        title: "Test",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation error");
    });
  });
});

