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

CREATE TABLE IF NOT EXISTS alert_state (
  key TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  fingerprint TEXT NOT NULL DEFAULT '',
  detail TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  notified_at TEXT
);
