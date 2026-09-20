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
