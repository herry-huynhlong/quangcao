ALTER TABLE meta_oauth_states
  ADD COLUMN IF NOT EXISTS return_path text NOT NULL DEFAULT 'DEFAULT'
    CHECK (return_path IN ('DEFAULT','META_MANAGER')),
  ADD COLUMN IF NOT EXISTS oauth_mode text NOT NULL DEFAULT 'ADS'
    CHECK (oauth_mode IN ('ADS','PAGE'));

CREATE TABLE IF NOT EXISTS meta_page_oauth_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token_encrypted text NOT NULL,
  token_subject_id text,
  token_expires_at timestamptz,
  granted_scopes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'CONNECTED' CHECK(status IN ('CONNECTED','TOKEN_EXPIRED','MISSING_PERMISSION','ERROR','DISCONNECTED')),
  last_checked_at timestamptz,
  last_error text,
  disconnected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
