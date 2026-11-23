# Hermes · contacto de Luis Guardado (Keeper) — WhatsApp

Fecha: 23 nov 2026. Uso: dar a Luis un canal directo con Hermes, con el contexto del
proyecto y del contrato ya cargado en el primer mensaje.

## 1. Ficha del contacto

| Campo | Valor |
|---|---|
| Nombre | Luis Guardado |
| Empresa | Keeper Consulting and Management · RFC KCM241213N63 · RESICO |
| Correo | luispguardado@gmail.com (facturación: facturaskeepercm@gmail.com) |
| WhatsApp | +52 1 322 214 9409 · normalizado `5213222149409` |
| Rol | Cliente y amigo de Marco |
| Registro | `whatsapp_users` creado con `priority_level = high` |

## 2. Enlaces del proyecto

| Recurso | URL |
|---|---|
| Sala del contrato | https://nexus.pandoras.finance/deal/PDR-EDITORIAL |
| Contrato en PDF | https://nexus.pandoras.finance/api/public/deals/PDR-EDITORIAL/pdf |
| Propuesta pública | https://propuesta-medios.vercel.app |
| WhatsApp de Hermes | +52 1 322 137 4392 (`wa.me/5213221374392`) |

## 3. Estado actual (lo que Hermes debe saber)

- Contrato de servicios **Fase 0 + Fase 1** por **$77,000 + IVA ($89,320)**: listo y en la sala,
  **pendiente de su firma**.
- Está **esperando datos de su programador anterior**: accesos al VPS, base de datos y
  respaldos. Sin eso no arranca la Fase 0 (toma de control).
- Sitios del proyecto: El Pregonero PV y Noticias de Jalisco (piloto, Fase 1);
  Noticias de la Bahía y El Rey Juan Carlos (Fase 2, no contratada).
- Stack previsto: Next.js en Vercel, Payload CMS en Railway, Neon Postgres,
  Cloudflare R2/Cloudflare, Sentry.
- Pago: Fase 0 al firmar; Fase 1 al autorizar su inicio tras aceptar la Fase 0.

## 4. Resumen de la propuesta (knowledge para Hermes)

**Enfoque.** No son cuatro migraciones aisladas: primero se toma el control de los activos,
se protege la continuidad y luego se migra cada marca a una plataforma propia con panel
central, permisos por marca y aislamiento donde se requiere.

**Hallazgos públicos.** Los cuatro sitios tienen HTTPS forzado, TLS 1.2/1.3, Wordfence,
API de usuarios bloqueada y XML-RPC cerrado. Brechas: sin HSTS/CSP/X-Frame-Options,
DMARC ausente o en monitoreo, sin WAF perimetral y dos portales compartiendo servidor.
Jalisco y DLB comparten IP, DNS y notas; Pregonero y Rey Juan Carlos son clones.

**Fases.** Fase 0 toma de control (3-5 días); Fase 1 plataforma base + piloto Pregonero y
Jalisco (2-3 semanas); Fase 2 DLB + Rey Juan Carlos; Fase 3 QA y handover. Camino A completo
de referencia: $120,000 – $140,000 MXN (lista $230,000 – $270,000). Mantenimiento
$9,000 – $11,000/mes e infraestructura $1,500 – $2,500/mes (no contratados aún).

**Seguridad.** Los controles se implementan y validan durante el proyecto; hoy no existen.
No se promete ausencia de incidentes.

**Límites.** No incluye operación editorial, publicación diaria, soporte 24/7, fases 2-3,
costos de proveedores ni producción de contenido.

## 5. Mensaje que Marco le manda a Luis

> Luis, ¿cómo estás? Te paso el contacto de Hermes, mi asistente, para que no se te pierda
> nada del proyecto. Solo abre el enlace y dale enviar: ya va con el mensaje puesto y él te
> reconoce. Ahí mismo te deja la sala del contrato por si quieres firmar desde el celular.
>
> https://wa.me/5213221374392?text=Hola%20Hermes%2C%20soy%20Luis%20Guardado%2C%20de%20Keeper%20Consulting%20and%20Management.%20Marco%20me%20pidi%C3%B3%20escribirte%20para%20dar%20seguimiento%20al%20contrato%20de%20la%20plataforma%20editorial%20multi-marca%20%28sala%20PDR-EDITORIAL%29.%20Sigo%20esperando%20los%20accesos%20al%20VPS%20y%20a%20la%20base%20de%20datos%20de%20mi%20programador%20anterior.%20%C2%BFMe%20ayudas%20con%20los%20siguientes%20pasos%20y%20con%20el%20enlace%20para%20firmar%20el%20contrato%3F
>
> Sala: https://nexus.pandoras.finance/deal/PDR-EDITORIAL

El texto precargado es editable por Luis antes de enviarlo (WhatsApp lo deja en la caja de
texto), así que no queda rígido.

## 6. Qué quedó implementado

**Identidad canónica (mecanismo existente, no una tabla nueva):**

- `marketing_identities`: Luis con email, teléfono `5213222149409` y
  `metadata.whatsapp` (welcome, estado, deal, enlaces, pendientes).
- `channel_identity_bindings`: WhatsApp y email ligados a esa identidad.

**Bienvenida determinista (`lib/whatsapp/contact-welcome.ts`):**

- El dispatcher, al recibir un mensaje en el número maestro, resuelve la identidad por
  teléfono. Si trae `metadata.whatsapp.welcome = true`, envía **una** bienvenida con su
  nombre, la empresa, los pendientes y los enlaces, y marca `lastWelcomedAt`.
- No depende del LLM ni de que el conocimiento esté cargado; se repite como máximo cada 12 h.
- El jefe (Marco) queda excluido.

Mensaje verificado:

```
Hola Luis, soy Hermes, el asistente de Marco.
Te tengo registrado como Keeper Consulting and Management.

Esto es lo que tengo pendiente:
• Firma del contrato (Fase 0 + Fase 1)
• Accesos al VPS y base de datos del programador anterior

Sala del contrato: https://nexus.pandoras.finance/deal/PDR-EDITORIAL
Contrato en PDF: https://nexus.pandoras.finance/api/public/deals/PDR-EDITORIAL/pdf
Propuesta: https://propuesta-medios.vercel.app

Si quieres, te guío para firmar en dos minutos. Y cuando tengas los accesos del VPS y la base de datos, me los dices y arrancamos la Fase 0.
```

**Conocimiento de la propuesta:** fila `ACTIVE`/`PUBLIC` en `hermes_knowledge`
(`propuesta_medios_plataforma_editorial`, 1,917 caracteres) para que el runtime pueda
responder preguntas del proyecto después de la bienvenida.

**Prueba:** bienvenida `true` en el primer contacto, `false` tras marcarla, y `true` de nuevo
al limpiar la marca (queda lista para el primer mensaje real). `tsc` sin errores.
MD
