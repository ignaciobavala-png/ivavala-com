// reportes.js — informe de visitas enviado por correo.
// v1: cubre el propio ivavala.com con los datos del embudo ya medidos en D1
// (tabla `events`, sin cookies ni IP). El cron del Worker lo dispara el primer
// dia de cada mes; tambien se puede correr a mano con /api/reportes.
//
// Para sumar un sitio de cliente: agregar su entrada a SITES y que el beacon
// de ese sitio escriba en la misma tabla `events` (con una columna `site` o en
// una D1 a la que este Worker tambien tenga binding). El generador es el mismo.

const SITES = [
  {
    slug: "ivavala",
    nombre: "ivavala.com",
    url: "https://ivavala.com",
    to: ["ignaciobavala@gmail.com"],
  },
];

// Nombres de paises para los que el reporte no muestra el codigo pelado.
const PAISES = {
  AR: "Argentina", BO: "Bolivia", BR: "Brasil", CA: "Canadá", CL: "Chile",
  CO: "Colombia", CR: "Costa Rica", DE: "Alemania", DO: "Rep. Dominicana",
  EC: "Ecuador", ES: "España", FR: "Francia", GB: "Reino Unido", IT: "Italia",
  MX: "México", PA: "Panamá", PE: "Perú", PT: "Portugal", PY: "Paraguay",
  US: "Estados Unidos", UY: "Uruguay", VE: "Venezuela",
};
const pais = (code) => {
  const c = String(code || "").toUpperCase();
  return c && PAISES[c] ? PAISES[c] : c || null;
};

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const fechaEs = (d) => `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;

function periodo(days, now = new Date()) {
  const desde = new Date(now.getTime() - days * 86400000);
  return {
    key: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`,
    label: `${fechaEs(desde)} → ${fechaEs(now)}`,
    desdeISO: desde.toISOString().slice(0, 10),
  };
}

// ── armado del HTML del mail ─────────────────────────────────────────────
// Reglas de mail (ver skill react-email-resend): solo flujo vertical, estilos
// inline, tablas, sin position absolute, max-width 600. Texto real, no imagen.

function kpi(rotulo, valor, sub) {
  return (
    `<td align="center" valign="top" style="padding:16px 10px;border:1px solid #e3c37d;border-radius:10px;background:#ffffff">` +
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.4;text-transform:uppercase;letter-spacing:.1em;color:#755c21;margin:0 0 4px">${esc(rotulo)}</div>` +
      `<div style="font-family:Georgia,serif;font-size:26px;line-height:1.2;font-weight:600;color:#020c41;margin:0">${esc(valor)}</div>` +
      (sub ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.4;color:#5a6072;margin:3px 0 0">${esc(sub)}</div>` : "") +
    `</td>`
  );
}

function filaFunnel(nombre, valor, conversion) {
  return (
    `<tr>` +
      `<td style="padding:10px 6px;border-bottom:1px solid #efe6d4;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#020c41">${esc(nombre)}</td>` +
      `<td align="right" style="padding:10px 6px;border-bottom:1px solid #efe6d4;font-family:Georgia,serif;font-size:15px;font-weight:600;color:#020c41">${valor}</td>` +
      `<td align="right" style="padding:10px 6px;border-bottom:1px solid #efe6d4;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#755c21">${conversion}%</td>` +
    `</tr>`
  );
}

function filaOrigen(host, n) {
  return (
    `<tr>` +
      `<td style="padding:7px 6px;border-bottom:1px solid #efe6d4;font-family:monospace;font-size:13px;color:#026fab">${esc(host)}</td>` +
      `<td align="right" style="padding:7px 6px;border-bottom:1px solid #efe6d4;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#020c41">${n}</td>` +
    `</tr>`
  );
}

function buildHtml({ nombre, url, periodo, data }) {
  const embudo = data.embudo;
  const salidas = embudo.salidas;
  const conversion = pct(embudo.escribio, embudo.views);

  const refs =
    data.refs.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 4px">${data.refs.map((r) => filaOrigen(r.ref, r.n)).join("")}</table>`
      : `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5a6072;margin:8px 0">Sin referidos externos en el período.</p>`;

  const paises =
    data.paises.length > 0
      ? data.paises.map((c) => `${pais(c.country) || c.country} (${c.n})`).join(" · ")
      : "Sin datos";

  const filasFunnel = [
    ["Visitas totales (home)", embudo.views, "100"],
    ["Abrieron Trabajo", embudo.trabajo, pct(embudo.trabajo, embudo.views)],
    ["Llegaron a Contacto", embudo.contacto, pct(embudo.contacto, embudo.views)],
    ["Escribieron (form)", embudo.escribio, conversion],
    ["Salidas a WhatsApp / mail", salidas, pct(salidas, embudo.views)],
  ];

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff6eb">` +
      `<tr><td align="center" style="padding:24px 12px">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff6eb">` +

          // ── cabecera ──
          `<tr><td style="padding:28px 24px 6px">` +
            `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.18em;color:#b3964b;margin:0 0 6px">Informe de visitas</div>` +
            `<div style="font-family:Georgia,serif;font-size:28px;line-height:1.15;font-weight:600;color:#020c41;margin:0">${esc(nombre)}</div>` +
            `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5a6072;margin:6px 0 0">${esc(periodo)}</div>` +
          `</td></tr>` +

          // ── KPIs ──
          `<tr><td style="padding:18px 24px 4px">` +
            `<table width="100%" cellpadding="0" cellspacing="0">` +
              `<tr>${kpi("Visitas", embudo.views)}` +
              `${kpi("Escribieron", embudo.escribio, conversion + "% de conversión")}` +
              `${kpi("Salidas a WhatsApp", salidas)}</tr>` +
            `</table>` +
          `</td></tr>` +

          // ── embudo ──
          `<tr><td style="padding:16px 24px 0">` +
            `<div style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#020c41;margin:0 0 4px">El recorrido</div>` +
            `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5a6072;margin:0 0 8px">Cuántas personas llegaron hasta cada paso, sobre el total de visitas.</div>` +
            `<table width="100%" cellpadding="0" cellspacing="0">` +
              `<tr>` +
                `<td style="padding:8px 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#755c21;border-bottom:2px solid #b3964b">Paso</td>` +
                `<td align="right" style="padding:8px 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#755c21;border-bottom:2px solid #b3964b">Visitas</td>` +
                `<td align="right" style="padding:8px 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#755c21;border-bottom:2px solid #b3964b">% del total</td>` +
              `</tr>` +
              filasFunnel.map((f) => filaFunnel(...f)).join("") +
            `</table>` +
          `</td></tr>` +

          // ── origen ──
          `<tr><td style="padding:18px 24px 0">` +
            `<div style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#020c41;margin:0 0 4px">De dónde llega la gente</div>` +
            `${refs}` +
            `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5a6072;margin:10px 0 0"><strong style="color:#020c41">Países:</strong> ${esc(paises)}</p>` +
          `</td></tr>` +

          // ── pie ──
          `<tr><td style="padding:22px 24px 26px">` +
            `<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#5a6072;margin:0;border-top:1px solid #e3c37d;padding-top:14px">` +
              `Generado automáticamente por el Worker de ${esc(nombre)}. Los números salen de analíticas propias, sin cookies ni datos personales. ` +
              `<a href="${esc(url)}" style="color:#026fab;text-decoration:none">Ver el sitio</a> · ` +
              `Responde a este correo si querés más detalle o cambios.` +
            `</p>` +
          `</td></tr>` +
        `</table>` +
      `</td></tr>` +
    `</table>`
  );
}

// ── agregación desde D1 ───────────────────────────────────────────────────
async function agregar(db, since) {
  const [totales, refs, paises] = await Promise.all([
    db
      .prepare(`SELECT name, COUNT(*) AS n FROM events WHERE created_at >= datetime('now', ?) GROUP BY name`)
      .bind(since)
      .all(),
    db
      .prepare(
        `SELECT ref, COUNT(*) AS n FROM events
         WHERE name = 'view' AND ref IS NOT NULL AND created_at >= datetime('now', ?)
         GROUP BY ref ORDER BY n DESC LIMIT 8`
      )
      .bind(since)
      .all(),
    db
      .prepare(
        `SELECT country, COUNT(*) AS n FROM events
         WHERE name = 'view' AND country IS NOT NULL AND created_at >= datetime('now', ?)
         GROUP BY country ORDER BY n DESC LIMIT 8`
      )
      .bind(since)
      .all(),
  ]);

  const by = {};
  for (const r of totales.results) by[r.name] = r.n;

  return {
    embudo: {
      views: by["view"] || 0,
      trabajo: by["sec:trabajo"] || 0,
      contacto: by["sec:contacto"] || 0,
      escribio: by["form:ok"] || 0,
      salidas: (by["out:whatsapp"] || 0) + (by["out:mail"] || 0),
    },
    refs: refs.results,
    paises: paises.results,
  };
}

// ── envío por Resend (o fallback al binding send_email) ───────────────────
async function enviar(env, site, subject, html) {
  if (env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: "Informes ivavala.com <reportes@ivavala.com>",
        to: site.to,
        subject,
        html,
        reply_to: "ignaciobavala@gmail.com",
      }),
    });
    const out = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, canal: "resend", detalle: `${res.status} ${(out && out.message) || ""}` };
    return { ok: true, canal: "resend", id: out && out.id };
  }

  // Fallback: el binding send_email de Cloudflare (gratis, ya configurado).
  if (env.SEND_EMAIL) {
    const { EmailMessage } = await import("cloudflare:email");
    const body = [
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      btoa(html).replace(/(.{76})/g, "$1\r\n"),
    ].join("\r\n");
    await env.SEND_EMAIL.send(
      new EmailMessage("reportes@ivavala.com", site.to, body)
    );
    return { ok: true, canal: "send_email" };
  }

  return { ok: false, canal: null, detalle: "sin RESEND_API_KEY ni binding send_email" };
}

// ── el trabajo del reporte ────────────────────────────────────────────────
// "preparar" separa el armado del envío: así la vista previa y el envío real
// comparten exactamente el mismo HTML (si divergen, la previa miente).

async function preparar(env, { days = 30 } = {}) {
  const db = env.portafolio_db;
  if (!db) throw new Error("sin base D1");

  const per = periodo(days);
  const site = SITES[0];
  const data = await agregar(db, `-${days} days`);

  const html = buildHtml({ nombre: site.nombre, url: site.url, periodo: per.label, data });
  const subject = `Informe de visitas · ${site.nombre} · ${per.label}`;

  return { site, per, data, html, subject };
}

// Vista previa: devuelve el HTML sin enviar ni tocar el log de idempotencia.
export async function previewReport(env, { days = 30 } = {}) {
  const { site, per, data, html, subject } = await preparar(env, { days });
  return { ok: true, preview: true, html, subject, period: per.label, to: site.to, resumen: data.embudo };
}

export async function runReport(env, ctx, { force = false, days = 30 } = {}) {
  const db = env.portafolio_db;
  if (!db) return { ok: false, motivo: "sin base D1" };

  const { site, per, data, html, subject } = await preparar(env, { days });

  const yaEnviado = await db
    .prepare("SELECT 1 FROM report_log WHERE site = ? AND period = ?")
    .bind(site.slug, per.key)
    .first();

  if (yaEnviado && !force)
    return { ok: false, motivo: "ya enviado este período (usar ?force=1 para reenviar)", period: per.key };

  const envio = await enviar(env, site, subject, html);
  if (!envio.ok) return { ok: false, motivo: `envío falló: ${envio.detalle || "desconocido"}`, period: per.key };

  if (envio.ok) {
    await db
      .prepare("INSERT INTO report_log (site, period, to_email) VALUES (?, ?, ?)")
      .bind(site.slug, per.key, site.to.join(", "))
      .run()
      .catch(() => {});
  }

  return {
    ok: true,
    canal: envio.canal,
    period: per.key,
    to: site.to,
    subject,
    resumen: data.embudo,
  };
}
