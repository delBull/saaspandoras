# Community Manager con dos agentes · Arquitectura Hermes (manos) + Orca Bot (cabeza)

Decisión de partida: **el bot ejecuta**. Lo que controla el riesgo no es "solo lectura", es
**separación de identidades + aprobación humana + auditoría**.

La tesis: no hace falta contratar a un especialista para el trabajo repetitivo; hace falta un
**sistema de dos agentes** donde uno piensa y el otro actúa, y el humano decide lo sensible.

---

## 1. El reparto

```
              ┌──────────────────────────────┐
   propone    │  Orca Bot · Community Manager │  plan, drafts, auditoría, reporte
              │  (Mac Mini · OpenCode)        │  NO habla con Discord ni con la BD
              └───────────────┬──────────────┘
                              │ A2A firmado (HMAC + wallet)
                              ▼
              ┌──────────────────────────────┐
   valida     │  Hermes OS                    │  política de claims, banned_topics,
              │  (dash.pandoras.finance)      │  capability y resource scope
              └───────────────┬──────────────┘
                              │ crea aprobación
                              ▼
              ┌──────────────────────────────┐
   decide     │  Marco                        │  /growth-os/…/approvals
              └───────────────┬──────────────┘
                              │ aprobado
                              ▼
              ┌──────────────────────────────┐
   ejecuta    │  Action Gateway → Hermes bot  │  publica en Discord, asigna rol,
              │  (el bot que ya vive ahí)     │  manda DM
              └───────────────┬──────────────┘
                              │ resultado
                              ▼
                     de vuelta al Orca Bot (webhook)
```

| Pieza | Rol | Identidad | Puede escribir |
|---|---|---|---|
| **Orca Bot** | cabeza: planifica, redacta, analiza, reporta | wallet propia (nueva, registrada en A2A) | en **su carpeta** y en el chat; **nunca** en Discord ni en la BD |
| **Hermes OS** | juicio: valida contra política, crea aprobaciones | `0x76CA…` (existente) | sólo crea aprobaciones |
| **Hermes bot (Discord)** | manos: publica, responde, asigna roles | bot token (existente) | sí, **solo** por Action Gateway aprobado |
| **Marco** | autoridad | wallet | aprueba/rechaza |

Esto es exactamente la doctrina del repo: **Hermes propone, Governance autoriza, Operations ejecuta.**
No se inventa un mecanismo nuevo: se extiende el puente A2A que ya existe para Sofía.

---

## 2. Por qué así y no "dale al bot la BD y el token de Discord"

| Si el Orca Bot tuviera acceso directo | Consecuencia |
|---|---|
| URL de Neon + `HERMES_KMS_KEK` en su carpeta | puede leer/escribir todo; **salta** capabilities, approvals y auditoría |
| Token del bot con escritura | puede publicar sin pasar por política: un mensaje de Discord podría dirigirlo (prompt injection) |
| Ejecuta como Marco | ante un incidente no hay separación de identidades ni traza clara de quién actuó |

Con el diseño de dos agentes, **el que lee contenido de terceros (el Orca Bot) no tiene poder de
escritura**, y **el que tiene poder de escritura (Hermes bot) no lee contenido de terceros**: solo
recibe propuestas estructuradas y las ejecuta tras aprobación.

---

## 3. Lo que ya existe y se reutiliza (no duplicar)

| Pieza | Estado |
|---|---|
| `AgentRegistry` con agentes, wallets y `allowedCapabilities` | ✅ (Sofía y Hermes) |
| Validación A2A: protocolo, remitente, frescura, nonce anti-replay, HMAC, firma EIP-191 | ✅ |
| `POST /api/v1/a2a/messages` (ingreso firmado) | ✅ en producción |
| `A2AOutboundDispatcher.dispatch()` (salida firmada a un endpoint registrado) | ✅ — sirve para devolver resultados al webhook del Orca Bot |
| `nexus_approvals` + UI `/approvals` + `PATCH /api/nexus/approvals` | ✅ recién construido |
| Bot de Discord con roles y canales | ✅ |
| Endpoint de digest de Growth | 🟡 por construir (Fase 0) |

---

## 4. Lo que falta construir (pequeño y ordenado)

| # | Pieza | Por qué |
|---|---|---|
| 1 | **Registrar el agente `community`** en `AgentRegistry`: wallet propia, `endpoint` = webhook del Orca Bot, capacidades `community.plan`, `community.draft`, `community.propose`, `community.report` | identidad y permisos explícitos |
| 2 | **MCP/CLI `pandoras-a2a`** en la carpeta del bot: firma y envía propuestas; recibe resultados | que el bot hable A2A sin conocer secretos del servidor |
| 3 | **Implementar `capability.request` real** (hoy es un stub que responde "ACCEPTED" sin hacer nada): validar capability + política → crear `nexus_approvals` → esperar decisión → ejecutar | el corazón del Action Gateway |
| 4 | **Acción `community.publish_post`**: validar texto (banned_topics, sin precios ni retornos) → publicar en el canal vía bot → registrar en auditoría | ejecución gobernada |
| 5 | **Devolver el resultado** al webhook del Orca Bot (`A2AOutboundDispatcher`) | que el bot sepa qué pasó y reporte |
| 6 | **Digest de Growth** (`GET /growth/digest`) con token de servicio | que el bot mida sin tocar la BD |

Nada de esto crea una plataforma nueva: son extensiones del puente y del sistema de aprobaciones que
ya están en producción.

---

## 5. El ciclo completo, con un caso real

```
1. Lunes 9:00 · el Orca Bot arma el plan de la semana.
2. Detecta que #s-narai-preguntas tiene 6 dudas sin responder sobre "cómo se cede un título".
3. Redacta 3 respuestas y un post de AMA.
4. Envía a Hermes: capability.request { capability: 'community.publish_post', posts: [...] }
   firmado con su wallet.
5. Hermes valida: capability concedida, texto sin términos prohibidos, tenant correcto.
6. Crea una aprobación y te avisa en Discord (webhook del proyecto) y en /approvals.
7. Tú apruebas 2 de 3 y rechazas una ("no menciones rendimiento").
8. Hermes bot publica las 2 aprobadas en los canales; la rechazada vuelve con tu motivo.
9. El resultado viaja al webhook del Orca Bot.
10. El viernes reporta: 2 publicaciones, X clics en /l/<code>, Y registros, Z leads nuevos.
```

---

## 6. Costos: lo que se sustituye y lo que no

| Trabajo | Lo hace el sistema | Sigue siendo humano |
|---|---|---|
| Planear contenido | ✅ | — |
| Redactar posts y respuestas | ✅ (borrador + validación) | criterio final en temas sensibles |
| Publicar y moderar | ✅ vía aprobación | crisis y hilos tensos |
| Medir y reportar | ✅ | — |
| Negociar con un prospecto | ❌ | ✅ |
| Legal / claims / precios | ❌ | ✅ |

El ahorro real no es "cero personas": es **una persona rinde 3–4×** porque el sistema le quita
planeación, redacción, publicación repetitiva y reporte.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Prompt injection** desde Discord hacia el bot que lee | el que lee no escribe; las propuestas se validan contra política en Hermes |
| **Doble agente con escritura** | solo el bot de Discord escribe, y únicamente por Action Gateway aprobado |
| **Fatiga de aprobaciones** | agrupar por lote (un mensaje con 3 posts) y auto-aprobar solo categorías explícitas (p. ej. "respuesta informativa sin precio") |
| **Credenciales en la carpeta del bot** | no hay: el bot firma A2A con su wallet; no tiene `.env` del repo ni token de Discord |
| **El bot actúa como Marco** | al estar registrado como agente propio, su actor es `a2a:community`, no `marco_founder` |
| **Máquina dormida** | Mac Mini siempre encendida o servidor emparejado; las peticiones esperan hasta 1 día |
| **Costo del plan del agente** | 3–4 corridas programadas/día; el trabajo pesado lo hace Hermes con su propio modelo |

---

## 8. Fases

| Fase | Qué | Criterio de aceptación |
|---|---|---|
| **0** | Digest + token de lectura + registrar agente `community` con wallet | el bot obtiene métricas y su identidad existe |
| **1** | MCP `pandoras-a2a` + `capability.request` real + aprobación | una propuesta del bot llega a `/approvals` firmada, sin poder ejecutar |
| **2** | `community.publish_post` + resultado de vuelta | un post aprobado se publica en Discord y el bot recibe la confirmación |
| **3** | Bucle semanal automatizado (plan → propuestas → aprobación → publicación → reporte) | dos semanas seguidas sin intervención tuya salvo aprobar |
| **4** | Ampliar acciones: `community.reply_thread`, `community.schedule_ama`, `community.update_lead_stage` | cada una con su validación y su aprobación |

---

## 9. Decisión que necesito

1. ¿El **Orca Bot** propone **a Hermes** (recomendado: una sola puerta de ejecución) o publica él
   directamente con el token del bot de Discord (más simple, menos auditable)?
2. ¿Qué acciones quieres **auto-aprobadas** desde el inicio? Mi propuesta: ninguna; todo pasa por ti
   las primeras dos semanas, y luego evaluamos auto-aprobar "respuesta informativa sin precio".
3. ¿El bot corre en la **Mac Mini** (siempre encendida) o en tu laptop?
