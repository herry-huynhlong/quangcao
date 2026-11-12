CREATE UNIQUE INDEX IF NOT EXISTS service_fee_ad_platform_active_idx
  ON service_fee_policies(scope_type, scope_key)
  WHERE scope_type = 'AD_PLATFORM' AND replaced_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_fee_organization_active_idx
  ON service_fee_policies(scope_type, scope_key)
  WHERE scope_type = 'ORGANIZATION' AND replaced_at IS NULL;
