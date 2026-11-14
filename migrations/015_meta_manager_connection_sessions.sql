CREATE TABLE meta_manager_connection_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING_OAUTH' CHECK (status IN ('PENDING_OAUTH','WAITING_FOR_META','CONNECTED','FAILED','EXPIRED')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  last_checked_at timestamptz,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meta_manager_connection_sessions_user_idx ON meta_manager_connection_sessions(user_id, created_at DESC);

ALTER TABLE meta_oauth_states ADD COLUMN manager_session_id uuid REFERENCES meta_manager_connection_sessions(id) ON DELETE SET NULL;
CREATE INDEX meta_oauth_states_manager_session_idx ON meta_oauth_states(manager_session_id) WHERE manager_session_id IS NOT NULL;
