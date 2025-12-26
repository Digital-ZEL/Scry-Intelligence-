import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for client-side error tracking.
 * Only initializes if VITE_SENTRY_DSN is set.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log("Sentry DSN not configured - client error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Don't send PII to Sentry
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });

  console.log("Sentry initialized for client error tracking");
}

export { Sentry };
