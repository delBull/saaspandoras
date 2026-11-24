# Community Manager en Orca (Bot de orquestación) · plan SOLO LECTURA

Pregunta: ¿puedo cubrir el trabajo de un **especialista de Discord / Community Manager** para
captación con un **Orca Bot**, manejado internamente, con mis aprobaciones, en **solo lectura**?

Respuesta corta: **sí para la mitad analítica y de redacción; no para la mitad operativa** (publicar,
responder, moderar, asignar roles). El bot es un **copiloto**, no el CM.

---

## 1. Qué es y qué no es un Orca Bot (verificado en su documentación)

| Hecho | Implicación |
|---|---|
| Vive en **una carpeta en una computadora** y corre **con tu agente y tu plan** (OpenCode, Claude Code, Codex, Hermes Agent…) | usa la Mac Mini y tu suscripción; consume tu cuota |
| Trabaja **"on your behalf, with your access"** | si lo usa otra persona, actúa **como tú**, no con el rol de esa persona |
| Conectores nativos: **Slack, GitHub, Linear, Google, Webhooks + Composio + MCP** | **Discord NO es conector nativo**: hay que darlo por **MCP** |
| Permiso por defecto del chat: **Full access** | hay que cambiarlo a **Ask for approval** explícitamente |
| Necesita la máquina despierta; las peticiones esperan hasta un día | Mac Mini siempre encendida o servidor emparejado |
| Reglas que solo "están escritas" (no se pueden forzar): no aprobar/mergear, redactar correo en vez de enviar, tratar contenido externo como información | no son garantías: la garantía se construye **quitando accesos** |

---

## 2. Qué cubre el bot en solo lectura (el 60% del puesto)

| Tarea del CM | ¿Bot read-only? | Cómo |
|---|---|---|
| Auditar la comunidad (qué se pregunta, objeciones, tono) | ✅ | lee canales por MCP y resume |
| Plan de contenido de 4 semanas | ✅ | borradores en su carpeta/chat |
| Copy de posts, AMA, respuestas modelo | ✅ | texto para que un humano publique |
| Detectar fugas del embudo (leads que no avanzan) | ✅ | `GET /digest` de Growth |
| Reporte semanal (fuentes, clics por enlace, valor del pipeline) | ✅ | `GET /digest` |
| Brief de media para Hermes | ✅ | propuesta; la generación sigue su flujo |
| Publicar, responder, moderar | ❌ | es escritura |
| Aprobar campañas / asignar roles | ❌ | es autoridad |

---

## 3. Cómo se garantiza "solo lectura" (cuatro capas, no una)

1. **Agente en `Ask for approval`.** Nunca `Full access`. Con Codex equivale a trabajar en read-only
   hasta que apruebes.
2. **Sin conectores de escritura.** Nada de GitHub push, Slack post, Gmail send, ni webhooks de salida.
3. **Discord con un bot aparte de solo lectura.** Permisos: *Ver canales* + *Leer historial*. Denegados
   explícitamente: *Enviar mensajes*, *Gestionar roles*, *Gestionar canales*. (El bot `Hermes` que ya
   tenemos **no** sirve para esto: tiene escritura.)
4. **Cero credenciales de la plataforma.** La carpeta del bot va **fuera** del repo: sin `.env`, sin
   `HERMES_KMS_KEK`, sin la URL de Neon. Lee Growth por un **endpoint de solo lectura** con token
   acotado.

> Regla: si el bot no tiene con qué escribir, no puede escribir. Eso —y no una instrucción en el
> prompt— es lo que hace real el "solo lectura".

---

## 4. Lo que hay que construir de nuestro lado (pequeño)

| Pieza | Para qué | Tipo |
|---|---|---|
| `GET /api/v1/growth/digest?organizationId=snarai` | embudo por etapa y fuente, clics por enlace, aprobaciones pendientes, preguntas sin responder | solo lectura |
| `growth_service_tokens` (hash, org, rol, `scopes:['growth.read']`, rate limit, expiración, revocable) | que el bot consulte **sin** tocar la BD ni tu sesión | solo lectura |
| (opcional) MCP `pandoras-growth` con 3 tools de lectura | que el bot lo use de forma natural en vez de `curl` | solo lectura |

Sin esto, la única forma de darle datos es pasarle la URL de Neon: **no**.

---

## 5. Diseño del bot

**Nombre:** `S'Narai Community Copilot`
**Dónde:** Mac Mini (despierta) · **Agente:** OpenCode u Hermes Agent
**Permiso:** Ask for approval · **Carpeta:** `~/bots/snarai-copilot` (fuera del repo)
**Conectores:** ninguno de escritura; Discord por MCP con el bot lector; acceso a Growth por el digest.

**Alma (una frase):**
> "Analista de comunidad y captación de S'Narai. Lee, resume y propone. No publica, no responde, no
> aprueba y no toca dinero."

**Automatizaciones:**

| Cuándo | Qué entrega |
|---|---|
| L-V 8:00 | Digest: leads nuevos por fuente, etapas, clics, aprobaciones pendientes |
| Lunes 9:00 | Plan de contenido de la semana + 3 borradores de post |
| Viernes 17:00 | Informe semanal: qué funcionó, qué no, qué cambiar |
| Bajo demanda | "¿qué objeciones aparecieron esta semana?" · "redacta el post del AMA" |

**Los borradores salen como texto.** Publicar es decisión humana.

---

## 6. El especialista humano: cuándo sí

El bot no juzga contexto político, no negocia en un hilo tenso y no responde en tiempo real. Cuando el
volumen lo justifique:

- El humano entra por el **portal** con su login de thirdweb y el rol **`COMMUNITY_MANAGER`** (ya
  construido: embudo, campañas con aprobación, sin finanzas).
- El bot queda como **su asistente**: le prepara el plan, los borradores y el reporte.
- El humano publica y modera con el bot `Hermes` (que sí tiene escritura) **o** con su cuenta de
  Discord; el bot lector nunca escribe.

---

## 7. Fases

| Fase | Qué | Criterio |
|---|---|---|
| **0** | Digest endpoint + token de lectura + bot en Ask for approval | el bot produce el primer reporte sin poder escribir nada |
| **1** | Calendario de 4 semanas y borradores | tú apruebas contenido en el chat del bot |
| **2** | Publicación asistida: el borrador se pega en el portal/Discord por un humano | 2 semanas sin correcciones mayores |
| **3** | Contratar al CM humano con rol y bot como asistente | el bot ya no es el cuello de botella |

---

## 8. Riesgos abiertos

1. **`Full access` por defecto** en Orca: hay que cambiarlo a mano en cada bot.
2. **Discord sin conector nativo**: el MCP es una pieza más que mantener y auditar.
3. **Contenido de terceros**: mensajes de Discord pueden intentar dirigir al bot; se mitiga con Ask
   for approval y sin permisos de escritura.
4. **Consumo de tu plan de agente** (4 corridas programadas al día + uso interactivo).
5. **Máquina despierta**: si duerme, las corridas se pierden hasta que vuelva.
6. **El bot actúa como tú**: no lo compartas con terceros; para el empleado, su login y su rol.
