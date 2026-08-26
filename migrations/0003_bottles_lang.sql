-- Las botellas de la casa se muestran en el idioma de la pieza que las pesca.
-- Las de visitantes no se traducen: viajan tal como se escribieron, así que
-- quedan en 'es' por defecto y el filtro por idioma sólo aplica a 'house'.
ALTER TABLE bottles ADD COLUMN lang TEXT NOT NULL DEFAULT 'es';
CREATE INDEX idx_bottles_house_lang ON bottles(origin, lang, status);

INSERT INTO bottles (msg, origin, lang) VALUES
  ('I built this sea myself. The waves are a sine function moving on its own. Do not tell it.', 'house', 'en'),
  ('I left this bottle here so you would have something to fish. The rest of the sea is emptier than it looks.', 'house', 'en'),
  ('If you are reading this, the algorithm chose well: you, this bottle, this moment.', 'house', 'en'),
  ('I once threw a message and nobody fished it. The ocean did. That counts too.', 'house', 'en'),
  ('The best website is the one you do not notice. This one, however, is quite noticeable.', 'house', 'en'),
  ('Sailor rule: never open a bottle when you are in a hurry.', 'house', 'en'),
  ('I still do not know what I am doing here. Neither does the sea.', 'house', 'en'),
  ('Writing for nobody has something honest about it. Fair winds.', 'house', 'en'),
  ('There are two kinds of people: those who throw bottles and those who open them. You are doing both.', 'house', 'en'),
  ('This bottle travelled from the edge of the code to the bottom of the sea without a passport.', 'house', 'en'),
  ('If this were a messaging system it would have a rate limit. Luckily it is the sea.', 'house', 'en'),
  ('Keep this: things made with patience sink more slowly.', 'house', 'en'),
  ('Signed: a developer who writes adrift.', 'house', 'en'),
  ('If you fished another one of mine, it is because the sea wants you close.', 'house', 'en');
