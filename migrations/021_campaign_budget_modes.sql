ALTER TABLE campaign_drafts
  ADD COLUMN IF NOT EXISTS budget_type text NOT NULL DEFAULT 'DAILY' CHECK (budget_type IN ('DAILY','LIFETIME')),
  ADD COLUMN IF NOT EXISTS lifetime_budget numeric(14,2);

ALTER TABLE campaign_drafts
  ADD CONSTRAINT campaign_drafts_budget_amount_check
  CHECK ((budget_type='DAILY' AND daily_budget IS NOT NULL AND daily_budget>0) OR (budget_type='LIFETIME' AND lifetime_budget IS NOT NULL AND lifetime_budget>0) OR (daily_budget IS NULL AND lifetime_budget IS NULL)) NOT VALID;
