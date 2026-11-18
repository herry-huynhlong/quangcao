ALTER TABLE campaign_drafts
  ADD COLUMN IF NOT EXISTS meta_effective_status text,
  ADD COLUMN IF NOT EXISTS meta_error_code integer,
  ADD COLUMN IF NOT EXISTS meta_error_subcode integer,
  ADD COLUMN IF NOT EXISTS reserved_total_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS fee_amount numeric(14,2) NOT NULL DEFAULT 0,
  ALTER COLUMN currency SET DEFAULT 'VND';

ALTER TABLE campaign_drafts DROP CONSTRAINT IF EXISTS campaign_drafts_status_check;
ALTER TABLE campaign_drafts ADD CONSTRAINT campaign_drafts_status_check CHECK (status IN (
  'DRAFT','PUBLISHING','META_PAUSED','META_ACTIVE','META_REVIEW','META_SCHEDULED',
  'META_DELIVERING','META_COMPLETED','META_REJECTED','META_PARTIAL','META_ACTIVATION_ERROR',
  'PAUSED','ACTIVE','ERROR','ARCHIVED'
));

CREATE INDEX IF NOT EXISTS campaign_drafts_meta_status_idx
  ON campaign_drafts(meta_status, updated_at DESC) WHERE meta_campaign_id IS NOT NULL;
