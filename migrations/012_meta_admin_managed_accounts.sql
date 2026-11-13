CREATE TABLE meta_admin_managed_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_account_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('PENDING_VERIFICATION','NEEDS_USER_OAUTH','CONNECTED','ACCESS_REVOKED','FAILED')),
  verification jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX meta_admin_managed_requests_account_idx ON meta_admin_managed_requests(ad_account_id) WHERE status IN ('PENDING_VERIFICATION','NEEDS_USER_OAUTH','CONNECTED');
CREATE INDEX meta_admin_managed_requests_user_idx ON meta_admin_managed_requests(user_id,created_at DESC);
