# Portafolio — Ignacio Vavala

Landing de desarrollador bilingüe (ES/EN). Estática pura, deploy a Cloudflare Workers (Static Assets).

## Stack

- HTML + CSS + JS vanilla (cero dependencias de runtime)
- pnpm + wrangler v4 (`pnpm run deploy`)

## Estructura

- `index.html` — versión ES (raíz)
- `en/index.html` — versión EN
- `yo.jpg` — avatar circular (432×432)
- `wrangler.jsonc` — Worker de assets estáticos, `workers_dev: true`
- `.assetsignore` — evita subir node_modules/configs como assets públicos

## Deploy

```bash
pnpm run deploy   # sube solo los HTML + yo.jpg, verificar después con curl
```

URL: `https://portafolio.ethoslogliberty.workers.dev`

## Git

- Repo local en `main` (sin remoto por ahora). Commit inicial: 2026-08-22.
- `.gitignore` excluye `node_modules`, `.wrangler`, `.DS_Store`.

## Detalles de implementación

- **Toggle claro/oscuro**: `data-theme` en `<html>` + variables CSS en `:root[data-theme="light"]`. Se persiste en `localStorage` con script inline en `<head>` (evita flash al cargar). Icono ☾/☀ junto al selector de idioma.
- **Animación**: rieles verticales ondulados en los márgenes (SVG + `translateY` -50% loop, trazo `var(--rail)` para adaptarse al tema).
- **Formulario de contacto**: arma el mensaje y abre `wa.me` directo (sin backend). Select de servicios, campos nombre/contacto/mensaje.
- **Nombre**: "Vavala" con doble V (evita confusión V/B). El mailto queda `ignacio@bavala.dev` (dominio real).
- **Copy**: tono con humor, servicios antes que trabajo (primero qué hago, después la prueba).

## Cómo dirigirse a Ignacio

Hombre, español rioplatense con voseo, registro directo. Las concordancias van en masculino.
