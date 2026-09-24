-- Monitor gratis de web, SSL y dominio (/monitor-web/).
--
-- Un monitor nace 'pending' y no se revisa ni manda nada hasta que la persona
-- confirma desde el mail: sin doble opt-in, cualquiera podria cargar el mail
-- de otro y usar el sitio para mandarle avisos. 'off' es la baja; la fila se
-- conserva para no volver a escribirle si alguien la vuelve a cargar sin
-- confirmar.
--
-- token: lo unico que da acceso a la ficha, la confirmacion y la baja. No hay
-- cuenta ni contrasena; el link del mail es la llave.
CREATE TABLE monitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  host TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | active | off
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,

  -- ultima revision de la web
  up INTEGER,                    -- 1 arriba, 0 caida, NULL sin revisar
  last_code INTEGER,
  last_ms INTEGER,
  last_error TEXT,
  last_check TEXT,
  fails INTEGER NOT NULL DEFAULT 0,          -- fallas seguidas
  down_since TEXT,
  alerted_down INTEGER NOT NULL DEFAULT 0,   -- ya se aviso esta caida

  -- vencimientos (se revisan una vez por dia)
  ssl_expires TEXT,
  domain_expires TEXT,
  exp_checked TEXT,
  ssl_warned INTEGER,            -- ultimo umbral avisado, en dias
  domain_warned INTEGER
);

CREATE UNIQUE INDEX idx_monitors_email_url ON monitors(email, url);
CREATE INDEX idx_monitors_status_check ON monitors(status, last_check);
CREATE INDEX idx_monitors_status_exp ON monitors(status, exp_checked);
