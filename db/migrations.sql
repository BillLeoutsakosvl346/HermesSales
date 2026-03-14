-- Sports Wholesale AI Agent — Migration
-- Run this in the Supabase SQL editor AFTER the initial schema.sql
-- https://supabase.com/dashboard/project/wnfcxumebppdqefqbnys/sql

-- ── Step 1: Rename existing tables ───────────────────────────────────────────
ALTER TABLE IF EXISTS customers  RENAME TO call_inputs;
ALTER TABLE IF EXISTS call_logs  RENAME TO call_outputs;

-- ── Step 2: Add new columns to call_inputs ───────────────────────────────────
ALTER TABLE call_inputs
  ADD COLUMN IF NOT EXISTS phone_number        TEXT,
  ADD COLUMN IF NOT EXISTS priority_brands     TEXT,
  ADD COLUMN IF NOT EXISTS priority_categories TEXT,
  ADD COLUMN IF NOT EXISTS keywords_to_pitch   TEXT,
  ADD COLUMN IF NOT EXISTS call_priority       TEXT    DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS call_window         TEXT    DEFAULT 'Any',
  ADD COLUMN IF NOT EXISTS max_attempts        INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS do_not_call         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS call_attempt_count  INTEGER DEFAULT 0;

-- ── Step 3: Add new columns to call_outputs ──────────────────────────────────
ALTER TABLE call_outputs
  ADD COLUMN IF NOT EXISTS business_name       TEXT,
  ADD COLUMN IF NOT EXISTS phone_number        TEXT,
  ADD COLUMN IF NOT EXISTS products_discussed  TEXT,
  ADD COLUMN IF NOT EXISTS call_attempt_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS lead_status_before  TEXT,
  ADD COLUMN IF NOT EXISTS lead_status_after   TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_actioned  BOOLEAN DEFAULT FALSE;

-- ── Step 4: Drop old views if they exist ─────────────────────────────────────
DROP VIEW IF EXISTS call_queue_view;
DROP VIEW IF EXISTS call_results_view;

-- ── Step 5: Create updated views ─────────────────────────────────────────────
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
