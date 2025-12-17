import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";

// Replicate the message schema validation
const insertMessageSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.post("/api/contact", (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      // Simulate successful message creation
      res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
}

describe("Contact Form", () => {
  describe("Validation", () => {
    it("should accept valid contact form submission", async () => {
      const app = createTestApp();

      const response = await request(app).post("/api/contact").send({
        name: "John Doe",
        email: "john@example.com",
        message: "Hello, this is a test message.",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should reject submission without name", async () => {
      const app = createTestApp();

      const response = await request(app).post("/api/contact").send({
        email: "john@example.com",
        message: "Hello",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation error");
    });

    it("should reject submission with invalid email", async () => {
      const app = createTestApp();

      const response = await request(app).post("/api/contact").send({
        name: "John Doe",
        email: "not-an-email",
        message: "Hello",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation error");
    });

    it("should reject submission without message", async () => {
      const app = createTestApp();

      const response = await request(app).post("/api/contact").send({
        name: "John Doe",
        email: "john@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation error");
    });

    it("should reject empty message", async () => {
      const app = createTestApp();

      const response = await request(app).post("/api/contact").send({
        name: "John Doe",
        email: "john@example.com",
        message: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation error");
    });
  });
});

