import { randomBytes } from "crypto";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth";

const RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a password reset token and store it for the user.
 * Returns the token if successful, null if email not found.
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  // Find user by email
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    return null;
  }

  // Generate secure random token
  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Store token and expiry
  await db.update(users)
    .set({
      resetToken: token,
      resetTokenExpiry: expiry,
    })
    .where(eq(users.id, user.id));

  return token;
}

/**
 * Validate a password reset token.
 * Returns the user ID if valid, null if invalid or expired.
 */
export async function validateResetToken(token: string): Promise<number | null> {
  const [user] = await db.select()
    .from(users)
    .where(eq(users.resetToken, token));

  if (!user || !user.resetTokenExpiry) {
    return null;
  }

  // Check if token has expired
  if (new Date() > user.resetTokenExpiry) {
    return null;
  }

  return user.id;
}

/**
 * Reset user password using a valid token.
 * Clears the reset token after successful reset.
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const userId = await validateResetToken(token);

  if (!userId) {
    return false;
  }

  // Hash new password and clear reset token
  const hashedPassword = await hashPassword(newPassword);

  await db.update(users)
    .set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, userId));

  return true;
}

/**
 * Send password reset email (stub - configure with your email provider).
 * In production, integrate with SendGrid, AWS SES, or similar service.
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/reset-password?token=${token}`;

  // TODO: Integrate with email service
  // For now, log the reset URL (only in development)
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
  }

  // Example SendGrid integration:
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@scryintelligence.com',
  //   subject: 'Password Reset Request',
  //   html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  // });
}
