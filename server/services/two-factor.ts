import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

const APP_NAME = "Scry Intelligence";
const BACKUP_CODES_COUNT = 10;

/**
 * Generate a new 2FA secret for a user.
 * Does NOT enable 2FA - user must verify with a code first.
 */
export async function generate2FASecret(userId: number): Promise<{
  secret: string;
  qrCodeUrl: string;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    throw new Error("User not found");
  }

  // Generate secret
  const secret = authenticator.generateSecret();

  // Store secret (but don't enable 2FA yet)
  await db.update(users)
    .set({ twoFactorSecret: secret })
    .where(eq(users.id, userId));

  // Generate QR code URL
  const otpauth = authenticator.keyuri(user.username, APP_NAME, secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  return { secret, qrCodeUrl };
}

/**
 * Verify a 2FA code and enable 2FA if valid.
 * Also generates backup codes on first enable.
 */
export async function verify2FAAndEnable(
  userId: number,
  code: string
): Promise<{ enabled: boolean; backupCodes?: string[] }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user || !user.twoFactorSecret) {
    return { enabled: false };
  }

  // Verify the TOTP code
  const isValid = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    return { enabled: false };
  }

  // Generate backup codes
  const backupCodes = await generateBackupCodes();
  const hashedBackupCodes = await hashBackupCodes(backupCodes);

  // Enable 2FA and store hashed backup codes
  await db.update(users)
    .set({
      twoFactorEnabled: true,
      twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
    })
    .where(eq(users.id, userId));

  return { enabled: true, backupCodes };
}

/**
 * Verify a 2FA code during login.
 */
export async function verify2FACode(userId: number, code: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
    return false;
  }

  // First try TOTP code
  const isTOTPValid = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (isTOTPValid) {
    return true;
  }

  // Try backup code
  return await verifyAndConsumeBackupCode(userId, code);
}

/**
 * Disable 2FA for a user.
 */
export async function disable2FA(userId: number): Promise<void> {
  await db.update(users)
    .set({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    })
    .where(eq(users.id, userId));
}

/**
 * Check if a user has 2FA enabled.
 */
export async function is2FAEnabled(userId: number): Promise<boolean> {
  const [user] = await db.select({ enabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, userId));

  return user?.enabled === true;
}

// Helper functions

async function generateBackupCodes(): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    // Generate 8-character alphanumeric codes
    const code = randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashed: string[] = [];
  for (const code of codes) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(code, salt, 64)) as Buffer;
    hashed.push(`${buf.toString("hex")}.${salt}`);
  }
  return hashed;
}

async function verifyAndConsumeBackupCode(userId: number, code: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user || !user.twoFactorBackupCodes) {
    return false;
  }

  const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes);

  for (let i = 0; i < hashedCodes.length; i++) {
    const [hashed, salt] = hashedCodes[i].split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(code.toUpperCase(), salt, 64)) as Buffer;

    if (timingSafeEqual(hashedBuf, suppliedBuf)) {
      // Remove the used backup code
      hashedCodes.splice(i, 1);
      await db.update(users)
        .set({ twoFactorBackupCodes: JSON.stringify(hashedCodes) })
        .where(eq(users.id, userId));
      return true;
    }
  }

  return false;
}
