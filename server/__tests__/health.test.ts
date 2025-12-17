import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

function createTestApp(dbHealthy = true) {
  const app = express();
  app.use(express.json());

  app.get("/health", async (req, res) => {
    try {
      if (!dbHealthy) {
        throw new Error("Database connection failed");
      }
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
          session: "connected",
        },
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "disconnected",
          session: "unknown",
        },
      });
    }
  });

  return app;
}

describe("Health Check", () => {
  it("should return 200 when all services are healthy", async () => {
    const app = createTestApp(true);

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.services.database).toBe("connected");
  });

  it("should return 503 when database is unhealthy", async () => {
    const app = createTestApp(false);

    const response = await request(app).get("/health");

    expect(response.status).toBe(503);
    expect(response.body.status).toBe("unhealthy");
    expect(response.body.services.database).toBe("disconnected");
  });

  it("should include timestamp in health response", async () => {
    const app = createTestApp(true);

    const response = await request(app).get("/health");

    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });
});

