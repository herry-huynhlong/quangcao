CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE membership_role AS ENUM ('ORG_OWNER', 'ORG_ADMIN', 'ADVERTISER', 'ORG_VIEWER');
CREATE TYPE membership_status AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  platform_role text NOT NULL DEFAULT 'USER' CHECK (platform_role IN ('USER', 'SUPER_ADMIN', 'PLATFORM_FINANCE', 'PLATFORM_SUPPORT')),
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret_encrypted text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  legal_name text,
  tax_id text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role membership_role NOT NULL,
  status membership_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);
CREATE INDEX memberships_organization_id_idx ON memberships(organization_id);
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  active_organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ip inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE TABLE email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_type text NOT NULL, actor_id uuid,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL, action text NOT NULL, entity text NOT NULL,
  entity_id text, reason text, diff_redacted jsonb, ip inet, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_organization_id_created_at_idx ON audit_logs(organization_id, created_at DESC);
CREATE TABLE rate_limit_events (
  key text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_limit_events_key_created_at_idx ON rate_limit_events(key, created_at DESC);
