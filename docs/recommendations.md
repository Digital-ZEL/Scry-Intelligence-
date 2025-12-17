# Repository recommendations

## Security
1. **Require unique `SESSION_SECRET` in all environments and harden session cookies.** The current session configuration falls back to a default secret and only marks cookies as `secure` in production, which risks predictable sessions and transport leakage during staged testing. Update the session setup to require a provided secret everywhere, set `secure` based on transport, and consider `sameSite: "strict"` for admin actions.
2. **Verify CSRF/session store health on `/health`.** The health route only checks Postgres connectivity while always reporting the session store as "connected." Add a real session-store probe and fail fast when the store is unavailable to improve readiness signaling.
3. **Add origin/referer validation for state-changing API calls.** CSRF protection is in place, but additional origin checks for POST/PATCH routes would reduce token theft risk when cookies are sent cross-site.
4. **Avoid single-node rate limiting in production.** The in-memory rate limiter resets on process restart and does not coordinate across nodes. Use a shared store (e.g., Redis) for production deployments to prevent brute force bypass or uneven throttling.

## Reliability & Observability
5. **Expand structured logging with error context.** The current error handler logs metadata but drops stack traces in production. Add structured error fields (e.g., code, path, requestId) and centralize logger transports to improve traceability without exposing PII.
6. **Add positive health checks for downstream dependencies.** Extend `/health` to verify the session store and any external APIs, and include version/build info for rollout debugging.

## Testing & Quality
7. **Increase coverage on auth and admin flows.** Existing tests cover basic validation; add integration tests that execute the actual Passport/session stack, admin authorization, and CSRF token acquisition to prevent regressions in these critical flows.
8. **Add client-side tests for routing and mutations.** There are no front-end tests for React routes, query/mutation behaviors, or accessibility. Add React Testing Library coverage for login, contact form, and admin dashboards to catch UI regressions.

## Performance & DX
9. **Measure bundle size and introduce code-splitting budgets.** Vite is used without bundle analysis or route-level code splitting. Add `vite-plugin-inspect` or `rollup-plugin-visualizer` in CI and enforce budgets for third-party UI packages to keep initial load lean.
10. **Document local/CI workflows and secrets.** Provide a short developer guide covering required environment variables (SESSION_SECRET, database URL), how to run migrations, and how to execute tests to reduce onboarding friction.
