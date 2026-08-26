-- Medicion propia del embudo: sin cookies y sin terceros. No se guarda IP ni
-- nada que identifique a una persona; alcanza con saber que paso y desde donde.
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT,
  lang TEXT,
  ref TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_events_created ON events(created_at);
CREATE INDEX idx_events_name_created ON events(name, created_at);
