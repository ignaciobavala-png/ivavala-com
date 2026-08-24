// Redirige HTTP -> HTTPS y www -> apex, sirve robots.txt / sitemap.xml,
// y mantiene fuera del indice cualquier hostname que no sea el canonico.
const CANONICAL = "ivavala.com";
const ORIGIN = "https://" + CANONICAL;

const ROBOTS_OK = `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
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

const json = (obj, status) =>
  new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" },
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

async function handleContacto(request, env) {
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

export default {
  async fetch(request, env) {
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

    if (proto !== "https" || url.hostname === "www." + CANONICAL) {
      url.protocol = "https:";
      url.hostname = CANONICAL;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/contacto") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      return handleContacto(request, env);
    }

    if (url.pathname === "/robots.txt") return text(ROBOTS_OK, "text/plain");
    if (url.pathname === "/sitemap.xml") return text(SITEMAP, "application/xml");

    return env.ASSETS.fetch(request);
  },
};
