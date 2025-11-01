import { eq } from "drizzle-orm";
import { log } from "./vite";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";

const REQUIRED_ADMIN_ENV = ["ADMIN_USERNAME", "ADMIN_PASSWORD", "ADMIN_EMAIL"] as const;

type RequiredAdminEnv = (typeof REQUIRED_ADMIN_ENV)[number];

function requireAdminEnv(name: RequiredAdminEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} must be defined in production to provision the initial admin account.`,
    );
  }
  return value;
}

async function ensureAdminUserFromEnv() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME;

  if (!username || !password || !email) {
    if (process.env.NODE_ENV === "production") {
      REQUIRED_ADMIN_ENV.forEach(requireAdminEnv);
    } else {
      log(
        "Skipping admin bootstrap – ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_EMAIL are required to auto-provision an admin user.",
        "bootstrap",
      );
    }
    return;
  }

  const existing = await storage.getUserByUsername(username);
  if (existing) {
    if (existing.role !== "admin") {
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.id, existing.id));
      log(`Promoted existing user \"${username}\" to admin.`, "bootstrap");
    }
    return;
  }

  const hashedPassword = await hashPassword(password);
  await db.insert(users).values({
    username,
    password: hashedPassword,
    email,
    name: name ?? username,
    role: "admin",
  });
  log(`Created admin user \"${username}\" from environment variables.`, "bootstrap");
}

export async function bootstrap() {
  await ensureAdminUserFromEnv();
}
