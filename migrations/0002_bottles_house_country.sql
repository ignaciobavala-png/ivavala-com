-- Botellas de la casa (piso que nunca se agota) + país de origen de cada botella.
ALTER TABLE bottles ADD COLUMN origin TEXT NOT NULL DEFAULT 'human';
ALTER TABLE bottles ADD COLUMN country TEXT;
CREATE INDEX idx_bottles_origin ON bottles(origin);

-- Mensajes de la casa: flotan siempre y se abren sin gastarse (el pescador
-- los lee, pero la botella vuelve al mar para el próximo visitante).
INSERT INTO bottles (msg, origin) VALUES
  ('Este mar lo construí yo. Las olas son una función seno que se mueve sola. No le digas.', 'house'),
  ('Dejé esta botella para que tengas algo que pescar. El resto del mar está más vacío de lo que parece.', 'house'),
  ('Si leés esto, el algoritmo eligió bien: vos, esta botella, este momento.', 'house'),
  ('Una vez tiré un mensaje y nadie lo pescó. Lo pescó el océano. Igual vale.', 'house'),
  ('La mejor web es la que no se nota. Esta, en cambio, se nota bastante.', 'house'),
  ('Regla de marino: nunca abras una botella en un momento de apuro.', 'house'),
  ('Todavía no sé qué hago acá. Pero el mar tampoco.', 'house'),
  ('Escribir para nadie tiene algo de honesto. Buenas olas.', 'house'),
  ('Hay dos tipos de personas: las que lanzan botellas y las que las abren. Vos estás haciendo las dos.', 'house'),
  ('Esta botella viajó de la punta del código al fondo del mar sin pasaporte.', 'house'),
  ('Si esto fuera un sistema de mensajería tendría rate limit. Por suerte es el mar.', 'house'),
  ('Guardate esto: las cosas que se hacen con paciencia se hunden más lento.', 'house'),
  ('Firmado: un desarrollador que escribe a la deriva.', 'house'),
  ('Si volviste a pescar una botella mía, es porque el mar te quiere cerca.', 'house');
