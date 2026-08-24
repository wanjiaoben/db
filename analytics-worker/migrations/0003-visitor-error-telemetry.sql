-- EVENT-0824-07: expand visitor_events for controlled failure telemetry.
-- Transactional and recoverable: the legacy table is retained as a backup until a later cleanup.
BEGIN;
ALTER TABLE visitor_events RENAME TO visitor_events_legacy_20260824;
CREATE TABLE visitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  site_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pageview', 'dwell', 'contact_click', 'section_view', 'mogi_audio_fail') OR event_type GLOB 'error_[a-z0-9_]*'),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  referrer_host TEXT,
  country TEXT,
  city TEXT,
  timezone TEXT,
  ui_lang TEXT,
  browser_lang TEXT,
  landing_path TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  dwell_ms INTEGER,
  section_id TEXT,
  contact_channel TEXT,
  device_type TEXT,
  viewport_width INTEGER,
  question_id TEXT,
  part TEXT,
  section TEXT,
  event_duration_ms INTEGER,
  failure_stage TEXT,
  user_agent TEXT,
  network_type TEXT,
  phase TEXT
);
INSERT INTO visitor_events (
  id, created_at, site_id, event_type, visitor_id, session_id, ts, referrer_host, country, city,
  timezone, ui_lang, browser_lang, landing_path, utm_source, utm_medium, utm_campaign, dwell_ms,
  section_id, contact_channel, device_type, viewport_width
)
SELECT id, created_at, site_id, event_type, visitor_id, session_id, ts, referrer_host, country, city,
  timezone, ui_lang, browser_lang, landing_path, utm_source, utm_medium, utm_campaign, dwell_ms,
  section_id, contact_channel, device_type, viewport_width
FROM visitor_events_legacy_20260824;
CREATE INDEX IF NOT EXISTS idx_visitor_events_v2_site_ts ON visitor_events(site_id, ts);
CREATE INDEX IF NOT EXISTS idx_visitor_events_v2_site_type_ts ON visitor_events(site_id, event_type, ts);
CREATE INDEX IF NOT EXISTS idx_visitor_events_v2_site_visitor_created ON visitor_events(site_id, visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_events_v2_type_created ON visitor_events(event_type, created_at);
-- Keep the legacy table for rollback/verification; remove only in a separately approved cleanup.
COMMIT;
