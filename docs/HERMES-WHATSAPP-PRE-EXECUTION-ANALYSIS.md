# Hermes · WhatsApp · Dispatcher — análisis previo a ejecución

Fecha: 23 nov 2026. Alcance: revisar contratos, ADRs y código antes de modificar nada.
Sólo análisis; no se cambió código en este paso.

## 1. Contratos y ADRs aplicables

| Documento | Regla que nos obliga |
|---|---|
| **FC-009 Omnichannel** | `Channel ≠ Surface`. El flujo es Normalize → Authenticate → Resolve Identity → Resolve Tenant → Capability → Policy → Resource Scope → Hermes. La normalización no autoriza |
| **FC-010 Memory** | Conversation ≠ Canonical Memory; memoria tenant-scoped, nunca cross-tenant |
| **FC-011 Production Truth** | Nada fabricado; estados honestos |
| **ADR-001 Kernel Stability** | El Kernel sólo se toca por problema compartido o defecto de infraestructura; no por el caso de una app |
| **ADR-005 Integration over Rewrite** | No duplicar frontends ni reescribir lo que ya funciona |

Consecuencia para este trabajo: los cambios van en el **dispatcher de la app** y, como
mucho, en el *provider* (defecto de infraestructura). No se toca el Kernel, ni el modelo de
identidad, ni el de tenants.

## 2. Lo que ya está bien (verificado, no supuesto)

| Punto | Evidencia |
|---|---|
| Webhook fail-closed | `POST /api/whatsapp/simple` sin firma → **401**; con firma falsa → **401**; `GET` de verificación → **200** |
| Ruta de producción | el canal es `/api/whatsapp/simple` (Baileys está marcado deprecado en el propio código) |
| Aislamiento de tenant en runtime | rama tenant llama `runtime.respond({ organizationId: tenant.slug })`; la maestra usa `'pandoras'` |
| Token de salida por tenant | rama tenant usa `sendReply` con `tenant.secrets`; la maestra usa el token global |
| Identidad | `InterlocutorResolver`: jefe → colaborador → identidad canónica; el contacto de pod sólo se consulta en el número maestro |
| Conocimiento por tenant | `context-merger` filtra por organización/slug/uuid; `llmConfig` puede venir del producto (`config.llm`) |
| Contexto del cliente sin knowledge global | el bloque de la ficha del pod viaja en el mensaje, no en `hermes_knowledge` |
| Duplicados | `api/v1/external/whatsapp/webhook` atiende payloads de bridge (no nativos); no es una segunda copia activa del canal de Meta |

**Corrección a lo que te dije antes:** el webhook **sí** rechaza firmas ausentes o inválidas.
Las líneas `Cabecera X-Hub-Signature-256 ausente` de los logs son requests rechazados
(probes o reintentos), no mensajes procesados. No hay hueco de HMAC.

## 3. Riesgos reales que quedan

| # | Riesgo | Impacto | Tipo |
|---|---|---|---|
| R1 | El provider cae al fallback (modelo o key de Ollama Cloud) | Hermes no razona en ningún canal | **Bloqueante** |
| R2 | `DISCLOSURE_BLOCKED` emite un evento **CRITICAL** por cada artefacto descartado en WhatsApp | Ruido en Discord; alerta de seguridad falsa en cada mensaje | Operativo |
| R3 | El provider tiene un caso especial por nombre: `organizationName.includes('snarai')` para usar `OLLAMA_SNARAI_*` | Con un tercer tenant hay que tocar código; riesgo de usar el modelo/cuenta equivocada | Arquitectura |
| R4 | Dos rutas de webhook (`simple` y `external`) con pipelines distintos | Confusión al depurar; riesgo de conectar Meta a la equivocada | Deuda |
| R5 | `whatsapp_users` y los flujos legacy siguen en la base | Duplicidad de identidad si alguien los usa | Deuda |
| R6 | `KuboRpcIpfsProvider 401` en cada mensaje | Ruido y sello soberano sin funcionar | Config |
| R7 | IPFS/registry vs `hermes_knowledge` con `content` purgado | Ambigüedad de cuál es la fuente vigente de conocimiento | Documental |

## 4. Plan de ejecución (con orden, alcance y reversa)

### Fase 0 · Provider (15 min, sin código)
- Confirmar `OLLAMA_BASE_URL=https://ollama.com`.
- Elegir `OLLAMA_MODEL` del catálogo cloud (nombre exacto).
- Guardar, desplegar y leer `FALLBACK · base=… model=… native=… v1=…`.
- **Aceptación:** respuesta real y `provider=ollama-native`.
- **Reversa:** volver el valor anterior de `OLLAMA_MODEL`.

### Fase 1 · Webhook (0–1 h, verificación + prueba)
- Documentar que Meta apunta a `/api/whatsapp/simple` y que `external/whatsapp/webhook` es bridge.
- Añadir un test que falle si el HMAC deja de validarse (hoy está bien, pero no está cubierto).
- **No se elimina** la ruta de bridge: no hay evidencia de que esté muerta.
- **Aceptación:** test verde + 401/200 comprobados en producción.

### Fase 2 · Aislamiento de tenants (3–4 h)
- Mover el caso especial S'Narai a `llmConfig` del producto/tenant, dejando las env como respaldo.
- Test de precedencia de identidad: jefe → colaborador → identidad canónica → contacto de pod → desconocido.
- Test cruzado: tenant A no ve knowledge de B; número maestro no ve knowledge de tenant.
- **Reversa:** flag por tenant; el respaldo por env sigue funcionando.

### Fase 3 · Channel Mesh (2–3 h)
- Drops rutinarios en WhatsApp → `INFO`/debug sin alerta.
- `CRITICAL` sólo si un actor **privilegiado** intenta divulgar algo restringido.
- **No** se cambia el techo `PUBLIC` de WhatsApp ni qué se descarta.
- **Aceptación:** un mensaje normal no genera alertas; un intento real sí.
- **Reversa:** restaurar el nivel del evento.

### Fase 4 · Memoria y handoff (2–3 h)
- Verificar claves de conversación por tenant + canal + teléfono.
- Pausa de handoff por tenant; jefe exento; reanudación clara.

### Fase 5 · Observabilidad (3–4 h)
- Log estructurado por mensaje (tenant, canal, actor, correlación, resultado).
- Métricas de fallback, denegaciones y handoffs.

## 5. Qué NO se toca

- Kernel, identidad canónica, modelo de tenants, contratos de pago.
- Flujos legacy de WhatsApp (`whatsapp_users`, multi-flow).
- La ruta de bridge del webhook.
- El flujo de firma, PDFs y OM (ya validados).

## 6. Orden recomendado

**Fase 0 + 1 juntas** (sin cambios de código, sólo configuración y un test).
Luego **Fase 3** (quita el ruido y devuelve confianza en las alertas) y después **Fase 2**
(aislamiento estructural para el siguiente tenant).
