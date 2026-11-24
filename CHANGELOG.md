# Cambios del portafolio

## 2026-11-23 (noche) — Fuera las herramientas gratis

- Se probó bajar la Landing a $600.000 (USD 360) y se revirtió el mismo día: los precios quedan
  como estaban ($700.000 / USD 420). Lo único que sobrevive de ese cambio es `assistant.js`
  con `?v=13` en las dos homes.
- Se borran `/link-whatsapp/`, `/monitor-web/`, `herramientas.css`, `vendor/qrcode.min.js`, la
  sección oculta "Herramientas gratis" de la home y el evento `tool:click`; `llms.txt` ya no
  las lista.
- `worker.js`: fuera el bloque del monitor (498 líneas), las rutas `/api/monitor*` y el
  `scheduled`; `wrangler.jsonc` sin el cron de cada 5 minutos. `baseOf` y `readJson` se
  conservan (las usa el resto del worker). La tabla `monitors` de D1 queda sin uso y no se toca.
- Las migraciones remotas están al día (incluida la `0007_bookings`).

## 2026-11-23 — Preparación para Google Ads: privacidad, landings por intención, SEO y llms.txt

- Política de privacidad en `/privacidad/` y `/en/privacy/` (datos que se recogen, destinatarios:
  Cloudflare, Resend/Gmail, Groq y Google Ads; cookies; plazo de 24 meses; derechos según Ley
  25.326). Enlazada desde la sección de contacto de las dos homes y desde el footer de las landings.
- Se probaron tres landings por intención (`/paginas-web/`, `/tienda-online/`,
  `/sistemas-a-medida/`) y se descartaron: la web es una mono-landing y todos los anuncios van a
  `ivavala.com`. Las páginas se borraron y no quedan en sitemap ni en `llms.txt`.
- `landing.css` (tema claro de la home, Unbounded, acento azul) queda solo para las páginas de
  privacidad.
- `agenda.js` (v=4): el plan del modal también se toma del texto del link cuando el botón no está
  dentro de una card `.pl`.
- `robots.txt`: se agrega `Disallow: /api/`. `sitemap.xml`: suma la privacidad, `lastmod` en las
  homes (es y en) y se sacan `/link-whatsapp/` y `/monitor-web/` (herramientas aparte, no parte de
  la mono-página; siguen accesibles por link).
  `llms.txt`: precios, mantenimiento, seña, cómo agendar y WhatsApp.
- GA4: propiedad nueva de ivavala (`G-7QGFPLEEK1`) cargada junto a la etiqueta de Ads en todas las páginas; eventos `whatsapp_click`, `generate_lead` (chat) y `booking_confirmed`. Privacidad menciona Analytics.

## 2026-11-23 — Agenda: .ics en el aviso, invitación con Meet y fuera "Tecnología"

- "También hago" (es y en): las cuatro cards quedan solo con ícono, número y título; se saca la
  descripción de cada una (`.cap-d`) y se baja la altura mínima de las cards (de 250–300 px a
  170–200 px en escritorio, 170 px en tablet) para que no queden vacías. `motion.css` a v=63.

- El mail de aviso de cada turno ahora trae un `.ics` (adjunto y como `text/calendar`): Gmail lo
  muestra como tarjeta de evento con "Agregar al calendario". Incluye el link de Meet, el contacto
  y la nota, y una alarma 15 min antes.
- Si el visitante dejó mail, recibe por Resend una invitación con texto fijo (sin repetir nada de lo
  que escribió), el día y la hora, y un `.ics` de invitación. Si Resend falla, la reserva no se cae.
  Sin mail (solo WhatsApp) no hay invitación.
- Link de Meet fijo en `MEET_URL` (`worker.js`); sin Google Calendar API, la sala es la misma para
  todos los turnos.
- Home (es y en): se saca la sección "Tecnología" (stack) junto con su CSS: la mayoría de los
  clientes no conoce esas herramientas y no ayudan a decidir.

## 2026-11-23 — Agenda de videollamadas propia (sin Google Calendar)

- Los botones "Agendar videollamada" (planes y asistente) abren un modal con días y horarios
  libres en vez de mandar a WhatsApp. Sin JS siguen siendo el link a WhatsApp de siempre.
- Disponibilidad fija: lunes a viernes, 9 a 18 hs de Argentina (UTC-3), turnos de 30 min, hasta
  21 días adelante y con 3 hs de aviso mínimo. Si el visitante está en otro huso, ve su hora
  local debajo de cada horario.
- Al confirmar, el worker guarda el turno en D1 (`bookings`, `slot` UNIQUE: dos personas no pueden
  tomar el mismo horario) y manda el aviso a mi casilla por el binding `send_email`, con
  Reply-To al mail del visitante si dejó uno. Si el mail falla, se libera el horario y la persona
  ve el error con salida a WhatsApp.
- `GET/POST /api/agenda` con Turnstile, honeypot y rate limit (3 cada 5 min por IP).
- Conversión de Ads al agendar. Migración `0007_bookings.sql`: **falta aplicarla en remoto**
  (`wrangler d1 migrations apply portafolio-db --remote`) antes de deployar.
- Pendiente a propósito: Google Calendar (para bloquear horarios con eventos reales) y mail de
  confirmación al visitante.

## 2026-11-23 — Precios publicados, asistente que guía a la videollamada y rubros

Contexto: con la pauta de octubre, 104 personas llegaron a Contacto y 0 escribieron. El
diagnóstico fue que faltaba una oferta concreta (rubro, producto y precio a la vista), no
tráfico ni nombre. ivavala.com queda como portafolio personal; la marca de empresa se piensa
aparte.

### Precios

- Sección Precios con tres planes y aviso de que son para profesionales independientes y pymes
  (empresas grandes se cotizan aparte):
  - Landing **$700.000** (USD 420) · profesionales independientes.
  - Landing con backend **$1.500.000** (USD 900) · mayoristas, minoristas y negocios con stock.
  - Comercio grande **desde $2.500.000** (desde USD 1.500) · alcance y precio final en la videollamada.
  - Mantenimiento mensual **$50.000/mes** (USD 30) después de los 3 meses incluidos: sitio online,
    seguridad y hasta 1 hora de cambios por mes, sin contrato.
- Por qué estos montos: con los de `finanzas.md` la landing rinde 50–106 USD/h y el backend
  rendía ~24–32 USD/h a $800.000. El mercado argentino 2026 ubica una landing en $300–700k
  (senior hasta $1,2M), lo a medida con backend en $1,5–5M y el mantenimiento básico en
  $25–130k/mes. La landing ya estaba arriba del promedio; los otros dos planes estaban abajo del
  piso. Los dólares salen del blue del 23/11 (~$1.675), redondeados.
- Cada plan lleva a **agendar una videollamada** por WhatsApp con el plan escrito. La seña del 30%
  se cobra después de la llamada con un link de Mercado Pago que manda Ignacio (se probó y se
  descartó el cobro de seña desde el sitio: obligaba a devolver si el proyecto no convenía).

### Asistente ("tu asistente")

- `assistant.js` reescrito: tres pasos con tarjetas (a qué se dedica, qué tiene hoy, para cuándo),
  recomendación de plan con precio animado, foto de Ignacio y botón de agendar. Línea de pasos con
  nombre, respuestas tocables para volver atrás y la esfera de partículas grande como presencia.
- Se presenta como asistente del visitante, no "de Ignacio". La IA queda para preguntas libres y
  recibe lo que el visitante ya eligió.
- Pasa a ser la sección de contacto: "Tu proyecto" y su formulario se retiran (también en `/en/`);
  la conversión de Ads del formulario se mueve al "Que me escriba" del asistente.
- `chatbot.mjs`: puede dar los precios publicados, deriva a la videollamada, conoce los casos
  nuevos y en `/en/` responde en inglés y en dólares (antes a veces contestaba en castellano).
- Probado con un DOM simulado (jsdom) y clics reales en los dos idiomas y los tres planes.

### Home

- Hero sin precio ("La web de tu negocio, hecha a tu medida") con la foto de Ignacio a 120px al
  lado de "Soy Ignacio…". Textos en primera persona.
- Sección **Rubros** en bento: profesionales, tiendas y mayoristas, clubes y eventos, escuelas y
  estudios. Cada uno con su tono, escenario con capturas reales de sus casos (se abren en abanico
  al pasar el mouse), casos con miniatura y plan sugerido con precio.
- Webs sumadas a rubros y a `/proyectos/` (13 en producción): Celulandia, Majo Yoga y cossa.
- Versión en inglés al día: hero, rubros, precios en dólares y asistente como contacto.

### Medición

- Eventos nuevos en `/api/e`: `sec:precios`, `call:<plan>` y `advisor:*` (inicio, plan
  recomendado, agendar por plan, pregunta libre, contacto).

### Pendiente

- Link de agenda (Google Calendar) para que el botón no pase por WhatsApp.
- Captura de cossa: su home minimalista se ve casi vacía en la tarjeta.
- `private/` se reconstruyó desde el worker publicado (las campañas no estaban en esta PC).

## 2026-10-21 (noche) — Asistente de ventas con IA y cierre de Servicios

- Sección de preguntas reemplazada por un asistente: esfera de partículas que escucha, piensa y responde palabra por palabra, integrada al fondo (sin caja). Preguntas sugeridas flotando alrededor. Se retira el acordeón de FAQ.
- Backend `/api/chat` y `/api/chat/lead` en el Worker (`chatbot.mjs`), contra Groq (`GROQ_API_KEY`, modelo por defecto `openai/gpt-oss-120b`, configurable con `GROQ_MODEL`). Solo vende IVAVALA: prompt cerrado, filtro de inyección previo al modelo, validación de la salida, chequeo de origen, topes por IP y globales, historial saneado.
- Deriva a Ignacio por WhatsApp o deja contacto: aviso a la casilla por el binding y resumen al visitante por Resend, con Turnstile y límites por IP y por destinatario.
- "Y también construimos", mantenimiento y cierre de Servicios con más presencia. Contacto con el mismo ancho que el asistente.
- Pendiente: el JSON-LD FAQPage del `<head>` sigue declarando preguntas que ya no están visibles.

## 2026-10-21 — Reenfoque a estudio B2B, paleta clara y respaldo visible

- Hero de oferta ("Desarrollo web a medida para empresas y profesionales") en dos columnas: texto y capturas de sitios reales que rotan de lugar. Un solo botón, "Ver tecnología".
- Paleta clara con acento cobalto (`#2547f5`) como override al final de `motion.css`; el `<head>` no se toca. Favicon y apple-touch-icon con monograma "IV".
- Fondo vivo en WebGL (gradiente de seda con ruido deformado, reacciona al mouse y al scroll; media resolución, ~30 fps). Sin WebGL queda el fondo CSS. El anillo anterior queda desactivado en `motion.js`.
- Sección "Confían en nosotros" con los sitios reales en producción (solo nombres y links, sin cifras ni testimonios). Escuela Sónica se suma como caso.
- Servicios con pregunta-problema, casos Necesidad/Construimos/Hoy, proceso en cuatro tarjetas con mini-escenas, tecnología en lenguaje de beneficio y FAQ con "¿Cuánto cuesta?". Herramientas oculta.
- Sin cambios en Google Tag, conversiones de Ads, eventos `whatsapp_click:*` ni URLs `wa.me`.

### Pendiente de validar

Textos de casos (incluido Escuela Sónica) y pasos del proceso, redactados a partir de la home anterior.

## 2026-09-20 — Rediseño de la home ES/EN

- Hero centrado de una pantalla, retrato ampliado y propuesta de una frase. Acciones compactas con más separación.
- Paleta azul oscuro fija con texto celeste verdoso; retirados selector de tema, disponibilidad y métricas del hero.
- Fondo WebGL de una sola pasada: anillo en el hero, apertura progresiva y aceleración con el scroll. La energía queda atenuada en los bordes fuera del hero para preservar la lectura; sin seguimiento del cursor.
- Proyectos cuadrados con recorrido horizontal controlado por scroll vertical, sin contador ni flechas. Navegación por teclado y alternativa con movimiento reducido.
- FAQ sin subtítulo redundante y sin comillas especiales en mantenimiento incluido.
- Integración de producción: formulario y Turnstile originales, analítica y metadatos indexables restaurados. Worker y bindings existentes conservados.

### Verificación

Sintaxis de scripts y preparación de Wrangler verificadas antes de publicar. Inspección visual local de hero y proyectos. No se envían mensajes de prueba desde el formulario.

## 2026-09-21 — Recuperación de WebGL y alternativa estática

- Reconstrucción de shaders, programa, buffer y uniforms tras webglcontextrestored; suspensión del render al perder el contexto.
- Anillo CSS en el hero por defecto, incluso sin JavaScript/WebGL; solo se oculta después del primer render. Movimiento reducido conserva el anillo estático.
- Diagnósticos de compilación y enlace en consola, liberación de recursos tras fallos y captura de errores al crear el contexto.
- Preferencia por highp cuando está disponible y fases periódicas acotadas para evitar degradación por acumulación del tiempo.
- Versionado de CSS/JS actualizado en español e inglés.

## 2026-09-24 — Herramientas gratis: link de WhatsApp y monitor web

Dos páginas nuevas, solo en español, con el estilo de la home (marino fijo, dock flotante, anillo estático, filas con hairline). Estilos compartidos en `herramientas.css`.

### /link-whatsapp/

- Arma el link `wa.me` con mensaje precargado. Normaliza números de Argentina (saca el 0 y el 15, agrega el 9) y muestra cómo queda antes de copiarlo.
- Cartel imprimible con QR (PNG 1200×1700), QR suelto en PNG y SVG, y snippet de botón flotante para pegar en cualquier web. La vista previa y la descarga salen del mismo canvas.
- QR con qrcode-generator 1.4.4 (MIT), vendorizado en `vendor/qrcode.min.js`, sin CDN.
- Todo corre en el navegador; los datos del formulario quedan solo en localStorage.

### /monitor-web/

- Chequeo instantáneo de una URL: si responde, días que le quedan al certificado SSL y al dominio.
- Suscripción gratis por mail con doble opt-in. Avisa si la web se cae (después de dos fallas seguidas) y cuando vuelve, y también antes de que venza el SSL (7, 3 y 1 días) o el dominio (30, 7 y 1). Hasta 5 webs por mail.
- Acceso por token en el link del mail: confirmar, ver estado y dar de baja. Baja en un clic con `List-Unsubscribe-Post`.
- Worker: rutas `/api/monitor*` con Turnstile, honeypot y rate limit; cron cada 5 minutos (`scheduled`). SSL desde Certificate Transparency (Cert Spotter; `CERTSPOTTER_KEY` opcional), dominio desde RDAP. Mails a terceros con Resend; aviso a Ignacio con `SEND_EMAIL`.
- Migración `0005_monitors.sql` (tabla `monitors`), aplicada en remoto.
- Sitemap, `llms.txt` y eventos de analítica actualizados.

### Home

- Sección "Gratis" entre Servicios y Stack, con las dos herramientas en el mismo formato de filas que los servicios, y link en el menú. Clicks medidos como `tool:click` y llegada a la sección como `sec:herramientas`. Solo en la home en español.

### Verificación

Flujo del monitor probado en local con `wrangler dev --test-scheduled`: chequeo, suscripción, confirmación, alerta de caída, recuperación y baja; URLs inválidas rechazadas. Capturas headless del link de WhatsApp en 1440 y 390 sin scroll horizontal. Pendiente: revisión visual del panel de resultados del monitor.
