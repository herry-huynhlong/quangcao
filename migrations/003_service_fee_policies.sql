CREATE TABLE service_fee_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('PLATFORM','AD_PLATFORM','ORGANIZATION')),
  scope_key text,
  percentage numeric(5,2) NOT NULL CHECK (percentage BETWEEN 5 AND 50),
  active_from timestamptz NOT NULL DEFAULT now(),
  replaced_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX service_fee_platform_active_idx ON service_fee_policies(scope_type) WHERE scope_type='PLATFORM' AND replaced_at IS NULL;
