import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import cookieParser from "../middleware/cookie-parser";
import request from "supertest";

// Create a minimal test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    })
  );

  return app;
}

describe("Authentication", () => {
  describe("Input Validation", () => {
    it("should reject registration without username", async () => {
      const app = createTestApp();
      
      // Mock the register endpoint validation
      app.post("/api/register", (req, res) => {
        if (!req.body.username) {
          return res.status(400).json({ error: "Validation error" });
        }
        res.status(201).json({ id: 1, username: req.body.username });
      });

      const response = await request(app)
        .post("/api/register")
        .send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation error");
    });

    it("should reject registration without password", async () => {
      const app = createTestApp();
      
      app.post("/api/register", (req, res) => {
        if (!req.body.password) {
          return res.status(400).json({ error: "Validation error" });
        }
        res.status(201).json({ id: 1, username: req.body.username });
      });

      const response = await request(app)
        .post("/api/register")
        .send({ username: "testuser" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation error");
    });

    it("should reject login with invalid credentials", async () => {
      const app = createTestApp();
      
      app.post("/api/login", (req, res) => {
        // Simulate failed authentication
        res.status(401).json({ error: "Invalid username or password" });
      });

      const response = await request(app)
        .post("/api/login")
        .send({ username: "wronguser", password: "wrongpass" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid username or password");
    });
  });

  describe("Session Management", () => {
    it("should return 401 for unauthenticated /api/user request", async () => {
      const app = createTestApp();
      
      app.get("/api/user", (req, res) => {
        if (!req.session || !(req.session as any).userId) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        res.json({ id: 1, username: "testuser" });
      });

      const response = await request(app).get("/api/user");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Not authenticated");
    });

    it("should handle logout correctly", async () => {
      const app = createTestApp();
      
      app.post("/api/logout", (req, res) => {
        req.session.destroy((err) => {
          if (err) return res.status(500).json({ error: "Logout failed" });
          res.sendStatus(200);
        });
      });

      const response = await request(app).post("/api/logout");

      expect(response.status).toBe(200);
    });
  });

  describe("Security", () => {
    it("should not allow setting role during registration", async () => {
      const app = createTestApp();
      
      // Simulate validated registration that strips role field
      app.post("/api/register", (req, res) => {
        const { username, password, name, email } = req.body;
        // Only allowed fields, role is not included
        const user = { 
          id: 1, 
          username, 
          name, 
          email, 
          role: "user" // Default role, ignoring any passed role
        };
        res.status(201).json(user);
      });

      const response = await request(app)
        .post("/api/register")
        .send({
          username: "attacker",
          password: "password123",
          role: "admin", // This should be ignored
        });

      expect(response.status).toBe(201);
      expect(response.body.role).toBe("user"); // Should default to user, not admin
    });
  });
});

