ALTER TABLE campaign_drafts
  ADD COLUMN IF NOT EXISTS meta_insights jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS meta_spend_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS meta_insights_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS campaign_drafts_admin_monitor_idx
  ON campaign_drafts(status,updated_at DESC);
