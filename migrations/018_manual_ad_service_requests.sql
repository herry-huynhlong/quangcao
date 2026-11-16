CREATE TABLE manual_ad_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_account_id text,
  ad_account_name text,
  page_name text NOT NULL,
  objective text NOT NULL,
  daily_budget numeric(14,2) NOT NULL CHECK (daily_budget > 0),
  currency text NOT NULL DEFAULT 'VND',
  starts_at timestamptz,
  ends_at timestamptz,
  ad_text text NOT NULL,
  destination_url text,
  media_url text,
  customer_note text,
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','ACCESS_PENDING','READY','IN_PROGRESS','NEEDS_INFO','COMPLETED','REJECTED')),
  admin_note text,
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ad_account_id IS NOT NULL OR ad_account_name IS NOT NULL),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX manual_ad_service_requests_user_idx ON manual_ad_service_requests(user_id, created_at DESC);
CREATE INDEX manual_ad_service_requests_status_idx ON manual_ad_service_requests(status, created_at DESC);
