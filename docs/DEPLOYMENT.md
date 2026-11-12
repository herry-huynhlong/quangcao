# Staging and production deployment

## Required before staging

- Dedicated DNS names and TLS certificates for `ads.qavio.site` and `api.ads.qavio.site`.
- Dedicated PostgreSQL, Redis, object-storage service account, error monitoring and secret manager. Do not reuse QAVIO/QuánPilot secrets or databases.
- `DATABASE_URL`, `WEB_ORIGIN`, `NEXT_PUBLIC_API_ORIGIN`, `MFA_ENCRYPTION_KEY`, approved transactional email credentials, and a rotated application encryption key stored only in the deployment secret manager.
- Database backup and restore verification, health probes `/api/health` and `/api/ready`, structured-log collection, and an incident owner.

## Release sequence

1. Run lint, typecheck, tests, and build in CI.
2. Back up PostgreSQL and run the release migration job once.
3. Deploy API, wait for `/api/ready`, then deploy web.
4. Perform a controlled registration → verification → login → organization creation test on staging.
5. Obtain explicit owner approval before any production release.

No payment merchant, OAuth provider, campaign publishing, or advertising spend is enabled by this release.
