-- Botellas a la deriva: mensajes que los visitantes lanzan al mar.
-- Cada botella se pesca una sola vez (status adrift -> fished) y el dueño
-- puede borrarlas cuando algo no corresponde.
CREATE TABLE bottles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  msg TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'adrift' CHECK (status IN ('adrift', 'fished', 'removed')),
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bottles_status ON bottles(status);
CREATE INDEX idx_bottles_created ON bottles(created_at);

-- Rate limit por IP y acción (throw | fish): cuenta intentos en una ventana
-- de 5 minutos.
CREATE TABLE bottle_throws (
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  last_ts TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, action)
);
