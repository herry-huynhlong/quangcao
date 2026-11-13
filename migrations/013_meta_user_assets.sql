CREATE TABLE meta_user_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qavio_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'META' CHECK (provider='META'),
  asset_type text NOT NULL CHECK (asset_type IN ('AD_ACCOUNT','PAGE','INSTAGRAM')),
  external_asset_id text NOT NULL,
  asset_name text,
  verification_method text NOT NULL,
  authorization_status text NOT NULL DEFAULT 'CONNECTED' CHECK (authorization_status IN ('CONNECTED','ACCESS_REVOKED','FAILED')),
  granted_permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  verified_at timestamptz NOT NULL DEFAULT now(),
  last_permission_check_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(qavio_user_id,provider,asset_type,external_asset_id)
);
CREATE INDEX meta_user_assets_user_status_idx ON meta_user_assets(qavio_user_id,provider,authorization_status,asset_type);
CREATE INDEX meta_user_assets_external_idx ON meta_user_assets(provider,asset_type,external_asset_id);
