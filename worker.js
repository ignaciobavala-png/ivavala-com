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

    if (url.pathname === "/robots.txt") return text(ROBOTS_OK, "text/plain");
    if (url.pathname === "/sitemap.xml") return text(SITEMAP, "application/xml");

    return env.ASSETS.fetch(request);
  },
};
