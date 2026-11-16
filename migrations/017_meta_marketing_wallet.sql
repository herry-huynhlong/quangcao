CREATE TABLE wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'VND',
  available_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (available_amount >= 0),
  reserved_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (reserved_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_account_id uuid NOT NULL REFERENCES wallet_accounts(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('PAYMENT_CONFIRMED','RESERVATION','RESERVATION_RELEASE','META_SPEND','ADJUSTMENT')),
  amount numeric(14,2) NOT NULL CHECK (amount <> 0),
  currency text NOT NULL DEFAULT 'VND',
  reference_type text,
  reference_id text,
  idempotency_key uuid UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wallet_transactions_wallet_idx ON wallet_transactions(wallet_account_id, created_at DESC);

CREATE TABLE campaign_budget_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_draft_id uuid NOT NULL UNIQUE REFERENCES campaign_drafts(id) ON DELETE CASCADE,
  wallet_account_id uuid NOT NULL REFERENCES wallet_accounts(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD','RELEASED','CONSUMED')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);

ALTER TABLE campaign_drafts
  ADD COLUMN IF NOT EXISTS meta_adset_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS meta_creative_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS meta_ad_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS meta_status text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_idempotency_key uuid UNIQUE;

ALTER TABLE campaign_drafts DROP CONSTRAINT IF EXISTS campaign_drafts_status_check;
ALTER TABLE campaign_drafts ADD CONSTRAINT campaign_drafts_status_check
  CHECK (status IN ('DRAFT','PUBLISHING','META_PAUSED','META_ACTIVE','META_REJECTED','PAUSED','ACTIVE','ERROR','ARCHIVED'));
