CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  type TEXT NOT NULL,
  site TEXT NOT NULL,
  session_id TEXT,
  visitor_id TEXT,
  path TEXT,
  title TEXT,
  url TEXT,
  referrer TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  lang TEXT,
  browser_lang TEXT,
  country TEXT,
  colo TEXT,
  device TEXT,
  screen TEXT,
  viewport TEXT,
  event_name TEXT,
  label TEXT,
  href TEXT,
  section TEXT,
  duration_ms INTEGER,
  max_scroll INTEGER,
  raw TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_site_type_created ON events(site, type, created_at);
CREATE INDEX IF NOT EXISTS idx_events_session_created ON events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_path_created ON events(path, created_at);
CREATE INDEX IF NOT EXISTS idx_events_section_created ON events(section, created_at);

CREATE TABLE IF NOT EXISTS visitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  site_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pageview', 'dwell', 'contact_click', 'section_view')),
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
  viewport_width INTEGER
);

CREATE INDEX IF NOT EXISTS idx_visitor_events_site_ts ON visitor_events(site_id, ts);
CREATE INDEX IF NOT EXISTS idx_visitor_events_site_type_ts ON visitor_events(site_id, event_type, ts);
CREATE INDEX IF NOT EXISTS idx_visitor_events_site_visitor_created ON visitor_events(site_id, visitor_id, created_at);

CREATE TABLE IF NOT EXISTS search_console_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  date TEXT NOT NULL,
  site_url TEXT NOT NULL,
  site TEXT NOT NULL,
  page TEXT NOT NULL,
  path TEXT NOT NULL,
  query TEXT NOT NULL,
  country TEXT,
  device TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  UNIQUE(date, site_url, page, query, country, device)
);

CREATE INDEX IF NOT EXISTS idx_search_console_daily_date ON search_console_daily(date);
CREATE INDEX IF NOT EXISTS idx_search_console_daily_site_date ON search_console_daily(site, date);
CREATE INDEX IF NOT EXISTS idx_search_console_daily_path_date ON search_console_daily(path, date);
CREATE INDEX IF NOT EXISTS idx_search_console_daily_query_date ON search_console_daily(query, date);

CREATE TABLE IF NOT EXISTS search_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  source TEXT NOT NULL DEFAULT 'google',
  date TEXT NOT NULL,
  site_url TEXT NOT NULL,
  site TEXT NOT NULL,
  page TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '',
  query TEXT NOT NULL,
  country TEXT,
  device TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  UNIQUE(source, date, site_url, page, query, country, device)
);

CREATE INDEX IF NOT EXISTS idx_search_terms_source_date ON search_terms(source, date);
CREATE INDEX IF NOT EXISTS idx_search_terms_source_site_date ON search_terms(source, site, date);
CREATE INDEX IF NOT EXISTS idx_search_terms_source_path_date ON search_terms(source, path, date);
CREATE INDEX IF NOT EXISTS idx_search_terms_source_query_date ON search_terms(source, query, date);

CREATE TABLE IF NOT EXISTS probe_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  target TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  ok INTEGER NOT NULL DEFAULT 0,
  status INTEGER,
  duration_ms INTEGER,
  error TEXT,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_probe_results_checked_at ON probe_results(checked_at);
CREATE INDEX IF NOT EXISTS idx_probe_results_target_checked ON probe_results(target, checked_at);

CREATE TABLE IF NOT EXISTS path_check_runs (
  run_id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  trigger TEXT NOT NULL,
  ok INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  worker_version TEXT,
  summary_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_path_check_runs_started_at ON path_check_runs(started_at);

CREATE TABLE IF NOT EXISTS path_check_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  check_key TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  ok INTEGER NOT NULL DEFAULT 0,
  status INTEGER,
  expected_status TEXT,
  contract_ok INTEGER NOT NULL DEFAULT 0,
  contract_type TEXT,
  duration_ms INTEGER,
  error TEXT,
  fingerprint TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  checked_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES path_check_runs(run_id)
);

CREATE INDEX IF NOT EXISTS idx_path_check_results_run_id ON path_check_results(run_id);
CREATE INDEX IF NOT EXISTS idx_path_check_results_key_checked ON path_check_results(check_key, checked_at);
CREATE INDEX IF NOT EXISTS idx_path_check_results_ok_checked ON path_check_results(ok, checked_at);

CREATE TABLE IF NOT EXISTS path_check_state (
  check_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  fingerprint TEXT NOT NULL DEFAULT '',
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_ok_at TEXT,
  last_fail_at TEXT,
  last_alert_at TEXT,
  recovered_at TEXT,
  detail_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_path_check_state_status_updated ON path_check_state(status, updated_at);

CREATE TABLE IF NOT EXISTS path_check_heartbeat (
  name TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  status TEXT NOT NULL,
  ok INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS alert_state (
  key TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  fingerprint TEXT NOT NULL DEFAULT '',
  detail TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  notified_at TEXT
);

CREATE TABLE IF NOT EXISTS config_snapshot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  source TEXT NOT NULL,
  json TEXT NOT NULL,
  sha256 TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_config_snapshot_source_ts ON config_snapshot(source, ts);
CREATE INDEX IF NOT EXISTS idx_config_snapshot_source_sha ON config_snapshot(source, sha256);

CREATE TABLE IF NOT EXISTS audit_human_metrics (
  month TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL,
  computed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  evidence_status TEXT NOT NULL,
  PRIMARY KEY (month, question_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_human_metrics_computed_at ON audit_human_metrics(computed_at);

CREATE TABLE IF NOT EXISTS alert_channel_self_checks (
  month_key TEXT PRIMARY KEY,
  scheduled_at TEXT NOT NULL,
  sent_at TEXT,
  ok INTEGER NOT NULL DEFAULT 0,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  error TEXT,
  result TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
