ALTER TABLE meta_partner_asset_requests DROP CONSTRAINT IF EXISTS meta_partner_asset_requests_status_check;
ALTER TABLE meta_partner_asset_requests ADD CONSTRAINT meta_partner_asset_requests_status_check CHECK (status IN ('PENDING_VERIFICATION','NEEDS_USER_OAUTH','CONNECTED','ACCESS_REVOKED','FAILED','VERIFIED','APPROVED','REJECTED'));
