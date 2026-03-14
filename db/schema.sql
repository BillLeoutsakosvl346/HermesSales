-- Sports Wholesale AI Agent — Supabase Schema
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/wnfcxumebppdqefqbnys/sql

-- ── call_inputs (one row per lead / prospect to call) ─────────────────────────
CREATE TABLE IF NOT EXISTS call_inputs (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  business_name        TEXT,
  phone_number         TEXT,
  type                 TEXT,
  source               TEXT,
  lead_status          TEXT,
  location             TEXT,
  notes                TEXT,
  ebay_store           TEXT,
  amazon_store         TEXT,
  website              TEXT,
  order_history        JSONB    DEFAULT '[]'::jsonb,
  -- call queue fields
  priority_brands      TEXT,
  priority_categories  TEXT,
  keywords_to_pitch    TEXT,
  call_priority        TEXT     DEFAULT 'Medium',
  call_window          TEXT     DEFAULT 'Any',
  max_attempts         INTEGER  DEFAULT 3,
  do_not_call          BOOLEAN  DEFAULT FALSE,
  call_attempt_count   INTEGER  DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── products (live stock catalogue — queried by agent mid-call) ───────────────
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  brand       TEXT NOT NULL,
  category    TEXT,
  gender      TEXT,
  name        TEXT NOT NULL,
  units       INTEGER,
  sizes       TEXT,
  location    TEXT,
  cost        NUMERIC(10,2),
  rrp         NUMERIC(10,2),
  offer_price NUMERIC(10,2),
  condition   TEXT,
  moq         INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── call_outputs (one row per completed call) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS call_outputs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id          TEXT REFERENCES call_inputs(id),
  customer_name        TEXT,
  business_name        TEXT,
  phone_number         TEXT,
  outcome              TEXT,
  notes                TEXT,
  products_discussed   TEXT,
  follow_up_date       DATE,
  follow_up_actioned   BOOLEAN  DEFAULT FALSE,
  call_attempt_number  INTEGER  DEFAULT 1,
  lead_status_before   TEXT,
  lead_status_after    TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_brand      ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_inputs_status       ON call_inputs(lead_status);
CREATE INDEX IF NOT EXISTS idx_outputs_customer    ON call_outputs(customer_id);

-- ── Input queue view (prioritised, DNC filtered) ──────────────────────────────
CREATE OR REPLACE VIEW input_queue_view AS
SELECT
  id,
  name,
  business_name,
  phone_number,
  type              AS business_type,
  location,
  lead_status,
  call_priority,
  call_window,
  priority_brands,
  priority_categories,
  keywords_to_pitch,
  notes,
  call_attempt_count,
  max_attempts,
  (max_attempts - call_attempt_count) AS attempts_remaining,
  do_not_call,
  ebay_store,
  amazon_store,
  website
FROM call_inputs
WHERE do_not_call = FALSE
  AND (call_attempt_count < max_attempts OR max_attempts IS NULL)
ORDER BY
  CASE call_priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END,
  CASE lead_status   WHEN 'Active' THEN 1 WHEN 'Warm' THEN 2 WHEN 'Lapsed' THEN 3 WHEN 'Cold' THEN 4 WHEN 'New' THEN 5 ELSE 6 END;

-- ── Output results view (call_outputs joined with call_inputs) ────────────────
CREATE OR REPLACE VIEW output_results_view AS
SELECT
  co.id,
  co.created_at::DATE                       AS call_date,
  (co.created_at AT TIME ZONE 'UTC')::TIME  AS call_time,
  co.customer_id,
  co.customer_name,
  co.business_name,
  co.phone_number,
  ci.type                                   AS business_type,
  ci.location,
  co.lead_status_before,
  co.outcome,
  co.notes,
  co.products_discussed,
  co.follow_up_date,
  co.follow_up_actioned,
  co.call_attempt_number,
  co.lead_status_after,
  ci.ebay_store,
  ci.amazon_store,
  ci.website
FROM call_outputs co
LEFT JOIN call_inputs ci ON ci.id = co.customer_id
ORDER BY co.created_at DESC;
