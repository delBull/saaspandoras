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

## 6. Qué hace Hermes hoy y qué falta

**Hoy, con el código desplegado:**

- El webhook de WhatsApp Cloud API recibe el mensaje en el número maestro.
- `WhatsAppDispatcher` resuelve identidad por teléfono, registra el mensaje y enruta al
  **Hermes Cognitive Runtime** con `organizationId: 'pandoras'`.
- Responde por WhatsApp con el contexto de la conversación (el mensaje precargado ya lleva
  quién es, el proyecto, el pendiente y la petición).
- Queda bitácora en `whatsapp_messages` y el contacto en `whatsapp_users`.

**Lo que falta para que Hermes "sepa" la propuesta sin depender del mensaje:**

- El runtime consume conocimiento gobernado `ACTIVE` del contexto cognitivo, pero **no hay
  hoy un perfil por contacto** (empresa, rol, estado, enlaces). La tabla `hermes_knowledge`
  existe, aunque su `content` quedó marcado como purgado a IPFS, así que insertar texto ahí
  no garantiza que se use.
- Propuesta: agregar un **perfil de contacto** (teléfono → contexto + enlaces + estado) y
  que el dispatcher lo inyecte en el turno, con una **bienvenida determinista** la primera
  vez del día. Así Hermes saluda por su nombre, da la sala y retoma el pendiente sin
  depender de que el mensaje lo diga.
MD
