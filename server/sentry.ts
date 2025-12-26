import * as Sentry from "@sentry/node";

/**
 * Initialize Sentry for error tracking.
 * Only initializes if SENTRY_DSN is set.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log("Sentry DSN not configured - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Don't send PII to Sentry
    beforeSend(event) {
      // Remove IP addresses
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });

  console.log("Sentry initialized for error tracking");
}

export { Sentry };
