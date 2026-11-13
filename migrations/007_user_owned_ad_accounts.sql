-- Safe ownership migration: preserve all organization data and only add direct USER ownership.
-- Run the production preflight in docs before applying this migration to a live database.
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE meta_ad_accounts ADD COLUMN IF NOT EXISTS owner_user_id uuid;

UPDATE meta_ad_accounts account
SET owner_user_id = connection.user_id
FROM meta_connections connection
WHERE account.meta_connection_id = connection.id
  AND account.owner_user_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM meta_ad_accounts WHERE owner_user_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot complete USER ownership migration: meta_ad_accounts without a connection owner exist';
  END IF;
END $$;

ALTER TABLE meta_ad_accounts
  ALTER COLUMN owner_user_id SET NOT NULL,
  ADD CONSTRAINT meta_ad_accounts_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS meta_ad_accounts_owner_user_id_idx ON meta_ad_accounts(owner_user_id);
