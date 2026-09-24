# Cambios del portafolio

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
