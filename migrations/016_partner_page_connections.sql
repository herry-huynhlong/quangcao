-- Keep the legacy OAuth and Ad Account tables intact.  Partner-managed Page
-- connections are separate because a customer does not have to own an Ad Account.
ALTER TABLE meta_partner_config
  ADD COLUMN IF NOT EXISTS default_ad_account_id text;

CREATE TABLE meta_partner_page_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  page_id text NOT NULL,
  page_name text,
  instagram_account_id text,
  instagram_account_name text,
  status text NOT NULL DEFAULT 'WAITING_FOR_PERMISSION'
    CHECK (status IN ('NOT_CONFIGURED','WAITING_FOR_PERMISSION','PENDING_VERIFICATION','CONNECTED','PERMISSION_DENIED','TOKEN_EXPIRED','DISCONNECTED','ERROR')),
  verification jsonb NOT NULL DEFAULT '{}'::jsonb,
  verification_method text,
  last_error text,
  verified_at timestamptz,
  last_permission_check_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX meta_partner_page_requests_user_idx
  ON meta_partner_page_requests(user_id, created_at DESC);
CREATE INDEX meta_partner_page_requests_org_idx
  ON meta_partner_page_requests(organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;
-- A Page may not silently be claimed by two customers while it is active.
CREATE UNIQUE INDEX meta_partner_page_requests_active_page_idx
  ON meta_partner_page_requests(page_id)
  WHERE status IN ('WAITING_FOR_PERMISSION','PENDING_VERIFICATION','CONNECTED');

ALTER TABLE campaign_drafts
  ADD COLUMN IF NOT EXISTS page_asset_id uuid REFERENCES meta_user_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS execution_ad_account_id text;
CREATE INDEX campaign_drafts_page_asset_idx ON campaign_drafts(page_asset_id) WHERE page_asset_id IS NOT NULL;
