# Auditoría de información y navegación — Nexus (nexus.pandoras.finance)

Fecha: 20 nov 2026 · Alcance: `/nexus/*`, Operations Hub, shell y overlays.
Tipo: **inspección de solo lectura**. No se modificó código.

---

## 1. Mapa actual (lo que existe hoy)

### Superficies

| Superficie | Tipo | Archivo | LOC |
|---|---|---|---|
| Command Center (home) | página | `app/nexus/NexusCommandCenter.tsx` + `shell/NexusWorkspace.tsx` | 571 + 273 |
| Operations Hub | **modal** | `components/nexus/OperationsHubModal.tsx` | 996 |
| Unified Index | **modal** | `components/nexus/UnifiedIndexModal.tsx` | 345 |
| Agenda | página | `app/nexus/agenda/page.tsx` + `AgendaListClient` | 196 + cliente |
| Data Room | página | `app/nexus/rooms/page.tsx` + `DealRoomConsole` | 31 + consola |
| Presentations | página | `app/nexus/presentations/page.tsx` | 150 |
| Settings | página **y** modal | `app/nexus/settings/*` + render dentro de `NexusCommandCenter` | 33 + cliente |
| Meet (sala) | página | `app/nexus/meet/*` | — |
| Presence Dock | overlay persistente | `components/nexus/presence-dock.tsx` | 1,057 |

### Tabs del Operations Hub

`MY WORK & TASKS` · `OPS REGISTER` (condicional) · `CLIENTS & CRM` · `AGENDA` ·
`DATA ROOM & VAULT` · `COHORTS` (condicional) · `KNOWLEDGE BASE` ·
`ACTIVITY & INCIDENTS` · `APPROVALS`

### Sidebar

**15 ítems, 12 de ellos son `href="#"`** que abren el mismo modal en un tab distinto.
Solo 3 son rutas reales: Command Center, Presentations y (parcialmente) Settings.

Hay dos ítems que abren **el mismo tab**: “Organizations” y “Deals” → `CLIENTS`.

---

## 2. Los cinco problemas que producen la sensación de desorden

### P1. El hub no es una pantalla, es un modal encima de otra pantalla

- `max-w-5xl` (1,024 px) y `max-h-[92vh]` sobre un viewport de 1,440–1,920 px:
  **se desperdicia 30–50% del ancho** justo en la pantalla con más información
  (CRM tiene dos columnas dentro de ese ancho).
- Sin `role="dialog"`, sin `aria-modal`, sin `Escape`, sin focus trap.
- Fondo vivo detrás (workspace + overlay 80% negro + blur): la vista “respira” pero
  no queda claro si estás navegando o haciendo una acción puntual.

### P2. No hay URL: el estado no se puede compartir, refrescar ni recuperar

- El tab activo vive en `useState`, no en la URL. `?tab=` no existe.
- Refrescar cierra el hub y te devuelve al Command Center.
- El botón “atrás” del navegador no cierra el hub.
- No se puede mandar a alguien un link a “Approvals” o a un deal concreto.
- Contraste: `/nexus/agenda` **sí** es ruteable, por eso el equipo la usa y el tab
  del hub queda huérfano.

### P3. Dominios duplicados: dos agendas, dos data rooms, dos catálogos

| Dominio | En el hub | Como página | Consecuencia |
|---|---|---|---|
| Agenda | `OperationsAgendaTab` (lista, compartir) | `/nexus/agenda` (agendar, editar, archivar, detalle, minuta, seguimiento) | El tab parece “la agenda” pero **no puede** hacer lo que la página |
| Data Room | tab `DATAROOM` (fetch propio de deals) | `/nexus/rooms` (consola con unlock) | Dos lecturas distintas del mismo dato |
| Presentaciones | **no** está en el hub | `/nexus/presentations` | Correcto: no hay duplicado |

> Corrección de la inspección inicial: el tab `KNOWLEDGE` **no** es el catálogo de
> presentaciones; es el vault de conocimiento (Academia, guías y Hermes). Se queda.

Esto explica la confusión: **el mismo nombre lleva a dos lugares con capacidades
distintas**, y no hay una regla visible de cuál es el bueno.

### P4. La home muestra datos que no existen

En `NexusWorkspace.tsx` hay valores **hardcodeados**:

```
"All Systems Operational"        (siempre verde)
Attention Required · "3 Items"   (3 filas inventadas: Stripe webhook, multisig, colaborador)
Active Orgs 12 · Open Deals 8 · Pending Approvals 4 · Unresolved Incidents 1
```

No se derivan de la DB. Bajo el modelo del repo (sección 11: nunca fabricar estados)
esto es lo más grave de la auditoría: **la primera pantalla miente**. Un operador
puede creer que hay 4 aprobaciones cuando hay 0.

### P5. Demasiadas capas a la vez

En `NexusCommandCenter` se montan simultáneamente: sidebar, header, workspace,
command palette, presence dock, Operations Hub, notification modal, settings y
Hermes drawer. Todos con `z-50` o similar. No hay una regla de “una sola capa”.

A esto se suma la densidad interna: CRM son **767 líneas** con estado local para
agendar, deck, invitados y resultado; el tab de tareas **601**; broadcasts **529**.
Todo dentro del mismo contenedor de 1,024 px.

---

## 3. Diagnóstico en una frase

> El Operations Hub intenta ser **seis productos a la vez** dentro de una ventana
> de 1,024 px, sin URL, con datos de portada inventados y con tres dominios que
> también existen como páginas completas en otro lugar.

---

## 4. Propuesta de arquitectura de información

### 4.1 Regla base

**Una superficie = un dominio = una URL.** El modal se reserva para acciones
puntuales (confirmar, editar un campo, ver un detalle), nunca para navegar.

### 4.2 Mapa destino

```
/nexus                     Command Center (home real, datos reales)
/nexus/ops                 Operations Hub (full screen, ruta propia)
   ├─ /nexus/ops/work      Mi trabajo y tareas
   ├─ /nexus/ops/clients   Clients & CRM  (lista + detalle + actividad)
   ├─ /nexus/ops/approvals Aprobaciones
   ├─ /nexus/ops/activity  Actividad e incidentes
   └─ /nexus/ops/knowledge Knowledge base
/nexus/agenda              Agenda (única; el hub enlaza aquí, no la duplica)
/nexus/rooms               Data Room (única)
/nexus/presentations       Presentaciones (única)
/nexus/settings            Settings (única; el modal solo para cambios rápidos)
/nexus/meet/[id]           Sala
```

Cambios de fondo:

1. **El hub deja de ser modal y pasa a layout de ruta** con `flex-1 w-full`:
   ocupa todo el ancho disponible, header propio y tabs que son **links**.
2. **El sidebar apunta a rutas**, no a `#`. Se elimina la duplicidad
   “Organizations/Deals” → un solo ítem “Clients & CRM”.
3. **Agenda, Data Room y Presentaciones salen del hub**: el hub las enlaza con
   una tarjeta “ir a la pantalla completa”. Una implementación, un dueño.
4. **Estado en la URL**: `?status=`, `?stage=`, `?q=`, `?deal=`. Sobrevive a
   refresh, se comparte y funciona el botón atrás.
5. **Una capa a la vez**: si el hub está abierto (cuando aún se use como modal de
   acción), el dock, el drawer de Hermes y el index se ocultan (hoy el dock ya lo
   hace; falta el resto).

### 4.3 Patrón de pantalla: “Qué / Cómo / Cuándo”

Cada tab responde tres preguntas en el mismo orden visual:

| Bloque | Contenido | Ejemplo (Clients & CRM) |
|---|---|---|
| **Qué** | título + una línea de propósito + métrica principal | “Clientes y deals · 7 activos · 2 sin siguiente paso” |
| **Cómo** | acción primaria + filtros guardados | “Nuevo deal” · `Hoy` `Esta semana` `Requiere acción` |
| **Cuándo** | vista temporal / orden por urgencia | columna de próxima acción con fecha vencida en rojo |

### 4.4 Pantalla de Clients & CRM (la que hoy más duele)

Tres columnas en desktop, una en móvil:

```
┌──────────────┬────────────────────────────┬───────────────┐
│ Lista        │ Detalle del deal           │ Actividad     │
│ búsqueda     │ contexto, deck, sesiones   │ timeline      │
│ filtros      │ próximos pasos             │ notas         │
│ 320–380 px   │ flexible                   │ 300–360 px    │
└──────────────┴────────────────────────────┴───────────────┘
```

- Búsqueda por nombre/empresa/email (hoy no existe).
- El drawer de agendar deja de ser un panel que empuja contenido: pasa a ser
  columna derecha o modal de acción de 520 px.
- “Últimas sesiones” (ya construido) vive en la columna de detalle.

### 4.5 Home honesto

- KPIs desde la DB (`count` real por estado); si falla → **`UNAVAILABLE`**, nunca `0`
  ni un número fijo.
- “Attention Required” desde aprobaciones/incidentes reales; si no hay → estado vacío.
- Quitar “All Systems Operational” salvo que exista un health check que lo respalde.
- Si en esta fase no hay datos, mostrar `NOT_CONFIGURED` explícito.

---

## 5. Roadmap propuesto (sin ejecutar)

| Fase | Qué | Riesgo | Estimado |
|---|---|---|---|
| **P0** | Quitar datos inventados de la home; derivar KPIs o mostrar `UNAVAILABLE` | Bajo (solo UI) | 2–3 h |
| **P1** | Hub → ruta `/nexus/ops` full screen, tabs como links, `?tab` en URL | Medio (navegación) | 1–2 días |
| **P2** | Sidebar a rutas reales; unificar “Organizations/Deals”; enlaces canónicos | Medio (puede romper hábitos) | 1 día |
| **P3** | CRM a 3 columnas con búsqueda/filtros/persistencia en URL | Medio-alto (reescritura del tab) | 2–3 días |
| **P4** | Retirar tabs duplicados (Agenda/Data Room/Presentaciones) y dejar enlaces | Bajo, pero requiere decidir dueño | 1 día |
| **P5** | Accesibilidad y capas: Escape, focus trap, una capa a la vez | Bajo | 4–6 h |

Orden sugerido: **P0 → P1 → P2 → P3 → P4 → P5**. P0 y P1 dan el 70% de la
sensación de orden con ~2 días de trabajo.

---

## 6. Decisiones que se necesitan antes de tocar código

1. **¿El hub se queda como modal para “vistazo rápido” o se elimina?**
   Recomendación: eliminarlo como modal; ruta full screen.
2. **¿Agenda/Data Room/Presentaciones viven en el hub o en su página?**
   Recomendación: página; el hub solo enlaza.
3. **¿Quién es el dueño de “Clients & CRM”?**
   Hoy hay dos: el tab del hub y `/api/nexus/deals`. Definir una sola pantalla.
4. **¿La home puede mostrar `UNAVAILABLE` mientras no haya telemetría?**
   Recomendación: sí; es preferible a números fijos.
5. **¿Se acepta mover rutas** (`/nexus/ops/*`) con redirects desde el estado actual?
   Recomendación: sí, con redirects para no romper enlaces existentes.

---

## 7. Lo que NO se toca en esta propuesta

- Contratos de datos (`nexus_deal_rooms`, `nexus_presentations`, `meetings`).
- Autoridad (capabilities, tenant scope, RLS): la navegación no cambia permisos.
- La sala (`/nexus/meet`) y el deck público.
- Endpoints ya usados por CRM/agenda; solo se reutilizan.

---

## 8. Evidencia de la inspección

| Hallazgo | Evidencia |
|---|---|
| Hub es modal de 1,024 px | `OperationsHubModal.tsx:404` → `max-w-5xl max-h-[92vh]` |
| Sin URL/Escape/dialog | sin `searchParams`, `Escape`, `role="dialog"` en el archivo |
| 12 de 15 ítems del sidebar abren modal | `NexusSidebar.tsx` → `href: "#"` + `action` |
| Dos ítems al mismo tab | “Organizations” y “Deals” → `action: "CLIENTS"` |
| Home con datos fijos | `NexusWorkspace.tsx` → `12 / 8 / 4 / 1`, “3 Items”, “All Systems Operational” |
| Agendas duplicadas | `OperationsAgendaTab` (267 LOC) vs `app/nexus/agenda/*` (196 + cliente) |
| Sin búsqueda en CRM | `OperationsClientsTab.tsx` no tiene estado de búsqueda ni filtros |
| 6 overlays montados | `NexusCommandCenter.tsx` líneas 370–570 |


---

## 9. Estado de ejecución (20 nov 2026)

| Fase | Estado | Qué se hizo |
|---|---|---|
| **P0** | ✅ hecho | Home sin datos inventados: KPIs desde `/api/nexus/{deals,approvals,incidents,agenda}`, estado derivado y `—` cuando la fuente falla. “Attention Required” y “Recent Activity” desde datos reales; sin pendientes → estado vacío honesto. |
| **P1** | ✅ hecho | `/nexus/ops` como ruta: hub full screen dentro del área de contenido (sidebar y header visibles), tabs en la URL (`?tab=`), refresco y “atrás” funcionan. `mode="fullscreen"` en el componente; el modal dejó de usarse para navegar. |
| **P2** | ✅ hecho | Sidebar a rutas reales (12 `href="#"` → rutas). “Organizations” y “Deals” se fusionan en **Clients & CRM**. Header apunta a `/nexus/ops`. `middleware` actualizado con `/ops` en `nexusSubmodules` (sin esto, `nexus.pandoras.finance/ops` daba 404). |
| **P3** | ✅ hecho | CRM: búsqueda, filtro por estado, contador `n/total`, selección en `?deal=` y filtros en `?q=`/`?status=`. Placeholders eliminados (“N/A”, “Revisar expediente”, “Owner: Nexus”). Layout de **3 columnas** (lista · detalle · actividad/sesiones) a partir de 1536 px; por debajo, el rail baja debajo del detalle. Verificado con capturas a 1920×1080 y 1366×768. |
| **P4** | ✅ hecho | Retirados del hub los tabs duplicados `AGENDA` y `DATA ROOM` (sus páginas son más completas). `OperationsAgendaTab.tsx` eliminado por quedar huérfano. Enlaces viejos (`?tab=agenda|rooms`) redirigen a su pantalla. `KNOWLEDGE` se conserva (no era duplicado). |
| **P5** | ✅ hecho | Escape cierra la capa superior (hub, settings, notificaciones, Hermes). Focus trap y foco inicial en el tab activo. `role=tablist/tab/tabpanel`, flechas ←/→, `aria-selected`. El modo modal del hub se retiró: solo existe como pantalla. |

### Optimización de UX del hub (P5)

- Cabecera honesta y compacta: se quitó el badge **“LIVE”** (era estático y mentía) y la
  línea con “IP · DATA ROOM” (ya no vive ahí).
- Tabs más legibles (11 px) y con **wrap** en pantallas chicas (antes scroll horizontal
  sin affordance).
- Botón del terminal con etiqueta clara (“Terminal Hermes” / “Terminal de tareas”) y
  tooltip; antes decía `sudo wake_up_hermes`.
- Contador del CRM en español (“0 deals activos”).
- El rail de actividad se oculta del flujo principal por debajo de 1536 px (baja al
  final) para no comprimir el detalle.

### Verificación

```
bun x tsc --noEmit                    → 0 errores en los archivos tocados
vitest (nexus + meet)                 → 122 pasan, 1 skip
/ops?tab=clients (dev real)           → 200
/ops?tab=agenda                       → 307 → /nexus/agenda
/ops?tab=rooms                        → 307 → /nexus/rooms
CRM 1920×1080 y 1366×768              → capturas revisadas (3 col / 2 col)
```

### Bug corregido de paso

El rewrite del subdominio Nexus descartaba la query (`new URL('/nexus'+pathname)`),
así que `nexus.pandoras.finance/ops?tab=clients` habría abierto siempre el tab por
defecto. Ahora conserva `request.nextUrl.search`.

Dos fallos de la suite (`meeting-reaper`, `meeting-archive-policy`) son ambientales:
exigen una cadena de conexión *pooled*; no provienen de este cambio.


---

## 10. Limpieza de datos mock (20 nov 2026)

| Elemento | Antes | Ahora |
|---|---|---|
| Tareas de “My Work” | `INITIAL_TASKS` (plan de julio) + espejo en `localStorage` | **`nexus_tasks` vía `/api/nexus/tasks`**; la DB es la única fuente, sin merge con locales |
| Toggle de tarea | `POST kind=task-done` (siempre DONE, nunca reabría) | **`PATCH { action: COMPLETE \| REOPEN }`**; si falla, la UI revierte |
| Selector de tarea en Deal Room | `NEXUS_TASKS` (espejo estático) | tareas reales del API |
| `MOCK_APPROVALS` / `MOCK_INCIDENTS` | constantes muertas | eliminadas |
| Registro IP (OPS REGISTER) | 8 activos sembrados en código | **vacío**, con estado “Sin activos registrados” (el alta vive en el navegador; no hay tabla de IP) |
| “My Work” sin tareas | “✓ Todas las tareas están completadas” | “Sin tareas registradas.” |

Archivos eliminados por quedar huérfanos: `src/lib/nexus-tasks.ts` y el seed
`INITIAL_TASKS` de `taskTypes.ts`.

```
tsc --noEmit                    → 0 errores en lo tocado
vitest (nexus + meet)           → 158 pasan, 1 skip
4 archivos de test             → fallan por conexión *pooled* (ambiental)
```


---

## 11. Deal Room (`/nexus/rooms`) — 3ª columna

Problema: el **Hermes Cognitive Summary** vivía dentro del detalle, con `max-w-lg`,
y se veía recortado arriba del deal.

Cambio:

| Antes | Ahora |
|---|---|
| Resumen cognitivo dentro del detalle (`max-w-lg`) | **Rail derecho “Inspector”** con: resumen cognitivo, ficha (tipo, estado, contraparte, empresa, creador, fechas, firmantes, compartidos, tarea vinculada), controles (NDA, firma online) y última actividad |
| — | El rail aparece a partir de **1536 px** (`2xl`). Por debajo, el resumen se mantiene al final de la pestaña **Firmantes**, a ancho completo |
| Pestañas recortadas en 1366/1536 | Fila de tabs con **wrap**: nada queda oculto detrás de “Convertir en acuerdo legal” |

Componente compartido `CognitiveSummaryCard` para no duplicar el render.

Verificado con capturas headless a **1920×1080** y **1536×864** (rail visible, sin recortes).
