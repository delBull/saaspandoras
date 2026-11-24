# Auditoría de Hermes · identidades, seguridad, tenants y conocimiento

Fecha: 24 nov 2026. Alcance: revisión de código, base de datos y comportamiento en producción.
**No se cambió código en este paso.** Evidencia: lecturas de código, consultas SQL y pruebas HTTP.

## 1. Veredicto rápido

| Área | Estado | Nota |
|---|---|---|
| Identidades | 🟡 sólido con dos grietas | jefe/colaborador/contacto de pod funcionan; el match por últimos 10 dígitos puede colisionar |
| Idempotencia | ✅ bien | índice único por `wamid`, claim atómico, dedupe en memoria + nonce |
| Seguridad del canal | ✅ bien | HMAC fail-closed verificado (401 sin firma / 401 firma falsa / 200 verificación) |
| Aislamiento por tenant | ✅ bien | `organizationId: tenant.slug`, token propio, knowledge filtrado, conversación por tenant |
| Super admin | 🟡 potente y con un overclaim | el jefe recibe todo el knowledge en WhatsApp y el prompt le hace afirmar una capacidad que la tool niega |
| Knowledge graph | 🔴 **no funcional en su mayoría** | 48 de 55 hechos ACTIVE **sin contenido**; IPFS responde 401 |
| Personalidad / alma | 🟡 sólo S'Narai | Pandora's no tiene soul ni política de claims registrada |
| "Saber decir no" | 🟡 reglas sí, claims policy no | las reglas ADR-011 existen; falta la lista de afirmaciones prohibidas para HQ |
| Observabilidad | ✅ bien | cadena de hash de seguridad, journal, logs con correlación |

## 2. Hallazgos por severidad

### P0 — funcional o integridad

**P0-1 · El knowledge graph está registrado pero casi todo ilegible.**
- `hermes_knowledge`: **55 ACTIVE, 48 con `content = NULL`**.
- El contenido se purgó a IPFS (K25 Phase C) y la recuperación falla:
  `KuboRpcIpfsProvider … 401 Unauthorized Sovereign RPC Access` en cada mensaje.
- Consecuencia: Hermes razona sin su conocimiento; lo que responde viene del mensaje,
  del historial y de los pocos hechos con contenido. Es la causa raíz de respuestas
  genéricas o inventadas.
- Acción: restaurar credenciales del Kubo RPC **o** repoblar `content` de los hechos
  críticos (decisión de gobernanza). Sin esto, "Hermes al cien" no es alcanzable.

**P0-2 · El prompt del jefe le hace afirmar una capacidad que la tool niega.**
- `prompt-builder.ts` (bloque SUPREME EXECUTIVE DIRECTIVE): *"confírmale de inmediato
  con total seguridad que SÍ puedes enviar y redactar mensajes por WhatsApp"*.
- `executive-tool-registry.ts`: `executive_send_whatsapp` **lanza**
  `ACTION_GATEWAY_REQUIRED: Direct WhatsApp dispatch from Hermes is deprecated. Hermes must only propose.`
- Resultado: Hermes dice "sí puedo" y al intentarlo falla. Rompe la confianza y
  contradice la regla "no fabricar capacidad".
- Acción: cambiar la directiva a *"puedo proponer el mensaje; el envío se ejecuta por el
  Action Gateway con tu aprobación"*, o cablear el envío real con aprobación.

**P0-3 · El mismo prompt elimina una regla de sistema para el jefe.**
- `prompt-builder.ts`: `ctx.systemRules.filter(r => !r.includes('ROLE LIMITS: You cannot directly assign human operators'))`.
- Eso es autoridad concedida **por prompt**, no por gate determinista, y choca con
  ADR-011 / K11-ARCH-06 ("authority is not prompted").
- Acción: quitar el filtro; si el jefe debe poder asignar operadores, que exista una tool
  con capability y auditoría, no una excepción de texto.

### P1 — seguridad y privacidad

**P1-1 · El jefe recibe TODO el knowledge en WhatsApp, incluido SECRET.**
- En el runtime, `hasExecutivePrivilege` empuja todos los artefactos sin pasar por el
  Channel Mesh. Hay **3 hechos SECRET y 15 CONFIDENTIAL ACTIVE**.
- WhatsApp es un canal público: el contenido pasa por Meta y queda en el teléfono.
- Acción recomendada: mantener el bypass ejecutivo en canales internos, pero en WhatsApp
  limitar a `TENANT_RESTRICTED` como máximo, o exigir confirmación explícita por mensaje.

**P1-2 · Pandora's no tiene soul ni claims policy.**
- `HermesSoulRegistry` sólo registra `snarai`. Para `pandoras`, `registeredSoul` es
  `undefined`, así que **no se aplican** `claimsPolicy.prohibited` ni las URLs canónicas.
- La personalidad cae al `identityPack` del proyecto o a un tono por defecto.
- Acción: registrar un soul de Pandora's (misión, tono, claims prohibidos, escalamiento).

**P1-3 · Rate limit definido pero no aplicado.**
- `CHANNEL_CONFIGS.WHATSAPP.rateLimitPerMinute = 30`, pero el dispatcher no lo consume
  (sólo deduplica mensajes). Un número puede inundar y consumir tokens sin freno.
- Acción: contador por teléfono/minuto en el dispatcher (memoria + respaldo en DB).

**P1-4 · Identidad por "últimos 10 dígitos" puede colisionar.**
- Colaboradores y jefe se resuelven comparando los últimos 10 dígitos. Un número de otro
  país que termine en esos 10 dígitos resolvería como el colaborador (o como el jefe).
- Acción: exigir `+52` (o E.164 exacto) para MX; dejar el sufijo sólo como último recurso
  con log de seguridad.

**P1-5 · Teléfono del jefe hardcodeado.**
- `interlocutor-resolver.ts` incluye `523222741987` y variantes en el código.
- Acción: mover a `MARCO_PHONE` / `ADMIN_PHONES` (dejando el valor actual como respaldo
  documentado) para que el cambio sea operativo y no un deploy.

### P2 — hardening y deuda

| # | Hallazgo | Acción |
|---|---|---|
| P2-1 | No hay detector de inyección de prompt en la entrada (sólo reglas de sistema y el gate de tools) | Heurísticas + telemetría; el gate ya impide escalar autoridad |
| P2-2 | Dos rutas de webhook: `whatsapp/simple` (Meta) y `v1/external/whatsapp/webhook` (bridge) | Documentado; no borrar la de bridge sin confirmar consumidor |
| P2-3 | 4,346 eventos CRITICAL `DISCLOSURE_BLOCKED` históricos | El cambio de severidad (Fase 3) detiene los nuevos; definir retención |
| P2-4 | `whatsapp_users` y flujos legacy coexisten con la identidad canónica | No los usa Hermes; documentar como legacy |
| P2-5 | 679 `TOOL_UNAUTHORIZED` y 604 `CROSS_TENANT_BLOCKED` históricos | Revisar si son de pruebas; el gate está funcionando |
| P2-6 | El "sello soberano" (IPFS) falla en cada mensaje | Mismo arreglo que P0-1 o desactivarlo mientras no esté configurado |

## 3. Lo que está bien (con evidencia)

- **HMAC del webhook**: `POST` sin firma → 401; firma falsa → 401; `GET` de verificación → 200.
- **Idempotencia**: índice único `idx_whatsapp_messages_incoming_wamid_unique`, claim
  atómico con `onConflictDoNothing`, dedupe en memoria y nonce por sesión firmada.
  Además: `idx_nda_email_version`, `uq_access_requests_room_email`, `idx_pof_room_email`.
- **Aislamiento por tenant**: destino por `phone_number_id` (fail-closed), runtime con
  `organizationId: tenant.slug`, respuesta con `tenant.secrets`, knowledge filtrado por
  organización y conversación con prefijo por tenant.
- **Mesh fail-closed**: techo por canal; WhatsApp `PUBLIC`; lo que no cabe se descarta
  (ahora con severidad proporcional).
- **Knowledge gobernado**: sólo `ACTIVE` entra al contexto; índice único de un ACTIVE por
  `(org, dimension, key)`; supersession soportada.
- **Gate de tools**: cross-tenant por `organizationId`, resource scope y lista de tools
  restringidas; `authorizeAsync` se ejecuta antes de cualquier handler.
- **Super admin**: resolución como `OWNER` verificada en logs ("Boss: true"), con
  permisos completos; handoff y pausas no aplican al jefe (por diseño).
- **Proveedor**: Ollama Cloud con `gemma4:31b`; log `provider=ollama-native`; configuración
  por tenant (`OLLAMA_<SLUG>_*`) sin hardcode.
- **Contexto por contacto**: la ficha del pod se inyecta al contacto; el directorio de pods
  sólo al jefe. Nada de eso se escribe en knowledge.
- **Tests**: 10/10 (HMAC + slug de tenant + severidad del mesh).

## 4. "Saber decir no" hoy vs lo que falta

**Ya dice no a**: escalar autoridad, presentar conocimiento no `ACTIVE` como hecho, usar
tools sin capability, tocar recursos de otro tenant, clasificación desconocida, y ejecutar
acciones sin gate.

**No lo dice bien a**: afirmar que puede enviar WhatsApp (P0-2), asignar operadores
(P0-3), y responder sobre conocimiento que no puede leer (P0-1). Además, al no tener
claims policy propia, no hay lista explícita de "esto no lo afirmo" para Pandora's (P1-2).

## 5. Roadmap propuesto

| Orden | Acción | Esfuerzo |
|---|---|---|
| 1 | Restaurar acceso al conocimiento (IPFS) o repoblar `content` crítico (P0-1) | 2–4 h + decisión |
| 2 | Corregir la directiva del jefe: proponer, no afirmar envío; quitar el filtro de ROLE LIMITS (P0-2/P0-3) | 1 h |
| 3 | Soul y claims policy de Pandora's (P1-2) | 2–3 h |
| 4 | Limitar SECRET/CONFIDENTIAL en WhatsApp incluso para el jefe (P1-1) | 1 h |
| 5 | Rate limit por teléfono (P1-3) | 1 h |
| 6 | Match de identidad por país/E.164 (P1-4) y teléfono del jefe por env (P1-5) | 1–2 h |
| 7 | Telemetría de inyección y retención de eventos (P2-1/P2-3) | 2 h |

**Nota:** los puntos 1 y 2 son los que explican por qué Hermes "no sabía de Luis" y por qué
puede prometer cosas que no hace. Sin ellos, el resto es endurecimiento sobre una base
funcionalmente incompleta.
