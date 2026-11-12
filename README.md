# QAVIO Ads

Independent multi-tenant advertising SaaS for `ads.qavio.site`. This repository does not modify `qavio.site`, `admin.qavio.site`, or QuánPilot.

Phase 01 contains a NestJS API, Next.js web app, PostgreSQL migration, Docker local dependencies, opaque session authentication, email-verification flow (only when an approved email provider is configured), organization isolation and audit logging.

Read [docs/RUNBOOK.md](docs/RUNBOOK.md) before running it. Provider connections, payment and campaign publishing are deliberately unavailable until their real credentials, approvals and end-to-end integration exist.
