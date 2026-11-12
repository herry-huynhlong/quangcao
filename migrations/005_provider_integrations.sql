CREATE TABLE provider_integrations (
  provider text PRIMARY KEY CHECK (provider IN ('META','GOOGLE','TIKTOK')),
  client_id text,
  secret_encrypted text,
  api_version text,
  status text NOT NULL DEFAULT 'NOT_CONFIGURED' CHECK (status IN ('NOT_CONFIGURED','CONFIGURED_NOT_TESTED','CONNECTED','ERROR','NOT_APPROVED')),
  last_checked_at timestamptz,
  last_error text,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
