# Production preflight: user-owned Meta ad accounts

Before applying `007_user_owned_ad_accounts.sql` to production:

1. Create and verify a database backup using the production runbook.
2. Run `SELECT count(*) FROM meta_ad_accounts a LEFT JOIN meta_connections c ON c.id=a.meta_connection_id WHERE c.user_id IS NULL;`. The result must be zero.
3. Confirm the application deployment containing the new `owner_user_id` writes is ready before running the migration.
4. Apply migrations through the normal production migration job, never from an interactive local shell.
5. Verify `SELECT count(*) FROM meta_ad_accounts WHERE owner_user_id IS NULL;` returns zero, then test two distinct USER sessions against `/v1/meta/status`.

The migration does not delete organizations, memberships, or existing organization-to-account mappings. They remain intact for a later, separately approved retirement migration.
