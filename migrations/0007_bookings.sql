-- Turnos de videollamada reservados desde la web. `slot` es el inicio en UTC
-- (ISO, "2026-11-24T12:00:00Z"); UNIQUE evita que dos personas tomen el mismo
-- horario aunque reserven al mismo tiempo.
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  plan TEXT,
  note TEXT,
  lang TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
