# Security baseline

- Passwords are Argon2id hashes; raw passwords and opaque session tokens are never persisted.
- Sessions are server-side, opaque, HttpOnly, Secure in production, and revoked after password reset.
- Browser-originated authenticated state changes are checked against `WEB_ORIGIN`; configure that value exactly in every deployed environment.
- Tenant selection is derived from the session and active membership. Client-supplied organization IDs are never trusted for authorization.
- Login attempts are throttled in PostgreSQL. Configure a shared rate limiter/WAF before public production traffic.
- Super Admin logins are rejected until MFA enrollment is implemented and enabled. No default admin exists.
- Provider credentials, payment credentials, and production secrets belong in a managed secret store; they must not be committed.

Before production, add CSRF protection for any cross-site deployment topology, configure CSP/HSTS at the reverse proxy, run dependency scanning, and use a managed KMS for integration tokens.
