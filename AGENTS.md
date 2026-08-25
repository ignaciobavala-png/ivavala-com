# AGENTS.md — portafolio

> Generado automáticamente por brain-agents-inject desde brain-data.
> No editar manualmente — se sobreescribe al abrir Claude Code.

## Proyecto

| Campo | Valor |
|-------|-------|
| Nombre | portafolio |
| Tipo | — |
| Cliente | — |
| Stack | Wrangler / Cloudflare + D1 |
| Estado | desconocido |
| Último commit | — |

## Perfil del desarrollador

# SKILL — perfil-desarrollador

## Descripción
Perfil técnico del desarrollador Ignacio Bavala. Define el stack tecnológico, convenciones y preferencias para cualquier proyecto nuevo.

## Cuándo usarla
- Al iniciar un proyecto nuevo
- Cuando necesites saber qué stack usar por defecto
- Para mantener consistencia tecnológica entre proyectos

## Cómo dirigirse a él

**Ignacio es hombre.** En español rioplatense los adjetivos van en masculino:
"vos solo", "quedaste tranquilo", "avisame cuando estés listo". Ojo con las
concordancias que se cuelan al escribir rápido ("sola", "lista", "preparada").

Tuteo con voseo, registro directo, sin formalismos.

## Cómo entregar lo que se produce

**Los entregables van como archivos locales, en la ruta que él pida.** Si pide
"dejámelo en el escritorio", eso es el entregable completo — no hay que
complementarlo publicándolo en ningún lado.

**No publicar artifacts ni subir nada a un servicio externo sin preguntar.**
Dicho por Ignacio el 19/08/2026, después de que se publicara un instructivo para
un cliente suyo sin consultarlo. El razonamiento de que "un link se comparte más
cómodo que un adjunto" puede ser cierto, pero **cómo se distribuye material de
un cliente es decisión de él, no del agente**, y publicar manda contenido a un
servicio externo. Si parece que un link ayudaría, se ofrece y se espera el sí.

Corolario práctico: un HTML que se va a mandar por WhatsApp conviene que sea
**liviano**. Un logo PNG embebido en base64 infla el archivo ~1,33x sobre el peso
del PNG (75 KB → 100 KB). Preferir SVG embebido o tipografía.

## Stack por defecto para nuevos proyectos

```
Framework:    Next.js 16 (App Router)
UI:           React 19 + Tailwind CSS v4 + Framer Motion v12
Estado:       Zustand v5
DB:           Supabase (PostgreSQL + Auth + Storage + RLS)
Deploy:       Vercel (cuenta Pro — sin límite de frecuencia de crons)
Package:      pnpm
Linting:      ESLint 9 (flat config)
Lenguaje:     TypeScript strict
```

**Páginas livianas → Cloudflare** (Workers + Static Assets, D1/SQLite opcional, wrangler v4),
en vez de Next.js+Supabase+Vercel. Para arrancar cualquiera de los dos: scaffold
[[scaffold-nextjs-supabase]] (`kickstart`, targets `vercel` y `cloudflare`).

## Convenciones

- Server Components por defecto, Client Components solo cuando hay interactividad
- State global con Zustand v5 (no Context a menos que sea trivial)
- Animaciones con Framer Motion v12
- Estilos con Tailwind v4, configuración vía CSS `@theme` tokens
- Migraciones SQL como archivos `.sql` planos
- `vercel.json` con crons para keep-alive de Supabase
- Cada proyecto necesita su `AGENTS.md`
- **Next.js 16**: `middleware.ts` fue renombrado a `proxy.ts`; exportar `export function proxy(request)` en vez de `middleware`. Runtime Node.js por defecto. Codemod: `npx @next/codemod@canary middleware-to-proxy .`
- Sin testing, sin Docker
- Sin CSS-in-JS más allá de Tailwind
- `@/*` como path alias (apunta a `./*` o `./src/*`)
- **No subir binarios a git/GitHub** (fonts, imágenes pesadas, videos, PDFs): no se comprimen, no se pueden diffear, inflan el clone para siempre aunque se borren después, y hay límites duros de tamaño en GitHub. Para assets de proyecto usar Supabase Storage o Vercel Blob y referenciar por URL. Excepción: binarios chicos e imprescindibles para el build (ej. un logo o una fuente puntual) pueden ir directo al repo.

## Herramientas propias (~/bin)

Los scripts viven en `~/bin`, **fuera del vault** (nunca se suben a GitHub). Acá va
lo mínimo para saber que existen; el detalle completo está en [[areas/sistema-agente]].

- **`recibo`** — genera recibos de pago en HTML + PDF con el formato estándar de
  Ignacio (número, "Recibí de", monto en letras, "En concepto de", tabla
  total/seña/saldo, disclaimer "No válido como factura"). Usar cuando pidan emitir
  un recibo o seña de un cobro:
  `recibo --cliente "Escuela Sónica" --suma 200 --total 650 --moneda USD --concepto "Seña ..."`.
  El número auto-incrementa y los montos pasan a letras en español (pesos/dólares).

## ESLint

Usar flat config (`eslint.config.mjs`) con la config nativa de Next 16
(`FlatCompat` legacy rompe con `eslint-config-next@16`):

```js
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
])

export default eslintConfig
```

## Skills relevantes para este proyecto

Ruta de cada skill: `/home/nch/Escritorio/brain-data/skills/<nombre>/SKILL.md`

Esto es un índice, no el contenido. Leer el archivo completo solo si la tarea actual lo requiere.

- `cloudflare-wrangler-deploy` — **Cloudflare Wrangler — setup, assets estáticos y deploy seguro**
  Al **conectar un dominio a un Worker** —sobre todo si el dominio es del cliente y no se puede mover a tu…
- `client-side-image-compress` — **Comprimir imágenes client-side antes de subir al storage**
  Siempre que se implemente un uploader de imágenes (flyers, avatares, fondos, productos, etc.). Sin…
- `scaffold-nextjs-supabase` — **Scaffold Next.js 16 + Supabase (kickstart)**
  Al arrancar cualquier proyecto nuevo. En vez de re-hacer el setup a mano y re-debuggear los mismos bugs…
- `tailwindcss-mobile-first` — **Tailwind CSS v4 — configuración y patrones mobile-first**
  Al configurar Tailwind v4 en un proyecto nuevo, definir tokens de diseño, o implementar layouts responsivos.
- `vercel-dominio-cert-sin-emitir` — **Dominio agregado en Vercel antes de que exista el DNS: queda verified pero sin certificado, y no reintenta**
  Cuando se activa un dominio o subdominio nuevo en Vercel y el navegador muestra "la conexión no es segura" /…
- `landing-conversion-sin-framework` — **Landing que convierte sin framework — CTA, servicios por resultado, FAQ y movimiento**
  Al armar o revisar una landing de servicios (propia o de cliente) donde el objetivo es que el visitante…
- `iframe-tercero-breakpoint-del-proveedor` — **Embeber un checkout/widget de terceros — el ancho del contenedor lo manda el breakpoint del proveedor**
  Cuando se embebe en un iframe el checkout, formulario o widget de otro producto (ticketeras, pasarelas de…
- `nextjs-persistent-shell-nav` — **Navegación con shell persistente (route group + framer-motion)**
  Cuando querés que la navegación entre páginas se sienta como **un mismo espacio que muta** (sensación "redes…
- `cloudflare-email-routing-send-email` — **Cloudflare Email Routing + binding send_email (formulario de contacto sin servicio externo)**
  Cuando un dominio propio necesita recibir mail sin contratar casilla, o cuando un formulario de contacto…
- `tailwind-clases-conflicto-orden-hoja` — **Bug silencioso — `hidden` no oculta si el componente ya trae `flex`/`inline-flex` en su base**
  Cada vez que un componente propio arme su `class` concatenando una base fija con un `className` que recibe…
- `fondo-full-bleed-recorte-y-mascara` — **Fondo full-bleed — dónde recorta `object-cover` y sobre qué caja se miden los % de la máscara**
  Al montar una sección con imagen de fondo a todo el ancho: un hero, un slide de diseño, un banner. Dos cosas…
- `precio-usd-cobro-pesos-cotizacion` — **Publicar en USD y cobrar en pesos — cotización en cascada, una sola vez por request y congelada en la orden**
  Cuando el negocio razona en dólares (importados: vinilo, indumentaria, electrónica) pero cobra en pesos.…
- `sqlite-insert-or-replace-reordena` — **INSERT OR REPLACE borra la fila — reordena el listado y pisa lo editado a mano**
  Cualquier script de import/seed idempotente sobre SQLite o **Cloudflare D1** que use `INSERT OR REPLACE` (o…
- `hover-touch-tailwind-v4` — **Hover en touch — Tailwind v4 ya lo protege, tu CSS a mano no**
  Al hacer tarjetas, grillas de servicios o cualquier elemento con efecto de hover que también se va a ver en…
- `css-marquee-infinito-dos-tracks` — **Marquee CSS infinito — dos tracks, no uno animado a -50%**
  Cuando hay una franja de texto que scrollea en loop (ticker de promos, "envío gratis", mensajes de marca) y…
- `cloudflare-d1-migrations` — **Cloudflare D1 — Migraciones y patrones SQLite**
  Cualquier proyecto con Cloudflare D1 (SQLite) que necesite migraciones de schema, especialmente cambios que…
- `ruta-publica-sirve-bucket-entero` — **Archivo privado nuevo en un bucket que ya tenía ruta pública — la ruta vieja lo sirve**
  Cuando se agrega un **tipo de archivo nuevo** (comprobantes de pago, DNI, contratos, exports) a un…
- `details-solo-el-boton-abre` — **<details> donde solo un botón abre, y que se expanda a todo el ancho de la grilla**
  Cuando hay que hacer un acordeón, una ficha ampliada o un "ver más" **sin JavaScript**, y aparece alguno de…
- `tarjeta-button-centrado-vertical` — **Tarjeta hecha con <button> — el navegador le centra el contenido y la desalinea**
  Cuando en una fila o grilla de tarjetas **una sola** aparece corrida hacia abajo respecto de las otras, y el…
- `scroll-driven-animations-no-confiar` — **No colgar un efecto central de animation-timeline scroll()**
  Cuando el efecto de scroll (hero que se atraviesa, parallax, barra de progreso) **es** la identidad de la…
- `env-var-parity-branch-deploy` — **Paridad de env vars al mergear una rama a producción**
  Antes de mergear/pushear a `main` (o al proyecto de Vercel que sirve producción) una rama que estuvo en…
- `email-boton-fondo-blanco-mobile` — **Botón de mail con fondo blanco en el celular — bgcolor y color-scheme**
  Un mail HTML se ve bien en escritorio pero en el celular un botón (o cualquier bloque de color) aparece con…
- `z-index-negativo-fondo-body` — **El z-index negativo desaparece detrás del fondo del body**
  Cuando una imagen o capa de fondo puesta con `z-index: -1` / `-z-10` **no se ve**, y el sitio tiene un…
- `claude-md-symlink-agents-sobreescrito` — **CLAUDE.md como symlink a AGENTS.md — la doc del proyecto se borra sola**
  Al documentar cualquier proyecto que tenga `AGENTS.md` generado por `brain-agents-inject` Cuando aparece un…
- `grid-hairlines-responsive-nth-child` — **Grillas con hairlines responsivas — reaplicar bordes en cada media query**
  Diseños "caged" / brutalistas donde las líneas de 1px entre celdas se dibujan con `border-top` /…
- `auditoria-responsive-chrome-headless` — **Auditar responsividad mobile con Chrome headless (sin extensión ni Playwright)**
  Cuando hay que responder "¿esto anda en teléfono?" y **no** está disponible la extensión de Claude in Chrome…
- `overflow-clip-vs-hidden-scroll-horizontal` — **Scroll horizontal en mobile — overflow-x-clip vs overflow-hidden**
  Cuando en el teléfono **toda la página se mueve para los costados** y no se encuentra el culpable, o cuando…
- `logo-png-padding-alpha` — **Logo PNG que se ve chico — padding alfa dentro del archivo**
  Cuando ponés un logo que mandó un diseñador (PNG/WebP con transparencia) en un navbar, footer o card, lo…
- `vercel-ls-crea-proyecto-fantasma` — **`vercel ls` en un directorio sin linkear crea un proyecto fantasma y lo conecta a GitHub**
  Antes de correr **cualquier** comando de la CLI de Vercel en un repo que todavía no tiene…
- `astro-cloudflare-imageservice-runtime` — **Astro + Cloudflare — las imágenes se optimizan en runtime sin avisar**
  Cualquier proyecto Astro con `@astrojs/cloudflare` que use `astro:assets` (`<Image>` / `<Picture>`)…
- `aspect-ratio-cabe-en-viewport` — **Video 16:9 que entre en pantalla — capear ancho, no alto, y usar svh**
  Un player, hero o cualquier caja con relación de aspecto fija que tiene que entrar completa en el primer…
- `backdrop-filter-fixed-menu-clipped` — **backdrop-filter (o filter) en el header confina los hijos position:fixed a su propia caja**
  Cuando un menú mobile (burger menu / overlay `position: fixed; inset: 0`) reportado como "no despliega bien"…
- `sharp-vercel-pnpm-tracing` — **sharp en Vercel con pnpm — binarios nativos que no llegan al bundle**
  Cuando una ruta API de Next.js que usa `sharp` funciona en local pero en Vercel tira `ERR_DLOPEN_FAILED`…
- `astro-dev-logger-json-agente-workerd` — **Astro 7 + Cloudflare — 500 en todas las rutas cuando el dev server lo corre un agente**
  Levantás `pnpm dev` desde Claude Code (o cualquier agente) en un proyecto **Astro 7 + `@astrojs/cloudflare`**…
- `hono-set-signed-cookie-async` — **Hono setSignedCookie async sin await rompe cookies silenciosamente**
  Cuando uses `setSignedCookie` de Hono para auth con cookies firmadas y el login parezca funcionar (redirige)…
- `css-hover-dropdown-gap` — **Dropdown por :hover con gap visual se cierra antes de poder hacer click**
  Cuando un menú desplegable de navbar (categorías, "más opciones", etc.) se abre con `:hover` puro (sin JS) y…
- `flexbox-overflow-hidden-colapso` — **Flex item con overflow-hidden se aplasta a 0px en contenedores con scroll**
  Cuando un elemento "desaparece" dentro de un panel que es `flex flex-col` con `max-h-*` + `overflow-y-auto`…

### Traídas por enlace

Estas no coinciden con el stack por tags, pero las skills de arriba las citan. Suelen ser el patrón general detrás del caso concreto.

- `onboarding-guest-rollback-storage-rls` — **Onboarding multi-paso con guest+fotos — rollback en fallo y RLS de storage por dueño**
  Cuando un flujo público (sin login) crea una fila "dueña" (guest, invitado, registro) y después, en el mismo…
  _citada por `client-side-image-compress`_
- `supabase-bucket-publico-select-listing` — **Bucket público de Supabase — la policy de SELECT abierta deja listar todo**
  Al crear cualquier bucket de Supabase Storage con `public: true` (avatares, portadas, adjuntos), y al copiar…
  _citada por `ruta-publica-sirve-bucket-entero`_
- `lenis-smooth-scroll` — **Lenis smooth scroll — bugs silenciosos con drawers y overlays**
  Cuando un proyecto usa Lenis para smooth scroll y hay drawers, modales o cualquier contenedor con…
  _citada por `scroll-driven-animations-no-confiar`_
- `supabase-storage-egress` — **Supabase Storage — egress, límites y buenas prácticas**
  Al subir archivos a Supabase Storage, especialmente videos o imágenes pesadas que se sirven públicamente.…
  _citada por `nextjs-persistent-shell-nav`_
- `nextjs-app-router-patterns` — **Next.js 16 — App Router patterns y convenciones**
  Al iniciar o trabajar en cualquier proyecto Next.js: estructura de rutas, data fetching, Server Actions…
  _citada por `nextjs-persistent-shell-nav`_
- `astro-picture-import-tapado-por-map` — **Astro — import de imagen tapado por la variable del map**
  Cuando `<Image>` o `<Picture>` de `astro:assets` rompe el build con: ``` Received unsupported format…
  _citada por `astro-cloudflare-imageservice-runtime`_
- `react-email-resend` — **React Email + Resend — setup, migración v6 y patrones de envío**
  Al conectar envío de emails transaccionales o campañas de mailing en un proyecto Next.js + Supabase. Aplica…
  _citada por `cloudflare-email-routing-send-email`_
- `emailjs-smtp-gmail-app-password` — **Reconectar un formulario EmailJS al SMTP de Gmail (app password + variables mudas)**
  Un formulario de contacto que envía con EmailJS desde el navegador y hay que sacarlo del SMTP de un hosting…
  _citada por `cloudflare-email-routing-send-email`_
