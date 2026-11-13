ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_meta_ad_account_id uuid REFERENCES meta_ad_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS users_selected_meta_ad_account_id_idx ON users(selected_meta_ad_account_id) WHERE selected_meta_ad_account_id IS NOT NULL;
