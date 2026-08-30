// reportes.js — compositor manual de informes de visitas.
// Los datos los carga Ignacio en /panel (sirven para cualquier hosting:
// Cloudflare, Vercel, GA...), se arma un mail con la identidad del estudio
// y se envia por Resend (fallback: binding send_email de Cloudflare).
// Sin cron: solo se manda lo que se compone y se envia a mano.

const FROM = "Informes ivavala.com <reportes@ivavala.com>";
const REPLY_TO = "ignaciobavala@gmail.com";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const fmt = (n) => String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const urlSegura = (u) => {
  try {
    const x = new URL(String(u || ""));
    return x.protocol === "http:" || x.protocol === "https:" ? x.toString() : null;
  } catch {
    return null;
  }
};

// Normaliza lo que llega del form. Nada confia en el tipo que manda el
// navegador: numeros, arrays y texto se limpian aca, una sola vez.
export function normalizarDatos(raw) {
  const d = raw || {};
  return {
    nombre: String(d.nombre || "").trim().slice(0, 120),
    url: String(d.url || "").trim().slice(0, 300),
    periodo: String(d.periodo || "").trim().slice(0, 80),
    para: String(d.para || "").trim().slice(0, 500),
    visitas: num(d.visitas),
    unicas: num(d.unicas),
    whatsapp: num(d.whatsapp),
    leads: num(d.leads),
    conversion: String(d.conversion || "").trim().slice(0, 40),
    fuentes: String(d.fuentes || "")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean),
    paises: String(d.paises || "").trim().slice(0, 300),
    nota: String(d.nota || "").trim().slice(0, 1000),
  };
}

// ── armado del mail ──────────────────────────────────────────────────────
// Reglas de mail (ver skill react-email-resend): tablas + estilos inline,
// sin position absolute, max-width 600, texto real. La previa y el envio
// comparten exactamente este HTML.

function kpi(rotulo, valor, sub) {
  return (
    `<td align="center" valign="top" style="padding:16px 10px;border:1px solid #e3c37d;border-radius:10px;background:#ffffff">` +
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.4;text-transform:uppercase;letter-spacing:.1em;color:#755c21;margin:0 0 4px">${esc(rotulo)}</div>` +
      `<div style="font-family:Georgia,serif;font-size:26px;line-height:1.2;font-weight:600;color:#020c41;margin:0">${esc(valor)}</div>` +
      (sub ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.4;color:#5a6072;margin:3px 0 0">${esc(sub)}</div>` : "") +
    `</td>`
  );
}

// El mail se arma solo con lo que hay: un campo vacio no dibuja su seccion.
export function componerHTML(d) {
  const datos = normalizarDatos(d);

  const kpis = [];
  if (datos.visitas != null) kpis.push(kpi("Visitas", fmt(datos.visitas)));
  if (datos.unicas != null) kpis.push(kpi("Visitas únicas", fmt(datos.unicas)));
  if (datos.whatsapp != null) kpis.push(kpi("WhatsApp", fmt(datos.whatsapp)));
  if (datos.leads != null) kpis.push(kpi("Mensajes", fmt(datos.leads)));
  if (datos.conversion) kpis.push(kpi("Conversión", datos.conversion));
  const kpiRow = kpis.length
    ? `<tr>${kpis.join("")}</tr>`
    : `<tr><td style="padding:14px;border:1px solid #e3c37d;border-radius:10px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5a6072">Sin métricas cargadas para este período.</td></tr>`;

  let origen = "";
  if (datos.fuentes.length || datos.paises) {
    origen =
      `<tr><td style="padding:18px 24px 0">` +
        `<div style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#020c41;margin:0 0 4px">De dónde llega la gente</div>` +
        (datos.fuentes.length
          ? `<ul style="margin:8px 0;padding:0 0 0 18px">${datos.fuentes
              .map(
                (f) =>
                  `<li style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#020c41;margin:0 0 4px">${esc(f)}</li>`
              )
              .join("")}</ul>`
          : "") +
        (datos.paises
          ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5a6072;margin:8px 0 0"><strong style="color:#020c41">Países:</strong> ${esc(datos.paises)}</p>`
          : "") +
      `</td></tr>`;
  }

  const nota = datos.nota
    ? `<tr><td style="padding:18px 24px 0">` +
        `<div style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#020c41;margin:0 0 6px">Nota</div>` +
        `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#020c41;background:#ffffff;border-left:3px solid #b3964b;border-radius:6px;padding:12px 14px;margin:0">${esc(datos.nota).replace(/\n/g, "<br/>")}</div>` +
      `</td></tr>`
    : "";

  const link = urlSegura(datos.url);
  const linkHtml = link
    ? `<a href="${esc(link)}" style="color:#026fab;text-decoration:none">Ver el sitio</a> · `
    : "";

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff6eb">` +
      `<tr><td align="center" style="padding:24px 12px">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff6eb">` +
          `<tr><td style="padding:28px 24px 6px">` +
            `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.18em;color:#b3964b;margin:0 0 6px">Informe de visitas</div>` +
            `<div style="font-family:Georgia,serif;font-size:28px;line-height:1.15;font-weight:600;color:#020c41;margin:0">${esc(datos.nombre)}</div>` +
            `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5a6072;margin:6px 0 0">${esc(datos.periodo)}</div>` +
          `</td></tr>` +
          `<tr><td style="padding:18px 24px 4px"><table width="100%" cellpadding="0" cellspacing="0">${kpiRow}</table></td></tr>` +
          origen +
          nota +
          `<tr><td style="padding:22px 24px 26px">` +
            `<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#5a6072;margin:0;border-top:1px solid #e3c37d;padding-top:14px">` +
              `Generado por tu equipo. ${linkHtml}Responde a este correo si querés más detalle o cambios.` +
            `</p>` +
          `</td></tr>` +
        `</table>` +
      `</td></tr>` +
    `</table>`
  );
}

export function asunto(datos) {
  const d = normalizarDatos(datos);
  return `Informe de visitas · ${d.nombre} · ${d.periodo}`;
}

// ── envío ────────────────────────────────────────────────────────────────
async function enviar(env, datos, subject, html) {
  const to = String(datos.para || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (!to.length) throw new Error("falta el destinatario");

  if (env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html, reply_to: REPLY_TO }),
    });
    const out = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`resend ${res.status}: ${(out && out.message) || "error"}`);
    return { canal: "resend", to };
  }

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
    await env.SEND_EMAIL.send(new EmailMessage("reportes@ivavala.com", to, body));
    return { canal: "send_email", to };
  }

  throw new Error("sin RESEND_API_KEY ni binding send_email");
}

// ── D1 ───────────────────────────────────────────────────────────────────
export async function guardarReporte(db, raw, id) {
  const d = normalizarDatos(raw);
  if (!d.nombre) throw new Error("falta el sitio/cliente");
  if (!d.periodo) throw new Error("falta el período");
  if (!d.para) throw new Error("falta el destinatario");

  if (id) {
    const r = await db
      .prepare(
        `UPDATE reportes SET nombre=?, url=?, periodo=?, para=?, visitas=?, unicas=?, whatsapp=?, leads=?, conversion=?, fuentes=?, paises=?, nota=? WHERE id=?`
      )
      .bind(d.nombre, d.url, d.periodo, d.para, d.visitas, d.unicas, d.whatsapp, d.leads, d.conversion, d.fuentes.join("\n"), d.paises, d.nota, id)
      .run();
    if (r.meta.changes === 0) throw new Error("reporte no encontrado");
    return { ok: true, id };
  }

  const r = await db
    .prepare(
      `INSERT INTO reportes (nombre, url, periodo, para, visitas, unicas, whatsapp, leads, conversion, fuentes, paises, nota) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(d.nombre, d.url, d.periodo, d.para, d.visitas, d.unicas, d.whatsapp, d.leads, d.conversion, d.fuentes.join("\n"), d.paises, d.nota)
    .run();
  return { ok: true, id: r.meta.last_row_id };
}

export async function enviarReporte(env, db, id) {
  const row = await db.prepare("SELECT * FROM reportes WHERE id = ?").bind(id).first();
  if (!row) throw new Error("reporte no encontrado");

  const datos = {
    nombre: row.nombre,
    url: row.url,
    periodo: row.periodo,
    para: row.para,
    visitas: row.visitas,
    unicas: row.unicas,
    whatsapp: row.whatsapp,
    leads: row.leads,
    conversion: row.conversion,
    fuentes: (row.fuentes || "").split("\n"),
    paises: row.paises,
    nota: row.nota,
  };
  const html = componerHTML(datos);
  const subject = asunto(datos);
  const envio = await enviar(env, datos, subject, html);

  await db
    .prepare("UPDATE reportes SET estado = 'enviado', enviado_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  return { ok: true, id, canal: envio.canal, to: envio.to, subject };
}

export async function listarReportes(db) {
  const r = await db.prepare("SELECT * FROM reportes ORDER BY created_at DESC, id DESC LIMIT 100").all();
  return r.results;
}

export async function borrarReporte(db, id) {
  const r = await db.prepare("DELETE FROM reportes WHERE id = ?").bind(id).run();
  if (r.meta.changes === 0) throw new Error("reporte no encontrado");
  return { ok: true };
}
