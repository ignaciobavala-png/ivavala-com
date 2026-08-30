-- Reportes manuales de visitas: un borrador/enviado por periodo y cliente.
-- Los datos los carga Ignacio en /panel; el mail se compone a partir de esta
-- fila y se envia por Resend (o el binding send_email como fallback).
CREATE TABLE IF NOT EXISTS reportes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  url TEXT,
  periodo TEXT NOT NULL,
  para TEXT NOT NULL,
  visitas INTEGER,
  unicas INTEGER,
  whatsapp INTEGER,
  leads INTEGER,
  conversion TEXT,
  fuentes TEXT,
  paises TEXT,
  nota TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado')),
  enviado_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reportes_created ON reportes(created_at);
