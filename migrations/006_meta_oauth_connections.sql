CREATE TABLE meta_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meta_oauth_states_user_id_idx ON meta_oauth_states(user_id);

CREATE TABLE meta_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_encrypted text NOT NULL,
  token_subject_id text,
  token_expires_at timestamptz,
  granted_scopes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'CONNECTED' CHECK (status IN ('CONNECTED','TOKEN_EXPIRED','MISSING_PERMISSION','ERROR','DISCONNECTED')),
  last_checked_at timestamptz,
  last_error text,
  disconnected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE meta_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_connection_id uuid NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  account_name text,
  account_status text,
  currency text,
  timezone_name text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meta_connection_id, account_id)
);
CREATE INDEX meta_ad_accounts_connection_idx ON meta_ad_accounts(meta_connection_id);

CREATE TABLE organization_meta_ad_accounts (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meta_ad_account_id uuid NOT NULL REFERENCES meta_ad_accounts(id) ON DELETE CASCADE,
  connected_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id, meta_ad_account_id),
  UNIQUE(meta_ad_account_id)
);
