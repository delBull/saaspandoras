# S'Narai · Auditoría de readiness + estrategia de captación (24 nov 2026)

Alcance: portal y proyecto real (`/Users/Marco/Documents/Company/Aztecas/Proyectos/Narai/apps/web`),
su lugar como tenant en `dash.pandoras.finance` (Growth / Hermes / RWA) y el plan de Discord.
Todo lo que sigue está verificado en código o en base de datos; lo inferido va marcado como tal.

---

# Resumen ejecutivo

| Pregunta | Veredicto |
|---|---|
| ¿S'Narai está listo para vender desde su portal? | **Sí.** El cobro es real (paylink a Pandora's whitelabel, HTTP 200) y el precio por fase está definido. Falta **explicar** la diferencia entre costo por participación y paquetes, y limpiar el `.env.example`. |
| ¿Sirve como tenant interno de Pandora's? | **Sí, ya lo es.** `projects.id=17`, `slug=snarai`, `status=live`. Growth y Hermes tienen todo lo necesario; RWA es donde debería cerrarse la venta. |
| ¿Dónde va la estrategia de Discord? | **Growth OS**, como él intuyó — con Hermes capturando la conversación y RWA cerrando la transacción. Discord **no** debe ser el CRM. |

**Estructura de precios (verificada — corregida el 24 nov 2026):**

No hay tablas contradictorias: hay **dos conceptos distintos** que el copy mezcla.

| Concepto | Valores | Fuente |
|---|---|---|
| **Costo de participación** (por título) | **Fase 1 $50 · Fase 2 $75 · Fase 3 $100 USD** (las fases se desbloquean) | `src/lib/marketing/snarai-materials.ts` |
| **Paquetes opcionales** (más beneficios) | $500 Explorer (10 CP) · $2,500 Residente (50 CP) · $25,000 Institutional (500 CP) · $100,000 Riviera (2,000 CP) | `src/constants/memberships.tsx` |
| **Fases comerciales** | `fundador` · `estratégica` · `pública` | `src/hooks/useCheckout.ts` (`phaseSlugMap`) |

`src/knowledge/snarai.ts` mezcla ambos ($50 = participación fase 1; $500/$2,500 = paquetes), y
`messages/es.json` nombra las fases como “Miembro Fundador / Estratégico / General”. **No es un
conflicto de precios: es falta de una explicación única.** El trabajo pendiente es redactar esa
explicación en landing, white paper y knowledge, no “elegir una tabla”.

**Cobro (verificado):** es real y ocurre en Pandora's como whitelabel. `useCheckout.proceedToPayment()`
abre `https://dash.pandoras.finance/pay/snarai/<fundador|estratégica|pública>?quantity=…&ref=…&utm_*`
— comprobado en producción: **HTTP 200**. El checkout (`pay/[slug]/[tier]/CheckoutClient.tsx`, 1,266
líneas) usa `ensure-pandora-key`, `fast-lane` (SPEI) + `fast-lane/confirm`, `dao/register-holder` y tipo
de cambio USD→MXN. **No hay mock en el cobro.** El “mock balance” que reporté antes vive en
`/protocol/market/[id]`, que es el mercado de lectura, **no** la caja de S'Narai.

**Landmine detectado:** `NEXT_PUBLIC_DASHBOARD_URL` sólo existe en `.env.example` y apunta a
`https://dashboard.narai.mx`, que **no resuelve** (DNS). El `.env` real usa
`NEXT_PUBLIC_PANDORAS_API_URL=https://dash.pandoras.finance`, que sí funciona. Si alguien copia el
`.env.example` a producción, **el botón de pago muere**. Corregir el ejemplo.

**Claims (corregido y commiteado):** se eliminaron “12–15%”, “40% más”, “35–40%”, “noches
garantizadas” y el error “Riviera Maya” en ES/EN y en `FoundersPlaybook` (commit `afeff63` del repo
de S'Narai). No se tocaron los disclaimers de riesgo, que dicen lo correcto (“el capital no está
garantizado”).

---

# Parte A · Auditoría del portal S'Narai

## Lo que sí está listo (verificado)

| Pieza | Evidencia |
|---|---|
| Narrativa institucional | white paper, data room (20 documentos institucionales), due diligence index, project status, partners, legal |
| Gobernanza | `/dao-rules` con quórum 10%, votación 24 h, timelock 24 h, dispersión en USDC (7 días) |
| Academia | módulos y walkthrough |
| Captación de leads | `submitLead`, `registerGestor`, verificación por PIN (`verifyGestorEmail`) |
| Datos reales de marketing | `marketing_leads` 206 · `marketing_identities` 296 |
| Portal del inversionista | magic link, portafolio, estado del proyecto, reporte, transparencia |
| Programa de gestores | panel, referrals, decisiones, recomendaciones |
| i18n | ES/EN completo |

## Lo que falta para “vender”

| # | Faltante | Impacto |
|---|---|---|
| A-1 | Unificar precios/tiers en **una** fuente y propagarla a landing, knowledge, PDF y portal | crítico |
| A-2 | Cerrar el cobro: botón de compra real en el mercado RWA (o deep-link a la Edge API con sesión), con POF y contrato | crítico |
| A-3 | Inventario verificable (hoy el knowledge declara `availableUnits: 30000`; el sitio no consulta inventario real) | alto |
| A-4 | Limpiar claims del copy (12–15%, 40%, noches garantizadas) y el error “Riviera Maya” | alto |
| A-5 | Confirmar que `globalPortalUrl` apunta al protocolo correcto (id 17) en producción | medio |

**Mi lectura:** A-1 y A-4 son trabajo de una tarde; A-2 es el único que exige desarrollo real y
probablemente ya existe del lado de la Edge API (el webhook lo sugiere). Nada de esto invalida el
producto: invalida **empezar a pagar por tráfico** antes de cerrarlo.

---

# Parte B · S'Narai como tenant interno

S'Narai **ya es** un proyecto de Pandora's (`projects.id=17`, `slug=snarai`, `status=live`). Lo que
falta no es darlo de alta, es usarlo.

| Portal | Qué aporta hoy | Rol propuesto para S'Narai |
|---|---|---|
| **Growth OS** (`/portal/snarai/growth`, `/crm`) | `crm_opportunities` con etapas (`nuevo → contactado → calificado → discovery_solicitado → visita_realizada → propuesta → ganada/perdida`), valor estimado y cerrado, atribución `source/utm_source/utm_medium/utm_campaign`, export CSV, aprobaciones, analytics y automatizaciones | **Dueño del embudo**: de dónde vino cada interesado, en qué etapa está, cuánto vale |
| **Hermes OS** (`/admin/hermes`) | 16 artefactos de conocimiento de S'Narai hidratados desde el vault (sin `MISSING`), canales WhatsApp/Telegram, mesh de canales, propuestas gobernadas | **Captura y calificación conversacional**: responde, califica y propone; no escribe en CRM sin aprobación |
| **RWA** (`/protocol/market/17`) | listings, NAV, configs, gobernanza, participaciones vía Edge | **Cierre**: certificado, POF, pago, registro |

**Regla de oro:** Discord capta, Growth mide, Hermes conversa, RWA cobra. Ninguno invade al otro.

## Lo que falta para operar como tenant de marketing

1. Pipeline propio de S'Narai (hoy las 12 oportunidades existentes son de otra organización).
2. Campañas de Growth con `utm_campaign` por canal y contenido, no sólo por link.
3. Un panel de embudo para S'Narai (la página existe; hay que poblarla y definir stages).
4. Puente Discord → lead (hoy sólo hay webhooks de notificación saliente).

---

# Parte C · Estrategia de Discord

## Decisión: dos capas, no una

| Capa | Visibilidad | Contenido | Quién entra |
|---|---|---|---|
| **Capa 1 · `#s-narai` (pública)** | Visible para todo el servidor de Pandora's | tesis, avance de obra, renders, AMAs, educación (qué es un certificado de participación), no-precio | cualquiera |
| **Capa 2 · `#s-narai-miembros` (privada)** | Canal de solo lectura con rol verificado | documentos del data room, calendario de visitas, preguntas de due diligence, avisos de disponibilidad | rol verificado por correo/portal |

**Por qué híbrido:** Discord es público por naturaleza y el activo es *off-market*. Si todo es privado,
no capta; si todo es público, se filtra el deal y se promocionan cifras sin NDA. La capa 1 capta, la
capa 2 retiene y eleva la intención.

**El rol verificado** se obtiene registrando el correo en `snarai.aztecaz.xyz` y verificando en
`/admin/discord-verify` (ya existe la página). Eso convierte a Discord en un **canal de conversión**,
no sólo de comunidad.

## Estructura propuesta (mínima, dentro del servidor de Pandora's)

```
CATEGORÍA · S'NARAI (pública)
  #s-narai-anuncios        avisos oficiales (solo staff)
  #s-narai-la-oportunidad  qué es, tesis, por qué Bucerías
  #s-narai-avance          hitos de obra y operación
  #s-narai-preguntas       dudas públicas (moderadas)
  #s-narai-amas            eventos con fecha/hora
CATEGORÍA · S'NARAI MIEMBROS (privada, rol verificado)
  #miembros-documentos     índice del data room
  #miembros-visitas        agenda de visitas al desarrollo
  #miembros-due-diligence  preguntas técnicas con el equipo
```

## Cómo se capta atención (mecánica, no inspiración)

1. **Cada publicación con enlace atribuible**: `https://snarai.aztecaz.xyz?utm_source=discord&utm_campaign=<poste>`
   o el link de radar `/l/<code>` de Pandora's, que ya registra apertura y redirige a `/pitch/<pod>`.
2. **Cada AMA deja un CTA único**: “acceso al data room → registra tu correo”, no “visita la web”.
3. **Ritmo semanal fijo** (predecible = autoridad):
   - Lunes: tesis / educación (un concepto financiero explicado sin promesas).
   - Miércoles: avance real (obra, licencias, operación).
   - Viernes: pregunta abierta + AMA quincenal.
   - Mensual: “mes en 5 datos” con cifras verificables.
4. **Colaboración con los otros canales**: cada post de Discord se reutiliza en WhatsApp/Telegram vía
   Hermes (mismo texto, distinto enlace de atribución).

## Reglas de cumplimiento (no negociables)

- Nunca precio, retorno proyectado, “garantizado”, “noches garantizadas” ni comparativos de rendimiento.
- Toda mención de inversión lleva la declaración de riesgo y remite al white paper.
- El data room se menciona, **no** se enlaza en público: se entrega tras NDA/registro.
- Moderación con regla escrita: se borra cualquier cifra de retorno publicada por terceros.

## KPIs del canal

| Etapa | Métrica | Meta inicial |
|---|---|---|
| Atención | miembros nuevos / semana | 25 |
| Activación | verificados (correo) / miembros | 20% |
| Intención | clics atribuidos por publicación | 15% de miembros activos |
| Conversión | leads calificados en CRM | 5 / semana |
| Cierre | participaciones (RWA) | 1–2 / mes |

---

# Parte C-bis · Implementación de Discord (cableada)

## Flujo de vínculo (identidad + wallet + membresía)

```
#s-narai (público)  →  "Verifica tu acceso"  →  /api/v1/discord/oauth/start
   → Discord OAuth (identify)  →  /api/v1/discord/oauth/callback
   → token de vínculo firmado (HMAC, 10 min)  →  /discord/link?t=…
   → el usuario firma con su wallet  →  /api/v1/discord/link
   → se guarda el vínculo + se asignan/quitan roles en el servidor
```

El OAuth prueba **quién es en Discord**; la firma prueba **qué wallet posee**. Sin las dos cosas no
se escribe ningún vínculo ni se asigna un rol.

## Archivos

| Archivo | Función |
|---|---|
| `src/lib/discord/config.ts` | env + política fail-closed (sin variables no opera) |
| `src/lib/discord/membership.ts` | resolución de nivel (puro, testeado) + mapa de roles |
| `src/lib/discord/membership-db.ts` | membresía real por wallet: órdenes pagadas + certificados emitidos |
| `src/lib/discord/oauth.ts` | authorize URL, canje de código, token de vínculo firmado |
| `src/lib/discord/roles.ts` | asignación de roles vía REST (sin dependencias nuevas) |
| `src/app/api/v1/discord/oauth/{start,callback}/route.ts` | flujo OAuth |
| `src/app/api/v1/discord/link/route.ts` | cierre del vínculo + sync de roles + auditoría |
| `src/app/discord/link/page.tsx` | página de firma con wallet |
| `scripts/discord-provision-snarai.ts` | crea categorías, canales y roles (idempotente) |

## Regla de niveles (no se inventan cantidades)

- **Acceso (rol verificado):** orden pagada/verificada **o** certificado emitido **o** concesión manual.
- **Nivel:** sólo por **certificados emitidos** (1 / 50 / 500 / 2,000). Una orden pagada que no
  registra cuántos certificados incluye **no** da nivel.
- El bot sólo toca los roles que gestiona (`allManagedRoles`); el resto del servidor queda intacto.

## Estado real de datos (24 nov 2026)

```
tenant_nft_issuances (proyecto 17): 11 filas, TODAS pending_mint, 1 wallet
commercial_orders (org snarai):     0
```

Traducción: **todavía no hay participantes confirmados**. El sistema está listo y no asignará nada
hasta que exista un mint confirmado o una orden pagada; el primer miembro se verificará solo.

## Estado ejecutado (24 nov 2026)

**Roles creados** en el servidor *Pandora's Finance* (`914994498914906142`), idempotente:

```
S'Narai · Miembro            1574889581625483496
S'Narai · Explorer           1574889583261515877
S'Narai · Residente          1574889584373014800
S'Narai · Institucional      1574889585320665178
S'Narai · Riviera            1574889586453258281
S'Narai · Acceso verificado  1574889587677995101
```

**Canales: bloqueado por permisos.** `POST /guilds/{guild}/channels` → `403 Missing Permissions`.
El bot necesita **Gestionar canales** (Manage Channels) y ver la categoría. Mientras tanto la
estructura queda definida y el script la crea tal cual en cuanto se conceda.

**Invitación del servidor:** `https://discord.gg/YzC4EugdPT` (permanente).

**Sin client secret.** El `.env` del gateway sólo trae `DISCORD_BOT_TOKEN`, así que el vínculo usa el
camino que no necesita OAuth:

```
usuario escribe /vincular al bot
  → gateway pide un token a POST /api/v1/internal/discord/link-token (x-internal-secret)
  → bot le manda por DM https://dash.pandoras.finance/discord/link?t=…
  → el usuario firma con su wallet → roles asignados
```

La identidad la prueba el bot (es el autor del mensaje); la posesión de la wallet, la firma. El flujo
OAuth queda implementado y dormido: si algún día agregas `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET`,
funciona sin cambios de código.

**Herencia a otros tenants:** la integración ya no está atada a S'Narai. `lib/discord/tenants.ts` es un
registro (`slug`, `projectId`, `organizationId`); para habilitar otro tenant basta agregar su entrada.
El `projectId` puede omitirse: se resuelve por `projects.slug` y se cachea.

## Para activarlo (5 variables en Vercel)

```
DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET   → app de Discord (scope identify)
DISCORD_BOT_TOKEN / DISCORD_GUILD_ID        → bot con permiso "Manage Roles"
DISCORD_OAUTH_REDIRECT_URI                  → https://dash.pandoras.finance/api/v1/discord/oauth/callback
DISCORD_LINK_SECRET                         → secreto propio (o reutiliza NEXUS_DEAL_TOKEN_SECRET)
```

Los ids de rol se obtienen ejecutando el aprovisionamiento:

```
bun run scripts/discord-provision-snarai.ts            # plan, sin tocar la API
bun run scripts/discord-provision-snarai.ts --apply    # crea y devuelve los ids
```

El bot necesita: `Manage Roles` (con su rol **por encima** de los roles de nivel), `Manage Channels`
(sólo para el aprovisionamiento) y `View Channels` en las categorías.

## Mantenimiento

- Re-sincronizar tras una compra: `POST /api/v1/discord/link` con un token nuevo (o un cron que
  recorra los vínculos y llame `syncMemberRoles`). El motor ya está separado para ese uso.
- Revocar: poner `status='REVOKED'` en `channel_identity_bindings` y volver a sincronizar.

---

# Parte D · Veredicto de integración

**Sí: Growth OS.** Es el único que ya tiene pipeline, etapas, valor, atribución por UTM, export y
aprobaciones. Hermes no debe cargar el CRM (es capa de propuesta y conversación) y RWA no debe cargar
marketing (es transacción y cumplimiento).

**Qué construir (mínimo, en orden):**

| # | Pieza | Por qué |
|---|---|---|
| 1 | Endpoint de ingesta Discord → `marketing_leads` (`source='discord'`, utm del enlace) | sin esto no hay atribución |
| 2 | Pipeline S'Narai en `crm_opportunities` (org del proyecto 17) con las etapas ya existentes | medir avance real |
| 3 | Generador de enlaces `/l/<code>` por publicación/campaña | atribución por post, no por canal |
| 4 | Panel `/portal/snarai/growth` poblado (funnel + fuentes + valor) | decisión semanal con datos |
| 5 | (Después) comando de bot `/snarai` para consultar estado y pedir acceso | reduce fricción |

**Lo que NO haría:** un bot nuevo de comunidad desde cero. Los webhooks y la página de verificación ya
existen; conviene usarlos antes de añadir superficie.

---

# Parte E · Plan

**Semana 0 (bloqueadores):** unificar precios → una sola fuente; limpiar claims; decidir la ruta de cobro.
**Semanas 1–2:** pipeline S'Narai + ingesta Discord + enlaces atribuibles + panel de funnel.
**Semanas 3–4:** abrir `#s-narai` público con calendario de 4 semanas; primera AMA; medir activación.
**Mes 2:** capa de miembros (rol verificado) y primeras visitas; iterar con datos de CRM.
**Mes 3:** escalar lo que funcione; cortar lo que no.

---

# Decisiones que necesito del Fundador

1. **¿Cuál tabla de precios es la verdad?** (la de `memberships.tsx`, la de `knowledge/snarai.ts`, o la
   de gobernanza). Sin esto no se puede tocar landing, PDF ni campañas.
2. **¿La venta se cierra en el mercado RWA con botón propio, o se delega a la Edge API** con deep-link?
3. **¿Autorizas abrir `#s-narai` público** en el servidor de Pandora's, con la capa de miembros detrás
   del registro?
