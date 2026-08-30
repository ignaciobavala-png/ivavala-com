// Redirige HTTP -> HTTPS y www -> apex, sirve robots.txt / sitemap.xml,
// y mantiene fuera del indice cualquier hostname que no sea el canonico.
import { componerHTML, guardarReporte, enviarReporte, listarReportes, borrarReporte } from "./reportes.js";

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
- ${ORIGIN}/auditoria — herramienta gratuita: audita la velocidad y el SEO de un sitio y traduce el resultado a clientes perdidos
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
    <loc>${ORIGIN}/auditoria</loc>
    <lastmod>2026-08-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
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
const RATE = { throw: 5, fish: 8, admin: 5, ev: 80, contacto: 3, auditoria: 6 }; // por IP cada 5 minutos

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
  "aud:start", "aud:ok", "aud:cta",
  "cta:hero", "cta:pill", "cta:nav", "cta:svcfoot", "cta:auditoria",
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

// ── auditoria gratuita de sitios ──────────────────────────────────────────
// Que hace y que no: no envuelve Lighthouse ni abre un navegador headless.
// Baja el HTML, lo lee con HTMLRewriter y le pregunta el peso a los assets.
// Eso no da un puntaje de Google, da algo mas util para el dueno de un
// negocio: defectos con nombre y peso en kilobytes. El puntaje ya lo regala
// PageSpeed; lo que no existe es la traduccion a plata.

const AUD_TIMEOUT = 8000;      // por request; el total lo corta el subrequest budget
const AUD_HTML_MAX = 1500000;  // 1,5 MB de HTML alcanza y sobra
const AUD_ASSETS = 30;         // cuantos assets se pesan como maximo

// Velocidad efectiva de una conexion movil tipica en AR y el costo fijo de
// abrir la conexion. Son supuestos, y la pagina los dice en voz alta: el
// numero sirve para comparar, no para peritar.
const AUD_KBPS = 190;          // KB/s reales sobre 4G con senal media
const AUD_HANDSHAKE = 0.55;    // segundos de DNS + TLS antes del primer byte

// Se identifica: un sitio que no quiere ser auditado tiene que poder bloquearlo.
const AUD_UA = "Mozilla/5.0 (compatible; ivavala-auditoria/1.0; +https://ivavala.com/auditoria)";

// SSRF: la URL la escribe un desconocido. Se rechaza todo lo que no parezca
// un dominio publico de verdad — nada de IPs literales, puertos raros,
// credenciales en la URL ni TLDs internos. Un negocio real siempre tiene
// dominio, asi que cerrar por completo estas puertas no pierde ningun caso.
const AUD_TLD_MALO = /^(local|internal|localhost|home|lan|intranet|test|example|invalid|onion)$/i;

function audUrl(raw) {
  let s = String(raw || "").trim();
  if (!s) return { error: "Escribí la dirección de tu sitio." };
  if (s.length > 300) return { error: "Esa dirección es demasiado larga." };
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let u;
  try { u = new URL(s); } catch (e) { return { error: "Esa dirección no se entiende. Probá con algo como mitienda.com.ar" }; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { error: "Solo puedo mirar direcciones web." };
  if (u.username || u.password) return { error: "Sacá el usuario y la contraseña de la dirección." };
  if (u.port && u.port !== "80" && u.port !== "443") return { error: "Solo puedo mirar sitios en los puertos web habituales." };
  const h = u.hostname.toLowerCase();
  // Una IP literal (v4 o v6) nunca es el sitio de un negocio, y es justo la
  // forma de pedirme que golpee una direccion interna.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":") || h.startsWith("[")) {
    return { error: "Necesito un dominio, no una dirección IP." };
  }
  const partes = h.split(".");
  if (partes.length < 2) return { error: "Falta el dominio completo. Probá con mitienda.com.ar" };
  const tld = partes[partes.length - 1];
  if (tld.length < 2 || AUD_TLD_MALO.test(tld)) return { error: "Ese dominio no es público." };
  u.hash = "";
  return { url: u };
}

// Lee el cuerpo con un tope duro: un content-length mentido no puede hacernos
// tragar 200 MB.
async function audLeer(res, max) {
  const reader = res.body && res.body.getReader();
  if (!reader) return { texto: "", bytes: 0 };
  const partes = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) { try { await reader.cancel(); } catch (e) {} break; }
    partes.push(value);
  }
  const buf = new Uint8Array(total > max ? max : total);
  let off = 0;
  for (const p of partes) { buf.set(p, off); off += p.length; }
  return { texto: new TextDecoder("utf-8").decode(buf), bytes: total };
}

const audAbs = (href, base) => { try { return new URL(href, base).toString(); } catch (e) { return null; } };
const audMismoOrigen = (a, b) => { try { return new URL(a).origin === new URL(b).origin; } catch (e) { return false; } };

// Pesa un asset sin bajarlo entero: primero HEAD, y si el servidor no lo
// soporta o no informa el largo, un GET con Range de un byte. Si igual no
// dice nada, se cuenta como desconocido y la pagina lo aclara — es preferible
// a inventar un peso.
async function audPesar(u) {
  const opts = { redirect: "follow", signal: AbortSignal.timeout(AUD_TIMEOUT), headers: { "user-agent": AUD_UA } };
  try {
    const h = await fetch(u, { ...opts, method: "HEAD" });
    const len = h.headers.get("content-length");
    if (h.ok && len) return { bytes: parseInt(len, 10), tipo: h.headers.get("content-type") || "" };
  } catch (e) {}
  // Muchos origenes (Cloudflare Assets entre ellos) no contestan HEAD con
  // largo, y varios ignoran el Range y devuelven 200 con el archivo entero.
  // Por eso se mira content-range Y content-length, y recien si no hay ninguno
  // se cuenta a mano. El cuerpo se cancela apenas se sabe el numero.
  try {
    const g = await fetch(u, { ...opts, method: "GET", headers: { ...opts.headers, range: "bytes=0-0" } });
    const tipo = g.headers.get("content-type") || "";
    const cr = g.headers.get("content-range");
    const m = cr && cr.match(/\/(\d+)\s*$/);
    if (m) { try { if (g.body) await g.body.cancel(); } catch (e) {} return { bytes: parseInt(m[1], 10), tipo }; }
    const len = g.headers.get("content-length");
    if (len && g.status === 200) { try { if (g.body) await g.body.cancel(); } catch (e) {} return { bytes: parseInt(len, 10), tipo }; }
    const leido = await audLeer(g, 12000000);
    if (leido.bytes) return { bytes: leido.bytes, tipo };
  } catch (e) {}
  return null;
}

async function audAnalizar(u) {
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(u.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(AUD_TIMEOUT),
      headers: { "user-agent": AUD_UA, accept: "text/html,application/xhtml+xml" },
    });
  } catch (e) {
    return { error: "No pude abrir ese sitio. Puede estar caído, tardar demasiado o estar bloqueando visitas automáticas." };
  }
  const ttfb = (Date.now() - t0) / 1000;
  if (!res.ok) return { error: "El sitio respondió con un error " + res.status + ". Revisá que la dirección sea la correcta." };
  const ctype = res.headers.get("content-type") || "";
  if (!/text\/html|application\/xhtml/i.test(ctype)) return { error: "Esa dirección no devuelve una página web." };

  const finalUrl = res.url || u.toString();
  const cuerpo = await audLeer(res, AUD_HTML_MAX);
  const html = cuerpo.texto || "";

  // Lo que se saca del HTML. Se hace con una pasada de HTMLRewriter porque es
  // streaming y nativo del runtime: nada de meter un parser en el bundle.
  const d = {
    imgs: [], scripts: [], css: [], viewport: false, title: "", desc: "",
    h1: 0, lang: "", favicon: false, og: false,
  };
  let enHead = true;
  await new HTMLRewriter()
    .on("html", { element(el) { d.lang = el.getAttribute("lang") || ""; } })
    .on("body", { element() { enHead = false; } })
    .on("title", { text(t) { if (d.title.length < 200) d.title += t.text; } })
    .on('meta[name="viewport"]', { element() { d.viewport = true; } })
    .on('meta[name="description"]', { element(el) { d.desc = el.getAttribute("content") || ""; } })
    .on('meta[property="og:image"]', { element() { d.og = true; } })
    .on('link[rel~="icon"]', { element() { d.favicon = true; } })
    .on("h1", { element() { d.h1++; } })
    .on("img", {
      element(el) {
        if (d.imgs.length >= 120) return;
        const src = el.getAttribute("src") || el.getAttribute("data-src") || "";
        if (!src || src.startsWith("data:")) return;
        d.imgs.push({
          src,
          lazy: (el.getAttribute("loading") || "").toLowerCase() === "lazy",
          dims: !!(el.getAttribute("width") && el.getAttribute("height")),
        });
      },
    })
    .on("script[src]", {
      element(el) {
        if (d.scripts.length >= 60) return;
        d.scripts.push({
          src: el.getAttribute("src"),
          bloquea: enHead && el.getAttribute("async") === null && el.getAttribute("defer") === null,
        });
      },
    })
    .on('link[rel="stylesheet"]', { element(el) { if (d.css.length < 40) d.css.push(el.getAttribute("href")); } })
    .transform(new Response(html))
    .arrayBuffer();

  // Se pesan los assets propios: los de terceros (fuentes de Google, pixeles)
  // no los puede arreglar el dueno del sitio, asi que ensucian el diagnostico.
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const imgUrls = uniq(d.imgs.map((i) => audAbs(i.src, finalUrl))).filter((x) => x && audMismoOrigen(x, finalUrl));
  const cssUrls = uniq(d.css.map((h) => audAbs(h, finalUrl))).filter((x) => x && audMismoOrigen(x, finalUrl));
  const jsUrls = uniq(d.scripts.map((s) => audAbs(s.src, finalUrl))).filter((x) => x && audMismoOrigen(x, finalUrl));

  const cupo = (arr, n) => arr.slice(0, n);
  const objetivo = [
    ...cupo(imgUrls, 20).map((u2) => ["img", u2]),
    ...cupo(cssUrls, 5).map((u2) => ["css", u2]),
    ...cupo(jsUrls, 5).map((u2) => ["js", u2]),
  ].slice(0, AUD_ASSETS);

  // Un HTML minusculo, sin titulo y sin un solo asset no es un sitio: es un
  // muro anti-bots, un redirect por JavaScript o una pagina de error. Emitir
  // seis hallazgos seguros sobre eso es la forma mas rapida de perder la
  // confianza del que vino a que le digan la verdad.
  if (!d.title.trim() && imgUrls.length + cssUrls.length + jsUrls.length === 0 && html.length < 5000) {
    return { error: "Ese sitio no me dejó ver su contenido: me devolvió una página vacía. Suele pasar cuando hay protección contra visitas automáticas. Probá con otra dirección." };
  }

  const pesados = await Promise.all(objetivo.map(async ([k, u2]) => [k, u2, await audPesar(u2)]));

  let bImg = 0, bCss = 0, bJs = 0, sinPeso = 0, imgOk = 0;
  const grandes = [];
  for (const [k, u2, r] of pesados) {
    if (!r || !isFinite(r.bytes)) { sinPeso++; continue; }
    if (k === "img") { bImg += r.bytes; imgOk++; grandes.push({ u: u2, bytes: r.bytes, tipo: r.tipo }); }
    else if (k === "css") bCss += r.bytes;
    else bJs += r.bytes;
  }
  grandes.sort((a, b) => b.bytes - a.bytes);

  // Solo se pesan las primeras 20 imagenes: un diario con 120 daria un total
  // ridiculamente bajo, y justo en los sitios cargados de fotos es donde el
  // dato importa. Se estima el resto con el promedio de la muestra y la
  // pagina avisa que es una estimacion sobre una muestra, no un conteo.
  const imgMuestra = imgOk < imgUrls.length;
  if (imgOk > 0 && imgMuestra) bImg = Math.round((bImg / imgOk) * imgUrls.length);

  const bHtml = cuerpo.bytes || 0;
  const total = bHtml + bImg + bCss + bJs;
  const requests = 1 + imgUrls.length + cssUrls.length + jsUrls.length;

  // Lo que viaja no es lo que pesa. El runtime de Workers descomprime solo y
  // borra el content-encoding, asi que desde aca la compresion no se puede ni
  // medir ni auditar: cualquier chequeo daria "sin comprimir" para todos. Lo
  // que si se puede es no mentir en el tiempo — hoy practicamente todo hosting
  // manda el texto comprimido, y brotli lo deja en torno a un tercio. Las
  // imagenes ya vienen comprimidas y viajan tal cual.
  const AUD_TEXTO = 3.5;
  const transfer = Math.round(bImg + (bHtml + bCss + bJs) / AUD_TEXTO);

  // Un sitio que arma el contenido con JavaScript esconde sus imagenes del
  // HTML inicial: se avisa en vez de dar por bueno un peso que no es.
  const parcial = d.imgs.length <= 2 && (jsUrls.length >= 2 || html.length > 60000);

  // El numero que le importa al dueno: cuanto tarda en abrir desde un celular.
  const segundos = Math.round((AUD_HANDSHAKE + ttfb + transfer / 1024 / AUD_KBPS) * 10) / 10;

  return {
    url: finalUrl, ttfb: Math.round(ttfb * 100) / 100, segundos,
    bytes: { html: bHtml, img: bImg, css: bCss, js: bJs, total, transfer },
    requests, sinPeso, parcial,
    muestra: imgMuestra ? { medidas: imgOk, de: imgUrls.length } : null,
    imgs: { total: d.imgs.length, medidas: imgUrls.length, sinLazy: d.imgs.filter((i) => !i.lazy).length, sinDims: d.imgs.filter((i) => !i.dims).length },
    grandes: grandes.slice(0, 5),
    bloquean: d.scripts.filter((s) => s.bloquea).length,
    viewport: d.viewport, title: d.title.trim(), desc: String(d.desc || "").trim(),
    h1: d.h1, lang: d.lang, favicon: d.favicon, og: d.og,
    https: finalUrl.startsWith("https:"),
  };
}

// Cuanta gente se va antes de que abra. Es una estimacion a partir del tiempo
// de carga, no una medicion de las visitas reales del sitio, y la pagina lo
// dice. Curva monotona y conservadora: sirve para ordenar y comparar.
function audSeVan(seg) {
  const pts = [[1, 3], [2, 6], [2.5, 9], [3, 14], [4, 24], [5, 32], [6, 38], [8, 45], [12, 55]];
  if (seg <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (seg <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return Math.round(y0 + ((seg - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return 60;
}

const audKB = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB");

// Los hallazgos. Cada uno dice que pasa en criollo, cuanto cuesta y que se
// hace. El orden es por gravedad, no por categoria: el dueno lee los dos
// primeros y cierra.
function audHallazgos(a) {
  const h = [];
  const push = (sev, titulo, detalle, arreglo) => h.push({ sev, titulo, detalle, arreglo });

  if (!a.viewport) {
    push("alto", "Tu sitio no está preparado para celulares",
      "Falta la instrucción que le dice al teléfono cómo mostrar la página. En un celular se ve la versión de computadora achicada: hay que agrandar con los dedos para leer. Hoy la mayoría de tus clientes te busca desde el celular.",
      "Agregar la etiqueta viewport y revisar el diseño en pantalla chica.");
  }
  if (!a.https) {
    push("alto", "El navegador avisa que tu sitio no es seguro",
      "El sitio abre por HTTP. Chrome y Safari muestran un cartel de «No es seguro» al lado de la dirección, y mucha gente se va ahí mismo.",
      "Instalar un certificado y redirigir todo a HTTPS. En la mayoría de los casos es gratis.");
  }
  if (a.bytes.img > 2500000) {
    push("alto", "Las fotos son el problema principal",
      "Pesan " + audKB(a.bytes.img) + " entre " + a.imgs.medidas + " imágenes. Es lo que más tarda en aparecer, y en un celular con datos se nota muchísimo.",
      "Convertir a WebP y achicarlas al tamaño real en que se muestran. Se suele bajar un 80% sin que se note la diferencia.");
  } else if (a.bytes.img > 1000000) {
    push("medio", "Las fotos se pueden achicar bastante",
      "Pesan " + audKB(a.bytes.img) + ". No es grave, pero es la mejora más barata que tenés disponible.",
      "Convertir a WebP y servirlas al tamaño en que se ven.");
  }
  if (a.imgs.sinLazy > 6) {
    push("medio", "El sitio carga de una todas las fotos, incluso las que no se ven",
      a.imgs.sinLazy + " de " + a.imgs.total + " imágenes se descargan apenas entrás, aunque estén al final de la página y el visitante nunca baje hasta ahí.",
      'Agregar loading="lazy" a las imágenes que no están en la primera pantalla.');
  }
  if (a.bloquean > 0) {
    push("medio", "Hay " + a.bloquean + " archivo" + (a.bloquean > 1 ? "s" : "") + " que frena" + (a.bloquean > 1 ? "n" : "") + " el dibujo de la página",
      "Son scripts que el navegador tiene que bajar y ejecutar antes de mostrar nada. Mientras tanto el visitante ve una pantalla en blanco.",
      "Agregarles defer o async, o moverlos al final del documento.");
  }
  if (a.imgs.sinDims > 4) {
    push("medio", "El contenido salta mientras carga",
      a.imgs.sinDims + " imágenes no declaran su tamaño, así que el texto se corre solo a medida que van apareciendo. Es la razón por la que a veces tocás un botón y terminás en otro lado.",
      "Poner width y height en cada imagen.");
  }
  if (a.ttfb > 1.2) {
    push("medio", "El servidor tarda en contestar",
      "Tarda " + a.ttfb + " segundos en devolver el primer dato, antes de bajar una sola foto. Eso es hosting, no diseño.",
      "Revisar el plan de hosting, activar caché o mover el sitio a una red de distribución.");
  }
  if (!a.title || a.title.length < 10) {
    push("alto", "Google no sabe cómo se llama tu sitio",
      a.title ? "El título es «" + a.title + "», demasiado corto para decir qué hacés y dónde." : "La página no tiene título. Es el renglón azul que Google muestra en los resultados.",
      "Escribir un título de 50-60 caracteres con qué hacés y en qué zona.");
  }
  if (!a.desc) {
    push("medio", "Falta el texto que Google muestra abajo del título",
      "Sin descripción, Google inventa un fragmento agarrando cualquier texto suelto de la página. Suele quedar feo y no invita a entrar.",
      "Escribir una descripción de 150 caracteres, como un aviso corto.");
  }
  if (a.h1 === 0) {
    push("medio", "La página no tiene un título principal",
      "Falta el encabezado que le dice a Google de qué se trata la página.",
      "Poner un h1 con lo que hacés.");
  } else if (a.h1 > 3) {
    push("bajo", "Hay " + a.h1 + " títulos principales compitiendo",
      "Cuando todo es el título principal, ninguno lo es, y Google no sabe con cuál quedarse.",
      "Dejar un solo h1 por página.");
  }
  if (!a.og) {
    push("medio", "Cuando comparten tu link por WhatsApp no se ve nada",
      "No hay imagen de vista previa configurada. El link llega como texto pelado, sin foto ni descripción, y se toca mucho menos.",
      "Agregar las etiquetas Open Graph con una imagen de 1200x630.");
  }
  if (!a.favicon) {
    push("bajo", "Falta el iconito de la pestaña",
      "Sin favicon, el navegador muestra una hoja gris genérica. Es un detalle, pero es de los que se notan.",
      "Agregar un favicon.");
  }
  if (!a.lang) {
    push("bajo", "La página no declara que está en español",
      "Sin eso, el navegador ofrece traducir un sitio que ya está en español, y los lectores de pantalla lo pronuncian en inglés.",
      'Poner lang="es" en la etiqueta html.');
  }
  const orden = { alto: 0, medio: 1, bajo: 2 };
  return h.sort((x, y) => orden[x.sev] - orden[y.sev]);
}

async function handleAuditoria(request, env, ctx) {
  const db = env.portafolio_db;
  let data;
  try { data = await request.json(); } catch (e) { return json({ error: "bad_json" }, 400); }

  if (db) {
    const rate = await allowRate(db, ipOf(request), "auditoria");
    if (!rate.ok) {
      return json({ error: "rate_limited", retry_after: rate.retry,
        mensaje: "Esperá unos minutos: ya miré varios sitios desde acá." }, 429, { "retry-after": String(rate.retry) });
    }
  }

  const v = audUrl(data.url);
  if (v.error) return json({ error: "url_invalida", mensaje: v.error }, 400);

  let a;
  try { a = await audAnalizar(v.url); }
  catch (e) { return json({ error: "fallo", mensaje: "Algo salió mal mirando ese sitio. Probá de nuevo en un rato." }, 502); }
  if (a.error) return json({ error: "no_alcanzable", mensaje: a.error }, 422);

  const hallazgos = audHallazgos(a);
  const seVan = audSeVan(a.segundos);
  // El evento va sin la URL auditada: interesa cuanta gente usa la herramienta,
  // no que sitio miro cada uno.
  if (db) ctx.waitUntil(db.prepare("INSERT INTO events (name, path, lang) VALUES ('aud:run', '/auditoria', 'es')").run().catch(() => {}));

  return json({ ok: true, dominio: new URL(a.url).hostname.replace(/^www\./, ""), url: a.url,
    segundos: a.segundos, seVan, ttfb: a.ttfb, bytes: a.bytes, peso: audKB(a.bytes.transfer),
    requests: a.requests, sinPeso: a.sinPeso, parcial: a.parcial, muestra: a.muestra, imgs: a.imgs,
    grandes: a.grandes.map((g) => ({ nombre: decodeURIComponent(new URL(g.u).pathname.split("/").pop() || "").slice(0, 60), peso: audKB(g.bytes) })),
    hallazgos });
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

    if (url.pathname === "/api/auditoria") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      const db = env.portafolio_db;
      if (db) sweepRates(db, ctx);
      return handleAuditoria(request, env, ctx);
    }

    if (url.pathname === "/api/contacto") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      return handleContacto(request, env, ctx);
    }

    // Reportes de visitas (compositor manual): las acciones van en el body
    // JSON, todas detras del PIN del panel. preview devuelve el HTML sin
    // enviar ni guardar; guardar/es enviar/lista/borrar tocan la tabla.
    if (url.pathname === "/api/reportes") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      const pin = request.headers.get("x-panel-pin") || "";
      if (!env.BOTTLE_PIN || !safeEqual(pin, env.BOTTLE_PIN))
        return json({ error: "forbidden" }, 403);
      const db = env.portafolio_db;
      if (!db) return json({ error: "db_unavailable" }, 503);

      let data;
      try {
        data = await request.json();
      } catch {
        return json({ error: "bad_request" }, 400);
      }

      try {
        switch (data.accion) {
          case "preview":
            return new Response(componerHTML(data.datos), {
              headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
            });
          case "guardar":
            return json(await guardarReporte(db, data.datos, data.id));
          case "enviar":
            return json(await enviarReporte(env, db, data.id));
          case "lista":
            return json({ ok: true, reportes: await listarReportes(db) });
          case "borrar":
            return json(await borrarReporte(db, data.id));
          default:
            return json({ error: "unknown_action" }, 422);
        }
      } catch (err) {
        return json({ ok: false, motivo: err.message }, 500);
      }
    }

    const botella = await botellaRoute(request, env, ctx);
    if (botella) return botella;

    if (url.pathname === "/robots.txt") return text(ROBOTS_OK, "text/plain");
    if (url.pathname === "/llms.txt") return text(LLMS, "text/plain");
    if (url.pathname === "/sitemap.xml") return text(SITEMAP, "application/xml");

    return env.ASSETS.fetch(request);
  },
};
