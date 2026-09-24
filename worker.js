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
- ${ORIGIN}/proyectos/ — proyectos en produccion, filtrables por tipo
- ${ORIGIN}/link-whatsapp/ — herramienta gratis: link de WhatsApp con mensaje,
  QR y cartel para imprimir (normaliza numeros argentinos: 54 9, sin 0 ni 15)
- ${ORIGIN}/monitor-web/ — herramienta gratis: chequeo de web, SSL y dominio,
  con avisos por mail si se cae o esta por vencer
- ${ORIGIN}/en/proyectos/ — projects (english)
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
    <loc>${ORIGIN}/proyectos/</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}/proyectos/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/en/proyectos/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/proyectos/"/>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${ORIGIN}/link-whatsapp/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${ORIGIN}/monitor-web/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${ORIGIN}/en/proyectos/</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}/proyectos/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/en/proyectos/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/proyectos/"/>
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

// ── Resend ────────────────────────────────────────────────────────────────
// Por que hay dos caminos de mail y no uno: el binding de Cloudflare solo
// puede escribirle a la casilla verificada en wrangler.jsonc, asi que sirve
// para avisarme a mi y para nada mas. Resend escribe a cualquiera, que es lo
// que hace falta para contestarle a quien escribio.
//
// El aviso a mi sigue yendo por el binding a proposito: es el mail que no se
// puede perder, y no depende de una API key ajena que se puede vencer.
const ACUSE_FROM = "Ignacio Vavala <hola@ivavala.com>";
const ACUSE_REPLY = DEST;

async function enviarResend(env, { to, subject, text, replyTo, headers }) {
  // En local no hay key: el mail se imprime en la consola de wrangler dev y
  // el flujo sigue, asi se puede probar el monitor de punta a punta.
  if (!env.RESEND_API_KEY && env.ENV === "dev") {
    console.log(`[mail dev] para ${to} — ${subject}\n${text}`);
    return { id: "dev" };
  }
  if (!env.RESEND_API_KEY) throw new Error("falta RESEND_API_KEY");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    // reply_to va en snake_case: es la API HTTP, no el SDK de Node.
    body: JSON.stringify({
      from: ACUSE_FROM,
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(headers ? { headers } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

// El acuse que hoy no existe: el formulario promete respuesta en 24 horas
// habiles y despues no le llega nada a la persona hasta que contesto a mano.
function buildAcuse({ nombre, tipo, mensaje }) {
  return [
    `Hola ${nombre},`,
    "",
    "Recibí tu mensaje. Te respondo dentro de las 24 horas hábiles.",
    "",
    "Esto es lo que me llegó:",
    `  Necesitás: ${tipo}`,
    "",
    mensaje ? mensaje.split("\n").map((l) => "  " + l).join("\n") : "  (sin mensaje)",
    "",
    "Si es urgente, escribime por WhatsApp: https://wa.me/5491127343775",
    "",
    "Ignacio Vavala",
    "https://ivavala.com",
  ].join("\n");
}

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

  // El acuse al visitante va despues y aparte: si Resend falla, esta caido o
  // todavia no verifico el dominio, la consulta ya esta a salvo en mi casilla
  // y la persona ve el "listo" igual. Nunca puede tumbar el formulario.
  if (env.RESEND_API_KEY) {
    const acuse = enviarResend(env, {
      to: email,
      subject: "Recibí tu mensaje — Ignacio Vavala",
      text: buildAcuse({ nombre, tipo, mensaje }),
      replyTo: ACUSE_REPLY,
    }).catch((err) => console.error("acuse resend fallo:", err && err.message));
    if (ctx && ctx.waitUntil) ctx.waitUntil(acuse);
  }

  return json({ ok: true });
}

// ── la botella: mensajes a la deriva ─────────────────────────────────────
const MSG_MAX = 500;
const RATE = { throw: 5, fish: 8, admin: 5, ev: 80, contacto: 3, mon: 6, monsub: 3, montok: 30 }; // por IP cada 5 minutos

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
  "cta:hero", "cta:pill", "cta:nav", "cta:svcfoot", "cta:proyectos",
  "out:whatsapp", "out:mail", "out:github",
  "tool:wa:link", "tool:wa:copy", "tool:wa:snippet", "tool:wa:cartel", "tool:wa:qr",
  "tool:mon:check", "tool:mon:sub", "tool:mon:confirm", "tool:mon:off",
  "cta:tool",
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

// ── monitor de web, SSL y dominio (/monitor-web/) ────────────────────────
// Herramienta gratis: cualquiera carga su web y se lleva un chequeo al
// instante; si deja el mail y confirma, el cron la revisa cada 10 minutos y le
// avisa si se cae, si el certificado no se renovo o si el dominio esta por
// vencer. Los avisos salen por Resend (el binding solo me escribe a mi) con
// reply-to a mi casilla: el aviso es justo el momento en que esa persona
// necesita a alguien, y la respuesta me llega a mi.
const MON_MAX_PER_EMAIL = 5;
const MON_UA = "Mozilla/5.0 (compatible; ivavala-monitor/1.0; +https://ivavala.com/monitor-web/)";
const TZ = "America/Argentina/Buenos_Aires";
const SSL_LEVELS = [7, 3, 1];     // dias antes de vencer en que se avisa
const DOMAIN_LEVELS = [30, 7, 1];

const baseOf = (env) => (env.ENV === "dev" ? "http://localhost:8787" : ORIGIN);
const newToken = () => crypto.randomUUID().replace(/-/g, "");
// D1 guarda datetime('now') como "YYYY-MM-DD HH:MM:SS" en UTC.
const sqlToIso = (s) => (s ? String(s).replace(" ", "T") + "Z" : null);
const daysUntil = (iso) => Math.floor((Date.parse(iso) - Date.now()) / 86400000);
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
const fmtTime = (iso) =>
  new Date(iso).toLocaleString("es-AR", { timeZone: TZ, day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

// Solo webs publicas por nombre: nada de IPs, puertos ni nombres internos.
// Un Worker no llega a redes privadas igual, pero no hay por que intentarlo.
function normUrl(raw) {
  let v = String(raw || "").trim().slice(0, 300);
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  let u;
  try { u = new URL(v); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password || u.port) return null;
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || host.length > 253 || !/^[a-z0-9.-]+$/.test(host)) return null;
  if (/^[\d.]+$/.test(host)) return null;
  if (/(^|\.)(localhost|local|internal|lan|home|test|invalid|example)$/.test(host)) return null;
  return { url: u.protocol + "//" + host + (u.pathname || "/"), host };
}

// El dominio que se renueva, no el host: "www.estudio.com.ar" -> "estudio.com.ar".
// Sin lista de sufijos publicos completa; alcanza para los ccTLD con segundo
// nivel (com.ar, gob.ar, co.uk...) que son los que aparecen aca.
const SLD = new Set(["com", "net", "org", "gob", "gov", "edu", "co", "ac", "mil", "int", "nom", "tur", "info", "coop", "or", "ne", "go"]);
function registrable(host) {
  const p = host.split(".");
  if (p.length >= 3 && p[p.length - 1].length === 2 && SLD.has(p[p.length - 2])) return p.slice(-3).join(".");
  return p.slice(-2).join(".");
}

// GET y no HEAD: hay servidores que contestan mal a HEAD y darian una caida
// falsa. El cuerpo se descarta sin leerlo.
async function probe(url) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": MON_UA, accept: "text/html,*/*" },
      signal: AbortSignal.timeout(10000),
    });
    const ms = Date.now() - t0;
    try { if (res.body) await res.body.cancel(); } catch {}
    const code = res.status;
    // 401/403/429: el servidor esta vivo y filtra bots. No es una caida, y
    // avisar "tu web se cayo" por un firewall seria mentirle a la persona.
    const blocked = code === 401 || code === 403 || code === 429;
    return { up: code < 400 || blocked, code, ms, blocked, error: null };
  } catch (err) {
    const timeout = err && (err.name === "TimeoutError" || err.name === "AbortError");
    return {
      up: false, code: null, ms: Date.now() - t0, blocked: false,
      error: timeout ? "no respondió en 10 segundos" : "no se pudo conectar (DNS, certificado o servidor apagado)",
    };
  }
}

// El Worker no puede leer el certificado de una conexion, asi que el
// vencimiento sale de Certificate Transparency: todo certificado publico queda
// registrado ahi. Se toma el mas lejano de los vigentes. Limite conocido: si
// se emitio uno nuevo pero no se instalo, esto lo da por renovado; el caso
// comun (la renovacion automatica dejo de andar) si lo detecta.
async function sslExpiry(host, env) {
  const headers = { "user-agent": MON_UA };
  if (env.CERTSPOTTER_KEY) headers.authorization = `Bearer ${env.CERTSPOTTER_KEY}`;
  const res = await fetch(
    `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(host)}&match_wildcards=true`,
    { headers, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error("certspotter " + res.status);
  const list = await res.json();
  const now = Date.now();
  let best = null;
  for (const c of Array.isArray(list) ? list : []) {
    if (c.revoked || Date.parse(c.not_before) > now) continue;
    if (!best || Date.parse(c.not_after) > Date.parse(best)) best = c.not_after;
  }
  return best;
}

// RDAP es el reemplazo estructurado de whois; rdap.org redirige al registro de
// cada TLD. Algunos registros (NIC Argentina, a veces) no contestan: se tira
// error y la ficha dice "no disponible" en vez de inventar una fecha.
async function domainExpiry(domain) {
  const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: { accept: "application/rdap+json, application/json", "user-agent": MON_UA },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("rdap " + res.status);
  const data = await res.json();
  const ev = (data.events || []).find((e) => e.eventAction === "expiration");
  let registrar = null;
  for (const e of data.entities || []) {
    if (!(e.roles || []).includes("registrar")) continue;
    const fn = (((e.vcardArray || [])[1]) || []).find((x) => x[0] === "fn");
    if (fn) registrar = oneLine(fn[3], 80);
  }
  return { expires: ev && ev.eventDate ? ev.eventDate : null, registrar };
}

async function fullCheck(u, env) {
  const domain = registrable(u.host);
  const https = u.url.startsWith("https:");
  const [web, ssl, dom] = await Promise.allSettled([
    probe(u.url),
    https ? sslExpiry(u.host, env) : Promise.resolve(null),
    domainExpiry(domain),
  ]);
  return {
    url: u.url,
    host: u.host,
    domain,
    web: web.value,
    ssl: ssl.status === "fulfilled"
      ? { https, expires: ssl.value, days: ssl.value ? daysUntil(ssl.value) : null }
      : { https, error: true },
    dominio: dom.status === "fulfilled"
      ? { expires: dom.value.expires, days: dom.value.expires ? daysUntil(dom.value.expires) : null, registrar: dom.value.registrar }
      : { error: true },
  };
}

// Umbral alcanzado: 10 dias con [30,7,1] -> 30; 5 -> 7; vencido -> 0.
// null = todavia lejos, y ahi se resetea lo avisado (hubo renovacion).
function levelOf(days, levels) {
  if (days > levels[0]) return null;
  if (days <= 0) return 0;
  let l = levels[0];
  for (const t of levels) if (days <= t) l = t;
  return l;
}

// ── mails del monitor ──
function monFooter(m, base) {
  return [
    "",
    "—",
    "Ignacio Vavala · desarrollo web · https://ivavala.com",
    `Estado de tu monitor: ${base}/monitor-web/?t=${m.token}`,
    `Dejar de recibir avisos: ${base}/monitor-web/?t=${m.token}&baja=1`,
  ];
}

async function monMail(env, m, subject, lines) {
  const base = baseOf(env);
  return enviarResend(env, {
    to: m.email,
    subject,
    text: [...lines, ...monFooter(m, base)].join("\n"),
    replyTo: DEST,
    headers: {
      "List-Unsubscribe": `<${base}/api/monitor/off?t=${m.token}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

// Aviso interno por el binding: el que no se puede perder y no depende de Resend.
async function notifyMe(env, subject, body) {
  if (!env.SEND_EMAIL) return;
  try {
    const { EmailMessage } = await import("cloudflare:email");
    const raw = [
      `From: ${header("Monitor ivavala.com")} <${FROM}>`,
      `To: <${DEST}>`,
      `Subject: ${header(subject)}`,
      `Message-ID: <${crypto.randomUUID()}@ivavala.com>`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      b64(body).replace(/(.{76})/g, "$1\r\n"),
    ].join("\r\n");
    await env.SEND_EMAIL.send(new EmailMessage(FROM, DEST, raw));
  } catch (err) {
    console.error("aviso interno fallo:", err && err.message);
  }
}

// Una revision de la web aplicada a la fila, con la logica de avisos: se
// avisa a la segunda falla seguida (una sola puede ser un corte de red en el
// medio) y una sola vez por caida; cuando vuelve, se avisa que volvio.
async function applyProbe(env, m, r) {
  const db = env.portafolio_db;
  if (r.up) {
    await db
      .prepare(
        `UPDATE monitors SET up = 1, last_code = ?, last_ms = ?, last_error = NULL, last_check = datetime('now'),
           fails = 0, down_since = NULL, alerted_down = 0 WHERE id = ?`
      )
      .bind(r.code, r.ms, m.id)
      .run();
    if (m.alerted_down) {
      const since = Date.parse(sqlToIso(m.down_since));
      const mins = since ? Math.max(1, Math.round((Date.now() - since) / 60000)) : null;
      const dur = mins === null ? "" : mins < 2 ? " Estuvo caída cerca de un minuto." : mins < 90 ? ` Estuvo caída unos ${mins} minutos.` : ` Estuvo caída unas ${Math.round(mins / 60)} horas.`;
      await monMail(env, m, `${m.host} volvió a funcionar`, [
        "Hola,",
        "",
        `${m.url} volvió a responder.${dur}`,
        "",
        "Si se cae seguido, vale la pena mirar el hosting: respondé este mail y lo revisamos juntos.",
      ]).catch((err) => console.error("mail volvio fallo:", err && err.message));
    }
    return;
  }

  const fails = (m.fails || 0) + 1;
  let alerted = m.alerted_down ? 1 : 0;
  if (fails >= 2 && !alerted) {
    const since = sqlToIso(m.down_since) || new Date().toISOString();
    const why = r.error || `respondió con error ${r.code}`;
    try {
      await monMail(env, m, `${m.host} no está respondiendo`, [
        "Hola,",
        "",
        `${m.url} no responde desde las ${fmtTime(since)} (hora de Argentina).`,
        `La revisé dos veces seguidas y las dos falló: ${why}.`,
        "",
        "Lo más común:",
        "- El hosting venció o quedó impago.",
        "- El dominio venció o alguien tocó el DNS.",
        "- El servidor se cayó (a veces vuelve solo en unos minutos).",
        "",
        "Te aviso apenas vuelva.",
        "",
        "Si necesitás una mano para resolverlo, respondé este mail y lo vemos.",
      ]);
      alerted = 1;
      notifyMe(env, `Monitor: se cayó ${m.host}`, `${m.url}\n${why}\nDueño: ${m.email}\nDesde: ${fmtTime(since)}`);
    } catch (err) {
      // Sin marcar como avisada: el proximo cron lo vuelve a intentar.
      console.error("mail caida fallo:", err && err.message);
    }
  }
  await db
    .prepare(
      `UPDATE monitors SET up = 0, last_code = ?, last_ms = ?, last_error = ?, last_check = datetime('now'),
         fails = ?, down_since = COALESCE(down_since, datetime('now')), alerted_down = ? WHERE id = ?`
    )
    .bind(r.code, r.ms, r.error, fails, alerted, m.id)
    .run();
}

async function checkExpiries(env, m) {
  const https = m.url.startsWith("https:");
  const [ssl, dom] = await Promise.allSettled([
    https ? sslExpiry(m.host, env) : Promise.resolve(null),
    domainExpiry(registrable(m.host)),
  ]);
  // Si la consulta fallo se conserva el dato anterior y se reintenta en una
  // hora, en vez de esperar al dia siguiente.
  const failed = ssl.status === "rejected" || dom.status === "rejected";
  const sslExp = ssl.status === "fulfilled" ? ssl.value : m.ssl_expires;
  const domExp = dom.status === "fulfilled" ? dom.value.expires : m.domain_expires;
  const registrar = dom.status === "fulfilled" ? dom.value.registrar : null;
  let sslWarned = m.ssl_warned, domWarned = m.domain_warned;

  if (sslExp) {
    const d = daysUntil(sslExp);
    const lvl = levelOf(d, SSL_LEVELS);
    if (lvl === null) sslWarned = null;
    else if (sslWarned === null || lvl < sslWarned) {
      const ok = await monMail(env, m, d <= 0 ? `El certificado SSL de ${m.host} venció` : `El certificado SSL de ${m.host} vence en ${d} ${d === 1 ? "día" : "días"}`, [
        "Hola,",
        "",
        d <= 0
          ? `El certificado de seguridad (el candado) de ${m.host} venció el ${fmtDate(sslExp)}.`
          : `El certificado de seguridad (el candado) de ${m.host} vence el ${fmtDate(sslExp)}.`,
        "",
        "Cuando vence, el navegador muestra \"la conexión no es segura\" y casi todos se van sin entrar.",
        "Los certificados gratuitos se renuevan solos varias semanas antes de vencer: si a esta altura no se renovó, lo más probable es que la renovación automática esté fallando.",
        "",
        "Si no sabés quién lo maneja, respondé este mail y te digo por dónde empezar.",
      ]).then(() => true, (err) => { console.error("mail ssl fallo:", err && err.message); return false; });
      if (ok) sslWarned = lvl;
    }
  }

  if (domExp) {
    const d = daysUntil(domExp);
    const lvl = levelOf(d, DOMAIN_LEVELS);
    const dom2 = registrable(m.host);
    if (lvl === null) domWarned = null;
    else if (domWarned === null || lvl < domWarned) {
      const ok = await monMail(env, m, d <= 0 ? `El dominio ${dom2} venció` : `El dominio ${dom2} vence en ${d} ${d === 1 ? "día" : "días"}`, [
        "Hola,",
        "",
        d <= 0
          ? `El dominio ${dom2} venció el ${fmtDate(domExp)}.`
          : `El dominio ${dom2} vence el ${fmtDate(domExp)}.`,
        registrar ? `Se renueva en ${registrar}, con la cuenta con la que se registró.` : "Se renueva donde se registró, con esa misma cuenta.",
        "",
        "Si vence, dejan de andar la web y también los mails con ese dominio. Y pasado un tiempo, cualquiera lo puede registrar.",
        "",
        "¿No sabés con qué cuenta se registró? Respondé este mail y lo averiguamos.",
      ]).then(() => true, (err) => { console.error("mail dominio fallo:", err && err.message); return false; });
      if (ok) domWarned = lvl;
    }
  }

  await env.portafolio_db
    .prepare(
      `UPDATE monitors SET ssl_expires = ?, domain_expires = ?, ssl_warned = ?, domain_warned = ?,
         exp_checked = datetime('now', ?) WHERE id = ?`
    )
    .bind(sslExp, domExp, sslWarned, domWarned, failed ? "-23 hours" : "+0 seconds", m.id)
    .run();
}

// Cada 5 minutos. Topes por corrida para no pasar los subrequests del plan:
// 20 webs + 4 chequeos de vencimiento (2-3 pedidos cada uno) + los mails.
async function monitorCron(env) {
  const db = env.portafolio_db;
  if (!db) return;
  const due = await db
    .prepare(
      `SELECT * FROM monitors WHERE status = 'active' AND (
         last_check IS NULL OR last_check <= datetime('now', '-10 minutes')
         OR (fails > 0 AND last_check <= datetime('now', '-4 minutes'))
       ) ORDER BY last_check ASC LIMIT 20`
    )
    .all();
  await Promise.allSettled(due.results.map(async (m) => applyProbe(env, m, await probe(m.url))));

  const exp = await db
    .prepare(
      `SELECT * FROM monitors WHERE status = 'active' AND (exp_checked IS NULL OR exp_checked <= datetime('now', '-1 day'))
       ORDER BY exp_checked ASC LIMIT 4`
    )
    .all();
  await Promise.allSettled(exp.results.map((m) => checkExpiries(env, m)));

  // Altas que nunca se confirmaron: a la semana se borran.
  await db.prepare("DELETE FROM monitors WHERE status = 'pending' AND created_at <= datetime('now', '-7 days')").run();
}

// ── endpoints ──
const maskEmail = (e) => {
  const [u, d] = String(e).split("@");
  return (u.length <= 2 ? u[0] : u.slice(0, 2)) + "•••@" + d;
};

function monPublic(m) {
  return {
    url: m.url,
    host: m.host,
    domain: registrable(m.host),
    email: maskEmail(m.email),
    status: m.status,
    since: sqlToIso(m.confirmed_at),
    web: m.last_check
      ? { up: !!m.up, code: m.last_code, ms: m.last_ms, error: m.last_error, checked: sqlToIso(m.last_check), down_since: sqlToIso(m.down_since) }
      : null,
    ssl: m.ssl_expires ? { expires: m.ssl_expires, days: daysUntil(m.ssl_expires) } : null,
    dominio: m.domain_expires ? { expires: m.domain_expires, days: daysUntil(m.domain_expires) } : null,
    exp_checked: sqlToIso(m.exp_checked),
  };
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function monitorRoute(request, env, ctx) {
  const url = new URL(request.url);
  const db = env.portafolio_db;
  if (!db) return json({ error: "db_unavailable" }, 503);
  sweepRates(db, ctx);
  const ip = ipOf(request);
  const path = url.pathname.replace(/\/$/, "");

  // Chequeo al instante, sin mail. Turnstile porque cada uno dispara tres
  // pedidos afuera, y Cert Spotter tiene cupo por hora.
  if (path === "/api/monitor/check") {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const data = await readJson(request);
    if (!data) return json({ error: "bad_request" }, 400);
    const u = normUrl(data.url);
    if (!u) return json({ error: "url" }, 422);
    const rate = await allowRate(db, ip, "mon");
    if (!rate.ok) return rateLimited(rate);
    if (!(await turnstileOk(data.turnstile, ip, env))) return json({ error: "captcha" }, 403);
    return json(await fullCheck(u, env));
  }

  // Alta: queda pendiente hasta que confirme desde el mail. La respuesta es
  // la misma exista o no el monitor, para no contar que mails estan cargados.
  if (path === "/api/monitor" && request.method === "POST") {
    const data = await readJson(request);
    if (!data) return json({ error: "bad_request" }, 400);
    if (oneLine(data.empresa, 200)) return json({ ok: true });
    const u = normUrl(data.url);
    const email = oneLine(data.email, 150).toLowerCase();
    if (!u) return json({ error: "url" }, 422);
    if (!isEmail(email)) return json({ error: "email" }, 422);
    const rate = await allowRate(db, ip, "monsub");
    if (!rate.ok) return rateLimited(rate);
    if (!(await turnstileOk(data.turnstile, ip, env))) return json({ error: "captcha" }, 403);

    const row = await db.prepare("SELECT id, token, status FROM monitors WHERE email = ? AND url = ?").bind(email, u.url).first();
    if (!row || row.status === "off") {
      const n = await db.prepare("SELECT COUNT(*) AS n FROM monitors WHERE email = ? AND status != 'off'").bind(email).first();
      if (n && n.n >= MON_MAX_PER_EMAIL) return json({ error: "limit" }, 422);
    }
    let token = row ? row.token : newToken();
    if (!row) {
      await db.prepare("INSERT INTO monitors (url, host, email, token) VALUES (?, ?, ?, ?)").bind(u.url, u.host, email, token).run();
    } else if (row.status === "off") {
      // Token nuevo: los links de baja viejos no tienen que servir para la alta nueva.
      token = newToken();
      await db.prepare("UPDATE monitors SET status = 'pending', token = ?, confirmed_at = NULL, created_at = datetime('now') WHERE id = ?").bind(token, row.id).run();
    }
    const m = { email, token, url: u.url, host: u.host };
    const base = baseOf(env);
    const lines = row && row.status === "active"
      ? ["Hola,", "", `${u.url} ya está en el monitor y la sigo revisando.`, "", `Mirá cómo está acá: ${base}/monitor-web/?t=${token}`]
      : [
          "Hola,",
          "",
          `Pediste que vigile ${u.url}.`,
          "Para activarlo, entrá a este link y apretá \"Confirmar\":",
          "",
          `${base}/monitor-web/?t=${token}&confirmar=1`,
          "",
          "Desde ahí la reviso cada 10 minutos y te escribo solo si algo falla: si se cae, si el certificado SSL no se renovó o si el dominio está por vencer.",
          "",
          "Si no fuiste vos, ignorá este mail: sin confirmar no te llega nada más.",
        ];
    try {
      await monMail(env, m, row && row.status === "active" ? `${u.host} ya está en el monitor` : `Confirmá el monitor de ${u.host}`, lines);
    } catch (err) {
      console.error("mail confirmacion fallo:", err && err.message);
      return json({ error: "send_failed" }, 502);
    }
    return json({ ok: true });
  }

  // Lo que sigue se abre con el token del mail, que viaja siempre en la URL.
  const t = oneLine(url.searchParams.get("t"), 64);
  if (!/^[a-f0-9]{32}$/.test(t)) return json({ error: "not_found" }, 404);
  const rate = await allowRate(db, ip, "montok");
  if (!rate.ok) return rateLimited(rate);
  const m = await db.prepare("SELECT * FROM monitors WHERE token = ?").bind(t).first();
  if (!m) return json({ error: "not_found" }, 404);

  if (path === "/api/monitor" && request.method === "GET") return json(monPublic(m));

  if (path === "/api/monitor/confirm" && request.method === "POST") {
    if (m.status === "off") return json({ error: "off" }, 409);
    if (m.status === "pending") {
      await db.prepare("UPDATE monitors SET status = 'active', confirmed_at = datetime('now') WHERE id = ?").bind(m.id).run();
      // Primera revision ya, asi la ficha no arranca vacia. Los vencimientos
      // van en segundo plano: son dos consultas lentas.
      await applyProbe(env, { ...m, status: "active" }, await probe(m.url));
      ctx.waitUntil(checkExpiries(env, m).catch((err) => console.error("vencimientos fallo:", err && err.message)));
      ctx.waitUntil(notifyMe(env, `Monitor nuevo: ${m.host}`, `${m.url}\n${m.email}\n\nAlguien confirmó el monitor gratis de /monitor-web/.`));
    }
    const fresh = await db.prepare("SELECT * FROM monitors WHERE id = ?").bind(m.id).first();
    return json(monPublic(fresh));
  }

  // Baja: desde la ficha o desde el boton "desuscribirse" del cliente de mail
  // (List-Unsubscribe-Post manda un POST con el token en la URL).
  if (path === "/api/monitor/off" && request.method === "POST") {
    await db.prepare("UPDATE monitors SET status = 'off' WHERE id = ?").bind(m.id).run();
    return json({ ok: true });
  }

  return json({ error: "method_not_allowed" }, 405);
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(monitorCron(env));
  },

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

    if (url.pathname === "/api/monitor" || url.pathname.startsWith("/api/monitor/")) {
      return monitorRoute(request, env, ctx);
    }

    const botella = await botellaRoute(request, env, ctx);
    if (botella) return botella;

    if (url.pathname === "/robots.txt") return text(ROBOTS_OK, "text/plain");
    if (url.pathname === "/llms.txt") return text(LLMS, "text/plain");
    if (url.pathname === "/sitemap.xml") return text(SITEMAP, "application/xml");

    return env.ASSETS.fetch(request);
  },
};
