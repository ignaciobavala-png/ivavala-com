-- Campanas de mail (Resend) y bajas.
--
-- email_unsubscribes: una fila por direccion que pidio no recibir mas. Vale
-- para todas las campanas, no solo para la que traia el link: quien se da de
-- baja no quiere "la de octubre", no quiere ninguna. reason distingue el boton
-- de Gmail/Yahoo (POST one-click) del link del pie.
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  email TEXT PRIMARY KEY,               -- siempre en minuscula
  reason TEXT NOT NULL,                 -- one_click | link
  campaign TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- campaign_sends: registro de envio. La UNIQUE (campaign, email) hace que
-- reintentar el envio despues de un corte no le mande dos veces a nadie.
CREATE TABLE IF NOT EXISTS campaign_sends (
  campaign TEXT NOT NULL,
  email TEXT NOT NULL,
  resend_id TEXT,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (campaign, email)
);
