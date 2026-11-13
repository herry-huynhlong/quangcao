CREATE TABLE meta_partner_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  business_portfolio_id text,
  system_user_token_encrypted text,
  last_checked_at timestamptz,
  last_error text,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meta_partner_asset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_account_id text NOT NULL,
  page_id text,
  instagram_account_id text,
  status text NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','ACCESS_REVOKED')),
  verification jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_note text,
  verified_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meta_partner_asset_requests_user_idx ON meta_partner_asset_requests(user_id,created_at DESC);
CREATE UNIQUE INDEX meta_partner_asset_requests_open_account_idx ON meta_partner_asset_requests(ad_account_id) WHERE status IN ('PENDING_VERIFICATION','VERIFIED','APPROVED');
