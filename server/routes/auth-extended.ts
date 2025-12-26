import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ZodError } from "zod";
import type { Session } from "express-session";

// Extended session type for 2FA pending state
interface ExtendedSession extends Session {
  pending2FAUserId?: number;
}
import {
  createPasswordResetToken,
  resetPassword,
  sendPasswordResetEmail,
  validateResetToken,
} from "../services/password-reset";
import {
  generate2FASecret,
  verify2FAAndEnable,
  verify2FACode,
  disable2FA,
  is2FAEnabled,
} from "../services/two-factor";
import { authLimiter } from "../middleware/rate-limit";

const router = Router();

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const verify2FASchema = z.object({
  code: z.string().min(6, "Code must be at least 6 characters"),
});

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// ==================== PASSWORD RESET ====================

/**
 * Request a password reset email
 */
router.post("/api/auth/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const { email } = requestResetSchema.parse(req.body);

    const token = await createPasswordResetToken(email);

    if (token) {
      await sendPasswordResetEmail(email, token);
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    next(error);
  }
});

/**
 * Validate a reset token (for frontend to check before showing reset form)
 */
router.get("/api/auth/validate-reset-token", async (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    return res.status(400).json({ valid: false, error: "Token is required" });
  }

  const userId = await validateResetToken(token);
  res.json({ valid: !!userId });
});

/**
 * Reset password with token
 */
router.post("/api/auth/reset-password", authLimiter, async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const success = await resetPassword(token, password);

    if (!success) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    res.json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    next(error);
  }
});

// ==================== TWO-FACTOR AUTH ====================

/**
 * Get 2FA status for current user
 */
router.get("/api/auth/2fa/status", isAuthenticated, async (req, res) => {
  const enabled = await is2FAEnabled(req.user!.id);
  res.json({ enabled });
});

/**
 * Generate 2FA secret and QR code
 */
router.post("/api/auth/2fa/setup", isAuthenticated, async (req, res, next) => {
  try {
    const { secret, qrCodeUrl } = await generate2FASecret(req.user!.id);
    res.json({ secret, qrCodeUrl });
  } catch (error) {
    next(error);
  }
});

/**
 * Verify 2FA code and enable 2FA
 */
router.post("/api/auth/2fa/enable", isAuthenticated, async (req, res, next) => {
  try {
    const { code } = verify2FASchema.parse(req.body);

    const result = await verify2FAAndEnable(req.user!.id, code);

    if (!result.enabled) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    res.json({
      success: true,
      message: "Two-factor authentication has been enabled",
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    next(error);
  }
});

/**
 * Disable 2FA for current user
 */
router.post("/api/auth/2fa/disable", isAuthenticated, async (req, res, next) => {
  try {
    const { code } = verify2FASchema.parse(req.body);

    // Require valid 2FA code to disable
    const isValid = await verify2FACode(req.user!.id, code);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await disable2FA(req.user!.id);

    res.json({ success: true, message: "Two-factor authentication has been disabled" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    next(error);
  }
});

/**
 * Verify 2FA code during login (called after initial login if 2FA is enabled)
 */
router.post("/api/auth/2fa/verify", authLimiter, async (req, res, next) => {
  try {
    // This endpoint requires a pending 2FA session
    // For simplicity, we'll use the session to track this
    const session = req.session as ExtendedSession;
    const pendingUserId = session.pending2FAUserId;

    if (!pendingUserId) {
      return res.status(400).json({ error: "No pending 2FA verification" });
    }

    const { code } = verify2FASchema.parse(req.body);

    const isValid = await verify2FACode(pendingUserId, code);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Clear pending state
    delete session.pending2FAUserId;

    res.json({ success: true, message: "Two-factor authentication verified" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    next(error);
  }
});

export default router;
