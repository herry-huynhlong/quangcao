# QAVIO Ads Phase 01 runbook

## Local start

1. Copy `.env.example` to `.env` and replace the local database password if needed.
2. Run `docker compose up -d`.
3. Run `pnpm install`, then `pnpm db:migrate` and `pnpm dev`.
4. Web: `http://localhost:3000`; API health: `http://localhost:4000/api/health`.

## Deployment

Deploy web and API as separate services. Set `WEB_ORIGIN` and `NEXT_PUBLIC_API_ORIGIN` to HTTPS URLs, set `NODE_ENV=production`, use a managed PostgreSQL/Redis pair, and run migrations once from a release job. The reverse proxy must terminate TLS and forward the real client IP.

## Backup and rollback

Take a verified PostgreSQL snapshot before each migration and test restore regularly. Roll back application containers first. Do not reverse a migration that has already stored production data unless a tested reverse migration and data plan exist.

## Explicit blockers

- No approved transactional email provider is configured, so public registration/reset is intentionally unavailable.
- Meta/TikTok/Google OAuth and Marketing API access are not configured.
- Payment merchant, legal review, webhook verification and reconciliation are not configured; wallet/payment remain unavailable.
- MFA enrollment/verification needs an approved production secret-store/KMS design before a Super Admin can be provisioned.
