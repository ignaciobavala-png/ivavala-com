// Redirige HTTP -> HTTPS y www -> apex, sirve robots.txt / sitemap.xml,
// y mantiene fuera del indice cualquier hostname que no sea el canonico.
const CANONICAL = "ivavala.com";
const ORIGIN = "https://" + CANONICAL;

// Un solo grupo "User-agent: *" a proposito. Un crawler que encuentra un grupo
// con SU nombre usa solo ese y descarta el general: si se agregaran bloques por
// bot (GPTBot, ClaudeBot...) para "dejarlos entrar", esos bots dejarian de leer
// el Disallow del panel. Permitir a todos ya los incluye.
const ROBOTS_OK = `# ivavala.com — Ignacio Vavala, desarrollador web full-stack.
# Buscadores y asistentes: bienvenidos. El sitio entero es publico y se puede
# citar; lo unico cerrado es el panel privado.

User-agent: *
Content-Signal: search=yes,ai-input=yes
Allow: /
Disallow: /panel

Sitemap: ${ORIGIN}/sitemap.xml
`;

// Resumen en texto plano para agentes: la home es HTML con acordeones y estilos,
// esto es lo mismo sin nada alrededor. Convencion emergente (/llms.txt), todavia
// sin adopcion confirmada de los grandes: cuesta poco y no estorba.
const LLMS = `# Ignacio Vavala

> Desarrollador web full-stack. Construye sitios y sistemas a medida, se hace
> cargo del mantenimiento y trabaja en remoto con cualquier huso horario.
> Espanol e ingles. Contacto: ignacio@ivavala.com

## Que hace

- Sitios con panel propio: el cliente publica precios, fotos y novedades sin
  depender de nadie.
- Tiendas online con cobro por Mercado Pago o cierre de compra por WhatsApp,
  con stock y precios administrables.
- Sistemas de gestion que reemplazan planillas: barra, entradas y finanzas en
  vivo, con todo el equipo sobre el mismo numero.
- Plataformas de eventos: inscripcion con codigos de invitacion, cobro y
  control de acceso.

## Como trabaja

- Una landing institucional toma entre una y dos semanas; un sistema a medida
  depende del alcance. El plazo se fija antes de arrancar.
- Los primeros 3 meses de mantenimiento van incluidos: el sitio online, las
  actualizaciones de seguridad y cualquier arreglo de algo propio, sin costo.
- El dominio, el codigo y los accesos son del cliente desde el dia uno. Sin
  plataformas cerradas de las que despues no se pueda salir.

## Trabajos en produccion

- LABITCONF 26 — landing del evento con speakers y contenido en vivo.
- Manso Club — apps de evento: barra, entradas y finanzas en vivo.
- Malasana Boutique — tienda online con cierre de compra por WhatsApp.
- Reunata — e-commerce mayorista con precios por usuario.
- Torres del Paine Summit — registro y onboarding con codigos y pagos.
- GonzalezOliva — portfolio de estudio de arquitectura.
- Escribania Tocagni — landing institucional de estudio notarial.

## Paginas

- ${ORIGIN}/ — inicio (espanol)
- ${ORIGIN}/en/ — inicio (ingles)
- ${ORIGIN}/piezas/botella — pieza interactiva
- ${ORIGIN}/piezas/flor — pieza interactiva (me va a salir: la flor que nunca dice que no)
`;

const ROBOTS_BLOCK = `User-agent: *
Disallow: /
`;

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${ORIGIN}/</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/"/>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${ORIGIN}/en/</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/"/>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${ORIGIN}/piezas/botella</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}/piezas/botella"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/en/piezas/botella"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/piezas/botella"/>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${ORIGIN}/en/piezas/botella</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}/piezas/botella"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/en/piezas/botella"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/piezas/botella"/>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${ORIGIN}/piezas/flor</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
`;

const text = (body, type) =>
  new Response(body, {
    headers: { "content-type": type + "; charset=utf-8", "cache-control": "public, max-age=3600" },
  });


// ── formulario de contacto ────────────────────────────────────────────────
const DEST = "ignaciobavala@gmail.com";
const FROM = "formulario@ivavala.com";

const b64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

// Las cabeceras solo aceptan ASCII: lo demas va codificado (RFC 2047).
const header = (v) => (/^[\x20-\x7E]*$/.test(v) ? v : "=?UTF-8?B?" + b64(v) + "?=");

// Critico: el visitante controla estos valores. Un \r o \n sin filtrar deja
// inyectar cabeceras arbitrarias (Bcc, otro To) en el mensaje.
const oneLine = (v, max) => String(v || "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

const isEmail = (v) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v);

const json = (obj, status, extra) =>
  new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(extra || {}),
    },
  });

function buildMime({ nombre, email, whatsapp, tipo, mensaje }) {
  const subject = `Consulta de ${nombre} — ${tipo}`;
  const body = [
    `Nombre:   ${nombre}`,
    `Email:    ${email}`,
    `WhatsApp: ${whatsapp || "(no dejo)"}`,
    `Necesita: ${tipo}`,
    "",
    mensaje || "(sin mensaje)",
    "",
    "—",
    "Enviado desde el formulario de ivavala.com",
  ].join("\r\n");

  return [
    `From: ${header("Formulario ivavala.com")} <${FROM}>`,
    `To: <${DEST}>`,
    `Reply-To: ${header(nombre)} <${email}>`,
    `Subject: ${header(subject)}`,
    `Message-ID: <${crypto.randomUUID()}@ivavala.com>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(body).replace(/(.{76})/g, "$1\r\n"),
  ].join("\r\n");
}

// Turnstile: el widget corre invisible en el navegador y deja un token de un
// solo uso. Sin este chequeo el honeypot no alcanza — un bot que postea el JSON
// directo a /api/contacto nunca ve el campo trampa y pasa igual.
async function turnstileOk(token, ip, env) {
  // Sin secreto (dev local) no se traba el formulario.
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;

  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  if (ip && ip !== "local") body.append("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const out = await res.json();
    return out.success === true;
  } catch (err) {
    // Si siteverify no contesta, pasa. Perder una consulta real cuesta mucho
    // mas que comerse un spam: solo se rechaza cuando el token es invalido
    // de verdad, no cuando falla la red.
    console.error("turnstile inaccesible, se deja pasar:", err && err.message);
    return true;
  }
}

async function handleContacto(request, env, ctx) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  // Trampa para bots: el campo esta oculto, una persona nunca lo completa.
  // Se responde ok para no darle informacion al que lo llena.
  if (oneLine(data.empresa, 200)) return json({ ok: true });

  const nombre = oneLine(data.nombre, 100);
  const email = oneLine(data.email, 150);
  const whatsapp = oneLine(data.whatsapp, 50);
  const tipo = oneLine(data.tipo, 80);
  const mensaje = String(data.mensaje || "").trim().slice(0, 4000);

  if (!nombre || !isEmail(email)) return json({ error: "invalid" }, 422);

  // Techo por IP antes de gastar un envio: tres consultas cada cinco minutos.
  const db = env.portafolio_db;
  if (db) {
    sweepRates(db, ctx);
    const rate = await allowRate(db, ipOf(request), "contacto");
    if (!rate.ok) return rateLimited(rate);
  }

  if (!(await turnstileOk(data.turnstile, ipOf(request), env))) {
    return json({ error: "captcha" }, 403);
  }

  const { EmailMessage } = await import("cloudflare:email");
  try {
    await env.SEND_EMAIL.send(
      new EmailMessage(FROM, DEST, buildMime({ nombre, email, whatsapp, tipo, mensaje }))
    );
  } catch (err) {
    console.error("send_email fallo:", err && err.message);
    return json({ error: "send_failed" }, 502);
  }
  return json({ ok: true });
}

// ── la botella: mensajes a la deriva ─────────────────────────────────────
const MSG_MAX = 500;
const RATE = { throw: 5, fish: 8, admin: 5, ev: 80, contacto: 3 }; // por IP cada 5 minutos

const safeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
};

const ipOf = (request) =>
  request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "local";

// Ventana fija de 5 minutos por IP + accion, resuelta en una sola sentencia:
// el INSERT ... ON CONFLICT evita la carrera entre dos pedidos simultaneos de
// la misma IP, que con SELECT + UPDATE por separado se colaban los dos.
// Devuelve {ok, retry} para que el cliente sepa cuanto falta.
const RATE_WINDOW = 300;

async function allowRate(db, ip, action) {
  const max = RATE[action];
  if (!max) return { ok: true, retry: 0 };
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `INSERT INTO bottle_throws (ip, action, last_ts, count) VALUES (?, ?, ?, 1)
       ON CONFLICT(ip, action) DO UPDATE SET
         count = CASE WHEN ? - CAST(last_ts AS INTEGER) > ${RATE_WINDOW} THEN 1 ELSE count + 1 END,
         last_ts = CASE WHEN ? - CAST(last_ts AS INTEGER) > ${RATE_WINDOW} THEN ? ELSE last_ts END
       RETURNING count, last_ts`
    )
    .bind(ip, action, now, now, now, now)
    .first();
  if (!row) return { ok: true, retry: 0 };
  if (row.count > max) {
    const left = RATE_WINDOW - (now - parseInt(row.last_ts, 10));
    return { ok: false, retry: left > 0 ? left : 1 };
  }
  return { ok: true, retry: 0 };
}

// 429 con el tiempo que falta, para que el mar diga algo concreto.
const rateLimited = (r) =>
  json({ error: "rate_limited", retry_after: r.retry }, 429, { "retry-after": String(r.retry) });

// La tabla de rate limit no se lee nunca fuera de la ventana: se poda de a
// ratos en segundo plano para que no crezca sin techo.
function sweepRates(db, ctx) {
  if (!ctx || Math.random() > 0.05) return;
  const cut = Math.floor(Date.now() / 1000) - RATE_WINDOW * 12;
  ctx.waitUntil(
    db
      .prepare("DELETE FROM bottle_throws WHERE CAST(last_ts AS INTEGER) < ?")
      .bind(cut)
      .run()
      .catch(() => {})
  );
}

// Una botella pescada ya no se hunde: sigue flotando marcada como leida, asi
// el mar no se vacia y el que la tiro puede ver que alguien la abrio.
const bottleCounts = (db) =>
  Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM bottles WHERE status = 'adrift' AND origin = 'human'").first(),
    db.prepare("SELECT COUNT(*) AS n FROM bottles WHERE status = 'fished' AND origin = 'human'").first(),
    db.prepare("SELECT COUNT(*) AS n FROM bottles WHERE status = 'adrift' AND origin = 'house'").first(),
  ]).then(([a, f, c]) => ({ adrift: a.n || 0, fished: f.n || 0, house: c.n || 0 }));

// Códigos ISO 3166-1 alfa-2 con nombre; el que no está sale como null y el
// mar lo describe como "algún lugar del mundo".
const COUNTRIES = {
  AR: "Argentina", BR: "Brasil", CL: "Chile", UY: "Uruguay", PY: "Paraguay",
  BO: "Bolivia", PE: "Perú", CO: "Colombia", EC: "Ecuador", VE: "Venezuela",
  MX: "México", US: "Estados Unidos", CA: "Canadá", CR: "Costa Rica",
  PA: "Panamá", GT: "Guatemala", HN: "Honduras", SV: "El Salvador",
  NI: "Nicaragua", DO: "República Dominicana", PR: "Puerto Rico", CU: "Cuba",
  ES: "España", DE: "Alemania", FR: "Francia", GB: "Reino Unido",
  IT: "Italia", PT: "Portugal", NL: "Países Bajos", BE: "Bélgica",
  CH: "Suiza", AT: "Austria", IE: "Irlanda", SE: "Suecia", NO: "Noruega",
  DK: "Dinamarca", FI: "Finlandia", PL: "Polonia", CZ: "Chequia",
  AU: "Australia", NZ: "Nueva Zelanda", JP: "Japón", CN: "China",
  IN: "India", KR: "Corea del Sur", IL: "Israel", TR: "Turquía",
  ZA: "Sudáfrica", EG: "Egipto", JM: "Jamaica",
};
const countryName = (code) => {
  const c = String(code || "").toUpperCase();
  return c && COUNTRIES[c] ? COUNTRIES[c] : null;
};

// Contenido publico: no se filtran URLs ni texto delicado, pero el spam
// con links se rechaza y la basura se limpia desde el panel con el PIN.
const cleanMsg = (raw) => {
  const msg = String(raw || "").replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (!msg || msg.length > MSG_MAX) return null;
  if (/https?:\/\/|www\./i.test(msg)) return null;
  if (msg.split("\n").length > 8) return null;
  return msg;
};

async function botellaThrow(request, db) {
  let data;
  try { data = await request.json(); } catch { return json({ error: "invalid" }, 400); }
  // Honeypot igual que el formulario: se responde ok para no avisarle al bot.
  if (oneLine(data.bot, 200)) return json({ ok: true });

  const ip = ipOf(request);
  const rate = await allowRate(db, ip, "throw");
  if (!rate.ok) return rateLimited(rate);

  const msg = cleanMsg(data.msg);
  if (!msg) return json({ error: "invalid" }, 422);

  const country = (request.headers.get("cf-ipcountry") || "").slice(0, 2).toUpperCase() || null;
  const res = await db.prepare("INSERT INTO bottles (msg, ip, country) VALUES (?, ?, ?)").bind(msg, ip, country).run();
  return json({ ok: true, id: res.meta.last_row_id, ...(await bottleCounts(db)) });
}

// Pesca al azar: primero botellas de visitantes, y si el mar está vacío de
// personas cae una de la casa (que no se gasta: se lee y sigue flotando).
async function botellaFish(request, db, lang) {
  const ip = ipOf(request);
  const rate = await allowRate(db, ip, "fish");
  if (!rate.ok) return rateLimited(rate);

  // Prioridad: primero una cerrada de visitante (esa es la entrega de verdad),
  // despues una de la casa, y recien al final una ya leida para que la caña
  // nunca vuelva vacia si el mar tiene algo.
  const pick =
    (await db
      .prepare("SELECT id, origin FROM bottles WHERE status = 'adrift' AND origin = 'human' ORDER BY RANDOM() LIMIT 1")
      .first()) ||
    (await db
      .prepare("SELECT id, origin FROM bottles WHERE status = 'adrift' AND origin = 'house' AND lang = ? ORDER BY RANDOM() LIMIT 1")
      .bind(lang)
      .first()) ||
    (await db
      .prepare("SELECT id, origin FROM bottles WHERE status = 'fished' AND origin = 'human' ORDER BY RANDOM() LIMIT 1")
      .first());
  if (!pick) return json({ bottle: null, already: false, ...(await bottleCounts(db)) });

  let already = false;
  if (pick.origin === "human") {
    const upd = await db
      .prepare("UPDATE bottles SET status = 'fished' WHERE id = ? AND status = 'adrift'")
      .bind(pick.id)
      .run();
    // changes === 0: ya estaba leida, o alguien la abrio primero por milesimas.
    already = upd.meta.changes === 0;
  }
  const row = await db.prepare("SELECT id, msg, origin, country FROM bottles WHERE id = ?").bind(pick.id).first();
  const bottle = row ? { id: row.id, msg: row.msg, origin: row.origin, country: countryName(row.country) } : null;
  return json({ bottle, already, ...(await bottleCounts(db)) });
}

// Panel: con el PIN se ven todos los mensajes y se borran los que no corresponden.
async function botellaAdmin(request, db, env) {
  const url = new URL(request.url);
  // El PIN viaja en un header y no en la query: asi no queda en el historial
  // del navegador ni en los logs de acceso.
  const pin = request.headers.get("x-bottle-pin") || "";
  const ip = ipOf(request);
  const rate = await allowRate(db, ip, "admin");
  if (!rate.ok) return rateLimited(rate);
  if (!env.BOTTLE_PIN || !safeEqual(pin, env.BOTTLE_PIN))
    return json({ error: "forbidden" }, 403);

  if (request.method === "GET") {
    const [rows, adrift, house, total] = await Promise.all([
      db.prepare("SELECT id, msg, status, origin, country, created_at FROM bottles ORDER BY created_at DESC LIMIT 300").all(),
      db.prepare("SELECT COUNT(*) AS n FROM bottles WHERE status = 'adrift' AND origin = 'human'").first(),
      db.prepare("SELECT COUNT(*) AS n FROM bottles WHERE origin = 'house'").first(),
      db.prepare("SELECT COUNT(*) AS n FROM bottles").first(),
    ]);
    const bottles = rows.results.map((b) => ({ ...b, country: b.origin === "house" ? null : countryName(b.country) }));
    return json({ bottles, counts: { adrift: adrift.n, house: house.n, total: total.n } });
  }

  if (request.method === "DELETE") {
    const id = parseInt(url.searchParams.get("id") || "", 10);
    if (!id) return json({ error: "invalid" }, 422);
    const res = await db.prepare("DELETE FROM bottles WHERE id = ?").bind(id).run();
    if (res.meta.changes === 0) return json({ error: "not_found" }, 404);
    return json({ ok: true });
  }

  return json({ error: "method_not_allowed" }, 405);
}

// Las botellas que flotan en el mar: visitantes (single-delivery) y de la casa
// (piso). Solo ids y origin, el mensaje viaja al abrir.
async function botellaList(db, lang) {
  const [human, house, counts] = await Promise.all([
    // Sin abrir es algo de cada visitante, no del mar: el servidor manda las
    // mas nuevas y el navegador marca cuales ya abrio esta persona.
    db
      .prepare(
        `SELECT id, origin, status FROM bottles
         WHERE origin = 'human' AND status IN ('adrift', 'fished')
         ORDER BY created_at DESC LIMIT 8`
      )
      .all(),
    db
      .prepare("SELECT id, origin, 'adrift' AS status FROM bottles WHERE status = 'adrift' AND origin = 'house' AND lang = ? ORDER BY created_at DESC LIMIT 4")
      .bind(lang)
      .all(),
    bottleCounts(db),
  ]);
  // Los contadores viajan aca mismo: la pieza pinta el mar con un solo pedido.
  return json({ bottles: [...human.results, ...house.results], ...counts });
}

// Pesca la botella puntual que se aprieta en el mar. Las de visitante se
// entregan una sola vez; las de la casa se leen y siguen flotando.
async function botellaGrab(request, db, id) {
  const ip = ipOf(request);
  const rate = await allowRate(db, ip, "fish");
  if (!rate.ok) return rateLimited(rate);

  const row = await db.prepare("SELECT id, msg, origin, country, status FROM bottles WHERE id = ?").bind(id).first();
  if (!row) return json({ bottle: null, ...(await bottleCounts(db)) });

  if (row.origin === "house") {
    const bottle = { id: row.id, msg: row.msg, origin: "house", country: null };
    return json({ bottle, already: false, ...(await bottleCounts(db)) });
  }
  const base = { id: row.id, msg: row.msg, origin: "human", country: countryName(row.country) };
  if (row.status !== "adrift")
    return json({ bottle: base, already: true, ...(await bottleCounts(db)) });
  const upd = await db
    .prepare("UPDATE bottles SET status = 'fished' WHERE id = ? AND status = 'adrift'")
    .bind(id)
    .run();
  // changes === 0 significa que otro la abrio primero por milesimas: se lee
  // igual, pero como una botella que ya encontro a alguien.
  return json({ bottle: base, already: upd.meta.changes === 0, ...(await bottleCounts(db)) });
}

async function botellaRoute(request, env, ctx) {
  const url = new URL(request.url);
  const db = env.portafolio_db;
  if (!db) return json({ error: "db_unavailable" }, 503);
  sweepRates(db, ctx);
  // Solo cambia de que idioma salen las botellas de la casa; las de
  // visitantes se entregan tal cual se escribieron.
  const lang = url.searchParams.get("lang") === "en" ? "en" : "es";

  if (url.pathname === "/api/juegos/botella") {
    if (request.method === "POST") return botellaThrow(request, db);
    if (request.method === "GET") {
      if (url.searchParams.get("list") === "1") return botellaList(db, lang);
      const id = parseInt(url.searchParams.get("id") || "", 10);
      if (id) return botellaGrab(request, db, id);
      return botellaFish(request, db, lang);
    }
    return json({ error: "method_not_allowed" }, 405);
  }
  if (url.pathname === "/api/juegos/botella/count") {
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
    return json(await bottleCounts(db));
  }
  if (url.pathname === "/api/juegos/botella/admin") {
    if (request.method === "GET" || request.method === "DELETE") return botellaAdmin(request, db, env);
    return json({ error: "method_not_allowed" }, 405);
  }
  return null;
}

// ── medicion del embudo ───────────────────────────────────────────────────
// Analitica propia: sin cookies, sin scripts de terceros y sin guardar IP.
// Solo interesa el embudo — cuantos ven la home, cuantos despliegan el
// trabajo, cuantos llegan al formulario y cuantos escriben de verdad.

// Lista blanca: un evento que no este aca se descarta. Asi la tabla no se
// puede llenar desde afuera con nombres inventados.
const EVENTS = new Set([
  "view",
  "sec:servicios", "sec:trabajo", "sec:componentes", "sec:stack", "sec:faq", "sec:contacto",
  "svc:click", "work:click", "pieza:click",
  "flor:jugar", "flor:final", "flor:share",
  "form:start", "form:ok",
  "out:whatsapp", "out:mail", "out:github",
]);

// Del referrer se guarda solo el host: alcanza para saber de donde llega la
// gente y evita arrastrar querystrings con datos de campanas ajenas.
const refHost = (raw) => {
  const v = String(raw || "").slice(0, 300);
  if (!v) return null;
  try {
    const h = new URL(v).hostname.replace(/^www\./, "");
    return h === CANONICAL ? null : h.slice(0, 80);
  } catch {
    return null;
  }
};

async function handleEvent(request, db) {
  let data;
  try { data = await request.json(); } catch { return json({ error: "invalid" }, 400); }

  const name = oneLine(data.n, 40);
  if (!EVENTS.has(name)) return json({ error: "unknown_event" }, 422);

  const rate = await allowRate(db, ipOf(request), "ev");
  if (!rate.ok) return rateLimited(rate);

  const path = oneLine(data.p, 120) || null;
  const lang = data.l === "en" ? "en" : "es";
  const ref = refHost(data.r);
  const country = (request.headers.get("cf-ipcountry") || "").slice(0, 2).toUpperCase() || null;

  await db
    .prepare("INSERT INTO events (name, path, lang, ref, country) VALUES (?, ?, ?, ?, ?)")
    .bind(name, path, lang, ref, country)
    .run();
  // 204: el navegador manda esto con sendBeacon y no lee la respuesta.
  return new Response(null, { status: 204 });
}

// Panel: los mismos numeros que mirarias todos los dias, detras del PIN.
async function handleStats(request, db, env) {
  const pin = request.headers.get("x-panel-pin") || "";
  const rate = await allowRate(db, ipOf(request), "admin");
  if (!rate.ok) return rateLimited(rate);
  if (!env.BOTTLE_PIN || !safeEqual(pin, env.BOTTLE_PIN)) return json({ error: "forbidden" }, 403);

  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "30", 10) || 30, 1), 365);
  const since = `-${days} days`;

  const [totals, daily, refs, countries] = await Promise.all([
    db.prepare(
      `SELECT name, COUNT(*) AS n FROM events
       WHERE created_at >= datetime('now', ?) GROUP BY name ORDER BY n DESC`
    ).bind(since).all(),
    db.prepare(
      `SELECT date(created_at) AS d, COUNT(*) AS n,
              SUM(CASE WHEN name = 'view' THEN 1 ELSE 0 END) AS views,
              SUM(CASE WHEN name = 'form:ok' THEN 1 ELSE 0 END) AS leads
       FROM events WHERE created_at >= datetime('now', ?)
       GROUP BY d ORDER BY d DESC LIMIT 60`
    ).bind(since).all(),
    db.prepare(
      `SELECT ref, COUNT(*) AS n FROM events
       WHERE name = 'view' AND ref IS NOT NULL AND created_at >= datetime('now', ?)
       GROUP BY ref ORDER BY n DESC LIMIT 20`
    ).bind(since).all(),
    db.prepare(
      `SELECT country, COUNT(*) AS n FROM events
       WHERE name = 'view' AND country IS NOT NULL AND created_at >= datetime('now', ?)
       GROUP BY country ORDER BY n DESC LIMIT 20`
    ).bind(since).all(),
  ]);

  const by = {};
  for (const r of totals.results) by[r.name] = r.n;
  // El embudo en el orden en que lo recorre una persona: llega, mira el
  // trabajo, abre el contacto, escribe.
  const funnel = {
    view: by["view"] || 0,
    trabajo: by["sec:trabajo"] || 0,
    contacto: by["sec:contacto"] || 0,
    escribio: by["form:ok"] || 0,
    salidas: (by["out:whatsapp"] || 0) + (by["out:mail"] || 0),
  };

  return json({
    days,
    funnel,
    totals: totals.results,
    daily: daily.results,
    refs: refs.results,
    countries: countries.results.map((r) => ({ ...r, name: countryName(r.country) || r.country })),
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const isCanonical = url.hostname === CANONICAL;

    // Los hostnames no canonicos (workers.dev) no se redirigen: siguen sirviendo
    // para verificar deploys, pero no compiten en el indice.
    if (!isCanonical && url.hostname.endsWith(".workers.dev")) {
      if (url.pathname === "/robots.txt") return text(ROBOTS_BLOCK, "text/plain");
      const res = await env.ASSETS.fetch(request);
      const out = new Response(res.body, res);
      out.headers.set("x-robots-tag", "noindex, nofollow");
      return out;
    }

    // En desarrollo local (.dev.vars con ENV=dev) no hay TLS ni dominio
    // canonico: se sirve directo. En produccion se fuerza https y apex.
    const isDev = env.ENV === "dev";
    const hostHeader = request.headers.get("host") || url.hostname;
    if (hostHeader === "www." + CANONICAL || (!isDev && proto !== "https")) {
      url.protocol = "https:";
      url.hostname = CANONICAL;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/e" && request.method === "POST") {
      const db = env.portafolio_db;
      if (!db) return new Response(null, { status: 204 });
      sweepRates(db, ctx);
      return handleEvent(request, db);
    }

    if (url.pathname === "/api/stats") {
      if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
      const db = env.portafolio_db;
      if (!db) return json({ error: "db_unavailable" }, 503);
      return handleStats(request, db, env);
    }

    if (url.pathname === "/api/contacto") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      return handleContacto(request, env, ctx);
    }

    const botella = await botellaRoute(request, env, ctx);
    if (botella) return botella;

    if (url.pathname === "/robots.txt") return text(ROBOTS_OK, "text/plain");
    if (url.pathname === "/llms.txt") return text(LLMS, "text/plain");
    if (url.pathname === "/sitemap.xml") return text(SITEMAP, "application/xml");

    return env.ASSETS.fetch(request);
  },
};
