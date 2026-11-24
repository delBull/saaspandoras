# Auditoría de Hermes · identidades, seguridad, tenants y conocimiento

Fecha: 24 nov 2026. Alcance: revisión de código, base de datos, red (IPFS) y comportamiento en producción.
Este documento se actualizó **después** de ejecutar las correcciones; cada afirmación lleva evidencia.

## 1. Veredicto

| Área | Estado | Nota |
|---|---|---|
| Identidad del jefe / colaboradores / contactos de pod | ✅ | canonicalización por país (E.164); el sufijo de 10 dígitos ya no resuelve identidad por sí solo |
| Idempotencia | ✅ | índice único por `wamid`, claim atómico, dedupe en memoria + nonce |
| Seguridad del canal | ✅ | HMAC fail-closed verificado (401 sin firma / 401 firma falsa / 200 verificación) |
| Aislamiento por tenant | ✅ | `organizationId: tenant.slug`, token propio, knowledge filtrado, conversación por tenant |
| Super admin | ✅ | techo propio por canal (ya no bypass): operativo en WhatsApp/Telegram, SECRET en la consola interna |
| Knowledge graph | 🔴 **no recuperable desde IPFS** | 48/55 hechos ACTIVE sin `content`; el bloque no existe en el nodo (offline) y no hay backup |
| Personalidad / alma | ✅ | `PANDORAS_SOUL` existe y está registrado; claims y límites ampliados |
| "Saber decir no" | ✅ | reglas ADR-011 + claims prohibidos + honestidad operativa en la directiva del jefe |
| Rate limit del canal | ✅ | aplicado en el dispatcher (30/min por teléfono) con prueba de cableado |

## 2. Correcciones ejecutadas (antes → después)

### Punto 2 · La directiva del jefe afirmaba una capacidad que la tool niega — ✅ corregido

- **Antes:** `prompt-builder.ts` ordenaba *"confírmale de inmediato con total seguridad que SÍ puedes
  enviar y redactar mensajes por WhatsApp"*, mientras `executive_send_whatsapp` lanza
  `ACTION_GATEWAY_REQUIRED: Hermes must only propose`.
- **Ahora:** la directiva dice que Hermes **redacta y propone**; el envío lo ejecuta el Action Gateway
  con aprobación explícita, y **nunca** debe afirmar que un mensaje fue enviado o una acción ejecutada
  sin confirmación de la herramienta.
- **Autoridad por prompt eliminada:** se retiró el filtro que suprimía
  `ROLE LIMITS: You cannot directly assign human operators` para el jefe. Las reglas de sistema
  aplican igual a todos; lo que cambia para el jefe son sus capabilities y tools (ADR-011 /
  K11-ARCH-06). Si el jefe debe poder asignar operadores, se hace con una tool con capability y
  auditoría, no con una excepción de texto.

### Punto 3 · Alma y claims de Pandora's — ✅ reforzado

- `PANDORAS_SOUL` **sí existía y sí está registrado** (`SOUL_REGISTRY: pandoras`); la auditoría
  anterior lo dio por ausente y era incorrecto.
- Se añadió lo que faltaba para una identidad propia y verificable:
  - persona: *"Hermes, el sistema operativo del ecosistema… nunca como asistente personal de una
    persona"*;
  - prohibición explícita de presentarse como asistente personal / secretario de alguien;
  - claims prohibidos: afirmar envíos o acciones sin herramienta y aprobación, afirmar capacidades
    técnicas no verificadas en el contexto, y presentarse como representante de una persona.

### Punto 4 · Techos por canal para el jefe — ✅ corregido

- **Antes:** `hermes-runtime.ts` hacía `if (hasExecutivePrivilege) { filteredKnowledge.push(k); continue; }`.
  Es decir, el jefe recibía **todo** el knowledge, incluidos 3 hechos `SECRET` y 15 `CONFIDENTIAL`
  ACTIVE, por WhatsApp (canal que pasa y queda en servidores de Meta).
- **Ahora:** el jefe pasa por el mesh con `isExecutive: true`, y cada canal declara su techo ejecutivo:

  | Canal | Techo normal | Techo del jefe |
  |---|---|---|
  | WhatsApp | PUBLIC | **INTERNAL_OPERATIONAL** |
  | Telegram | PUBLIC | **INTERNAL_OPERATIONAL** |
  | Web widget | PUBLIC | PUBLIC |
  | Portal del tenant | TENANT_RESTRICTED | TENANT_RESTRICTED |
  | Consola interna | CONFIDENTIAL | **SECRET** |
  | REST API | TENANT_RESTRICTED | TENANT_RESTRICTED |

- Un bloqueo por techo ejecutivo se registra como `INFO` (es la política funcionando), no como
  `CRITICAL`; así dejan de generarse alertas rutinarias.

### Punto 5 · Rate limit e identidad por país — ✅ corregido

- **Rate limit:** `whatsappInboundRateLimiter` en `packages/shared/src/security-utils.ts`
  (30/min por teléfono, alineado con `CHANNEL_CONFIGS.WHATSAPP.rateLimitPerMinute`, ajustable con
  `WHATSAPP_RATE_LIMIT_PER_MINUTE`). El dispatcher lo consume **después** del dedupe (los reintentos
  de Meta no gastan presupuesto) y **antes** del claim atómico. Si el limitador falla, continúa
  (fail-open) porque el dedupe + claim siguen garantizando un solo procesamiento.
- **Identidad canónica:** `canonicalPhone()` normaliza a E.164, pliega el trunk móvil mexicano
  (`52 1 …` → `52 …`) y separa `prefix` + `national`. `phonesShareIdentity()` exige que el país
  coincida cuando ambos lados lo traen. Consecuencia: `+1 322 214 9409` **ya no** resuelve como el
  jefe mexicano `+52 322 214 9409`, y un extranjero con los mismos 10 dígitos no hereda el rol de un
  colaborador ni de un lead.
- Se aplicó en los cuatro puntos donde se resolvía identidad por sufijo: jefe, colaboradores, leads
  de marketing y contactos de pod. Todos hacen prefiltro SQL por últimos 10 dígitos (barato) y luego
  verificación canónica de hasta 5 filas.

### Punto 1 · Conocimiento — ❌ bloqueado, con evidencia nueva

No es solo la credencial: **el contenido no está en el nodo**.

```
POST https://rpc.ipfs.pandoras.finance/api/v0/version   → 401  "Unauthorized Sovereign RPC Access"
GET  https://ipfs.pandoras.finance/ipfs/bafkreiaq2tif…  → 500  "block was not found locally (offline)"
hermes_knowledge_registry (tenant pandoras): 22 artefactos, 0 ACTIVE, 0 con backup_ipfs_cid
hermes_knowledge: 55 ACTIVE → 48 con content = NULL
```

- `PANDORAS_KUBO_API_KEY` **sí existe** en Vercel (aparece cifrada; `vercel env pull` la muestra
  vacía porque es *sensitive*). No es un problema de variable ausente.
- El gateway responde, pero el nodo no tiene los bloques: el contenido fue purgado y no hay réplica
  (`backup_ipfs_cid` vacío en todos los artefactos).
- Por tanto no se puede "restaurar IPFS" desde el repositorio. Sólo queda **re-minear** el
  contenido curado (decisión de gobernanza: es verdad institucional) o restaurar el nodo desde un
  backup operativo externo.
- Mientras tanto Hermes razona con: mensaje actual + historial + **7 hechos ACTIVE que sí tienen
  contenido** (`hermes_canales_y_herramientas`, `hermes_system_limits`, `agenda_soberana_ecosistema`,
  `pandoras_contexto_operativo`, `pandoras_productos_y_proyectos`, `pricing_transparency`,
  `prospect_pablo_coffree`). Eso cubre lo operativo; no cubre constitución, legal ni políticas.

## 3. Evidencia de ejecución (24 nov 2026)

| Comando | Alcance | Resultado |
|---|---|---|
| `npx vitest run src/lib/whatsapp/__tests__` (dashboard) | suite WhatsApp | **20 passed / 3 failed** — los 3 fallos (`PATH-01/02/04`) existen igual en `HEAD` (mock de `db` sin `select/insert`) |
| `npx vitest run` (packages/hermes-core) | suite completa | **545 passed / 4 failed / 347 skipped** |
| `npx vitest run` en `HEAD` (misma suite, baseline) | suite completa | **527 passed / 5 failed** — mismos fallos preexistentes + 1 aserción obsoleta que esta entrega corrige |
| `npx vitest run phone-identity + channel-mesh + boss-omnichannel` | foco | **41 passed / 1 skipped** |
| `npx tsc --noEmit` (apps/dashboard) | app | **2 errores**, ambos en `CustomSwap.tsx` y `swap/TokenRoutes.tsx` (tipos de swap, preexistentes; ningún archivo tocado aparece) |
| `bun run build` (packages/shared) | paquete | OK; `whatsappInboundRateLimiter` presente en `dist/index.{js,mjs,d.ts}` |

Fallos preexistentes que **no** introduce esta entrega y quedan documentados:
`claim-provenance CPI-004`, `media-generation TC-11`, `production-readiness session tokens`,
`controlplane-adversarial ATTACK 05` (este último también falla en `HEAD` al correr la suite completa).

`npx tsc -p packages/hermes-core/tsconfig.json` **no es un gate válido** en este monorepo: reporta
~27 000 errores preexistentes porque resuelve tipos desde `dist` de paquetes internos. El gate real es
el `tsc --noEmit` de la app.

## 4. Lo que ya estaba bien (verificado, no se tocó)

- **HMAC del webhook**: `POST` sin firma → 401; firma falsa → 401; `GET` de verificación → 200.
- **Idempotencia**: `idx_whatsapp_messages_incoming_wamid_unique`, claim atómico con
  `onConflictDoNothing`, dedupe en memoria y nonce por sesión firmada. Además
  `idx_nda_email_version`, `uq_access_requests_room_email`, `idx_pof_room_email`.
- **Aislamiento por tenant**: destino por `phone_number_id` (fail-closed), runtime con
  `organizationId: tenant.slug`, respuesta con `tenant.secrets`, knowledge filtrado por organización
  y conversación con prefijo por tenant.
- **Knowledge gobernado**: sólo `ACTIVE` entra al contexto; un ACTIVE por `(org, dimension, key)`;
  supersession soportada; el adapter omite hechos sin `content`.
- **Gate de tools**: cross-tenant por `organizationId`, resource scope, lista de tools restringidas,
  `authorizeAsync` antes de cualquier handler; `executive_send_whatsapp` /
  `promote_contact` / `confirm_plan` sólo proponen (`ACTION_GATEWAY_REQUIRED`).
- **Super admin**: resolución como `OWNER` verificada en logs (`Boss: true`), handoff y pausas no
  aplican al jefe por diseño.
- **Proveedor**: Ollama Cloud (`gemma4:31b`), config por tenant (`OLLAMA_<SLUG>_*`), log
  `provider=ollama-native`, sin OpenAI.
- **Contexto por contacto**: ficha del pod al contacto; directorio de pods sólo al jefe; nada de eso
  se escribe en `hermes_knowledge`.

## 5. Riesgos residuales

| # | Riesgo | Acción |
|---|---|---|
| R-1 | Sin Redis (`REDIS_URL` ausente), el rate limit es por instancia serverless | Configurar Upstash/Redis para hacerlo global |
| R-2 | El dedupe de auto-registro de leads (STEP 5) sigue comparando últimos 10 dígitos | Un extranjero con los mismos dígitos no crea lead nuevo (pérdida de dato, no de autoridad) |
| R-3 | 4 346 eventos `CRITICAL DISCLOSURE_BLOCKED` históricos | Definir retención; los nuevos bloqueos rutinarios ya son `INFO` |
| R-4 | No hay detector de inyección de prompt en la entrada | Añadir heurísticas + telemetría; el gate de tools ya impide escalar autoridad |
| R-5 | Dos rutas de webhook (`whatsapp/simple` y `v1/external/whatsapp/webhook`) | Documentado; no borrar la de bridge sin confirmar consumidor |
| R-6 | El "sello soberano" (IPFS) falla en cada mensaje | Mismo bloqueo que Punto 1: o se re-mina el contenido o se desactiva el sellado mientras no esté configurado |

## 6. Lo único que falta para "Hermes al cien"

**Actualización 24 nov 2026 — camino A ejecutado.** El vault vuelve a hidratar en el runtime
(9 artefactos en Pandora's, 16 en S'Narai) sin plaintext en Postgres, y la KEK quedó verificada
contra el contenido real. Detalle, evidencia y costo por turno:
`docs/HERMES-KNOWLEDGE-DECISION-2026-11-24.md` §4-bis.

Queda fuera, por decisión explícita: los tiers **CONFIDENTIAL (10) y SECRET (3)** de Pandora's.
No es un problema de IPFS (el contenido existe y descifra): es que se sirven al LLM remoto. Para
usarlos hace falta una ruta de modelo local o aceptar la exposición.

Resumen del hueco restante: **13 artefactos de Pandora's** (10 CONFIDENTIAL + 3 SECRET) y **5 de
S'Narai** (CONFIDENTIAL) siguen sin hidratar por diseño, más 5 stubs de S'Narai con contenido
insuficiente (`snarai-brand`, `snarai-market`, `safety_level`, `snarai-operations`, `snarai-projects`).

## 7. Acceso de Sofía (asistente personal del Fundador)

Se abrió **lectura** por el puente A2A existente, sin canal ni token nuevos:

| Mensaje | Capability | Alcance |
|---|---|---|
| `knowledge.query` | `hermes.knowledge.query` | `governedFacts` (ACTIVE con contenido) hasta el techo del agente |
| `contacts.query` | `hermes.contacts.read` | fichas de pods + colaboradores (sin token ni permisos) |
| `deals.query` | `hermes.deals.read` | Deal Rooms, sólo scope `pandoras` (fail-closed fuera) |

Techo de Sofía: `SECRET` (decisión del Fundador), reducible con `A2A_SOFIA_MAX_CLEARANCE`.
Cada lectura deja un evento `A2A_MESSAGE_RECEIVED` con metadatos, nunca contenido.
Detalle y revocación: `docs/HERMES-SOFIA-A2A-READ-2026-11-24.md`.

