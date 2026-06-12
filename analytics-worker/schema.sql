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
