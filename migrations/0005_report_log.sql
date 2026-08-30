-- Idempotencia del informe de visitas: un solo envio por sitio y periodo.
-- site = slug del sitio (ej. 'ivavala'), period = 'YYYY-MM'.
CREATE TABLE IF NOT EXISTS report_log (
  site TEXT NOT NULL,
  period TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  to_email TEXT NOT NULL,
  PRIMARY KEY (site, period)
);
