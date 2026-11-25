# Playbook de comunidad · S'Narai

> Estado verificado el **2026-11-25**. Todo lo que dice "✅" se comprobó en producción; lo que dice
> "⏳" depende de un paso humano o de otra pieza.

## 0. Dónde estamos

| Pieza | Estado |
|---|---|
| Canales `s-narai-*` | ✅ sembrados con 3 publicaciones (avisos, oportunidad, preguntas) |
| Bot que propone (`S'Narai Manager`) | ✅ propone, nunca publica |
| Bot que lee (`S'Narai Reader`) | ✅ lee 5 canales, sin permiso de escritura |
| Aprobación humana | ✅ `/growth-os/organizations/snarai/approvals` |
| Aviso al aprobar una propuesta | ✅ in-app + webhook del canal privado |
| Publicación tras aprobar | ✅ con revalidación de política y lista blanca |
| Atribución por publicación | ✅ `opens` / únicos por `/l/<code>` · ⏳ leads (`null`) |
| Historial de decisiones | ✅ `/approvals/historial` (tasa, mediana, motivos, clics) |
| WhatsApp | ⏳ requiere plantillas aprobadas por Meta (proactivo fuera de 24 h) |
| AMA / eventos | ⏳ requiere permiso `Manage Events` |

## 1. Ciclo diario (10 minutos)

```bash
cd ~/.orca/bots/s-narai-manager

# 1. qué pasó: embudo, clics, decisiones, pendientes
./community-agent report

# 2. qué dice la comunidad: salud + spam
cd ../s-narai-reader && ./community-agent read --limit=50
```

Después, según lo que salga:

- **Hay preguntas sin responder** → el agente propone una respuesta citando lo que se preguntó.
- **Hay un hito** (obra, licencia, operación) → propone aviso para `#s-narai-anuncios`.
- **No hay nada** → no se publica nada. El silencio es válido; el relleno no.

```bash
# proponer (queda pendiente de tu aprobación)
./community-agent propose --channel=s-narai-preguntas \
  --text="…" --intent="Respuesta a duda de estancias"

# aprobar o rechazar (con motivo) en
# https://dash.pandoras.finance/growth-os/organizations/snarai/approvals
```

**Regla dura:** nada se publica sin aprobación humana. El bot no tiene token de escritura.

## 2. Ciclo semanal

| Cuándo | Qué |
|---|---|
| Lunes | plan de 3–5 publicaciones de la semana (una por canal como máximo) |
| Lunes | leer `/approvals/historial`: tasa de aprobación, mediana, motivos repetidos |
| Miércoles | revisar preguntas sin responder y cerrar las de más de 48 h |
| Viernes | resumen: clics por publicación y qué canal trae más aperturas |
| Cuando haya fecha | AMA en `#s-narai-amas` (primero confirmar la fecha) |

Si un **motivo de rechazo se repite dos veces**, se convierte en regla del validador en
`FORBIDDEN_TERMS` o en `REVIEW_FLAGS` (`packages/hermes-core/src/community/community-gateway.ts`).
Así deja de llegar a la bandeja.

## 3. Ángulos de contenido (sin precios, sin rendimientos)

La política del tenant prohíbe: fideicomiso, NOM-151, "hotel"/"condo-hotel"/renta hotelera,
"noches", "CP", estrategia de familia y cualquier promesa de rendimiento. Se habla de
**Título de Propiedad**, **estancias anuales** y **utilidades de la renta vacacional**.

| Ángulo | Ejemplo de gancho | Canal |
|---|---|---|
| Ubicación y obra | avance verificable de Bucerías | `#s-narai-avance` |
| Cómo funciona el modelo | qué significa tener estancias anuales | `#s-narai-la-oportunidad` |
| Operación | quién opera la renta vacacional y cómo se reporta | `#s-narai-la-oportunidad` |
| Objeciones reales | responder lo que ya preguntaron, con fuente | `#s-narai-preguntas` |
| Equipo | quién está detrás (Aztecas Real Estate) | `#s-narai-anuncios` |

Cada publicación lleva su `/l/<code>`; el clic se mide, el lead todavía no (ver §4).

## 4. Captación: cerrar el circuito (trabajo de mañana)

Hoy el circuito se rompe en el último tramo:

```
post → /l/<code> → landing externa → lead            ✅ clics  ⛔ atribución
```

`leads: null` en el historial no es un cero: es **no atribuible**, porque la landing
(`snarai.aztecaz.xyz`) no reenvía el `src` al crear el lead.

**Plan (una sola pieza, sin tocar la landing):**

1. `/l/<code>` ya redirige con `?src=<code>`. Añadir además una cookie de primera parte
   `nx_src=<code>` (30 días, `Path=/`, `SameSite=Lax`) en `apps/dashboard/src/app/l/[code]/route.ts`.
2. Página de captura propia bajo `dash.pandoras.finance` (p. ej. `/snarai`) con el formulario mínimo
   (nombre, email/WhatsApp, intención) que **cree el lead con `source = <code>`** y dispare el flujo
   existente de `marketing_leads`.
3. Con eso, `attribution.leads` deja de ser `null` y el historial empieza a mostrar
   `post → clics → leads`.

Riesgos a respetar: el lead debe nacer en el servidor (nunca confiar en el `tenantId`/`source`
del cliente sin validar contra la cookie y el proyecto), consentimiento explícito, y sin prometer
nada que la política prohíba en el formulario.

**Primeras ventas:** el embudo tiene 147 leads y 1 cerrado. La vía más corta no es más publicidad,
es **llamada con el equipo** para los leads que ya abrieron enlace. El CTA de cada post debería
ofrecer esa llamada, no sólo "conoce más".

## 5. Qué NO se hace todavía

- **Auto-respuesta sin aprobación**: donde se rompe la confianza y aparece el riesgo regulatorio.
- **Auto-moderación**: borrar mensajes sin humano es irreversible. El lector sólo avisa.
- **DMs a prospectos**: el canal más delicado; primero lo público.
- **Precios o rendimientos en copy**: bloqueado por política y debe seguir así.

## 6. Métricas y umbrales de decisión

| Métrica | Dónde | Umbral | Qué hacer si se cruza |
|---|---|---|---|
| Tasa de aprobación | `/approvals/historial` | < 70 % | revisar el prompt del agente y añadir reglas |
| Mediana hasta decidir | idem | > 24 h | mover la revisión a 2 veces al día |
| Motivos repetidos | idem | 2 veces | convertirlo en `REVIEW_FLAGS` |
| Preguntas sin responder | `read` | > 48 h | responder antes de publicar nada nuevo |
| Clics por publicación | `/approvals/historial` | comparativo | repetir el ángulo que más abre |
| Leads atribuidos | ⏳ tras §4 | — | primer número comercial real |

## 7. Orden de trabajo propuesto

1. **Cookie + captura first-party** (§4) → atribución de leads y métrica comercial.
2. **CTA de llamada** en las publicaciones (con el flujo de agenda existente).
3. **AMA** cuando haya fecha (requiere permiso en el bot).
4. **WhatsApp** cuando existan destinatarios por tenant y plantilla aprobada por Meta.

## 8. Redes por marca

| Marca | Redes activas | Rol | Frecuencia |
|---|---|---|---|
| **Pandora's** | LinkedIn + X | tesis, alianzas, tecnología, hiring | 1–2 / mes, institucional |
| **S'Narai** | Discord + Farcaster/Reddit (etapa 1) · IG (etapa 2) · FB (etapa 3) | comunidad, producto, captación | 2–3 / semana |
| **Tenants** | las que conecten | su propio contenido | la suya |

**Por qué no X en S'Narai:** pide más esfuerzo que el resto y su impacto no es proporcional a lo que
buscamos. En su lugar, **canales web3** (Farcaster y Reddit `r/RWA`): texto, sin material, audiencia de
tokenización y enlaces medibles hacia Discord y `/join`. Instagram entra con los assets; Facebook al
final, según resultados.

**Regla de la comunidad:** una sola comunidad central (Discord) con varias puertas (X/IG/FB). Las
redes llevan gente a Discord y a `/join/<slug>`; no se administran comunidades separadas.

Pandora's **no** abre IG/FB/TikTok: su audiencia es institucional y no justifica operación diaria.
Los tenants heredan el mecanismo (adaptador + credenciales por portal), no el contenido.

## 9. Calendario S'Narai · primeras 2 semanas

Requisito: 15–20 assets reales cargados en `/portal/snarai/media` (renders, obra, planos, video).
Sin asset no hay post con imagen; en ese caso, texto sólo en Facebook.

| Día | Pieza | IG | FB | Objetivo |
|---|---|---|---|---|
| 1 | "Abrimos la conversación" | imagen render + caption corto | texto + enlace `/join/snarai` | primer lead atribuido |
| 3 | Avance de obra | foto real 4:5 | foto + párrafo | prueba de realidad |
| 5 | Cómo funciona el Título de Propiedad | carrusel/plano | explicación larga | educar la objeción |
| 8 | Anuncio de AMA (si hay fecha) | imagen + fecha | evento | primera conversación pública |
| 10 | Bucerías / ubicación | render + mapa | texto + enlace | deseo, no promesa |
| 12 | 3 preguntas frecuentes reales | carrusel | hilo corto | cerrar dudas sin DM |

Cada pieza lleva su `/l/<code>`; el CTA es **siempre** `/join/snarai` (medible), no la landing.

## 10. Backlog priorizado

| # | Tarea | Depende de | Esfuerzo |
|---|---|---|---|
| 1 | Deploy de la fase 0 y prueba de humo (clic → cookie → lead) | Marco | 20 min |
| 2 | **Whitelist por tenant** en publisher y lector (ADR-020 §2.5) | — | 2–3 h |
| 3 | `FacebookPagePublisher` | credenciales | 2–3 h |
| 4 | `InstagramPublisher` | credenciales + assets | 4–6 h |
| 5 | A2A real `media.publish.channel:*` + aprobación multi-red | 3 y 4 | 3–4 h |
| 6 | Carga de 15–20 assets en el portal | Marco | 1 sesión |
| 7 | Hub: categoría + rol por tenant + prueba de fuga | 2 | 1 h por tenant |
| 8 | Permiso `Manage Events` para AMA | Marco | 5 min |
| 9 | Reportes: leads atribuidos por publicación en el portal | 1 + primeros leads | 3 h |
| 10 | Opt-in de los 40 teléfonos (plantilla Meta) | consentimiento | 1 semana + revisión |

## 11. Credenciales (Meta)

| Dato | De dónde |
|---|---|
| `META_APP_ID` / `META_APP_SECRET` | App de Meta (el secret ya existe para WhatsApp) |
| Page ID + Page access token largo | Graph API Explorer → `/me/accounts` |
| Instagram Business Account ID | `GET /{page-id}?fields=instagram_business_account` |

Permisos del token: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`,
`instagram_content_publish`.

Se cargan por **stdin** en un script que las guarda cifradas en `tenant_social_integrations`
(una fila por tenant y red). Nunca por chat, nunca por env, nunca en el repo.

### Canales de aviso (no de publicación)

Cada tenant apunta sus avisos a su propio canal. S'Narai usa *snarai-alerts* para `leads` y
`approvals`. Sin canal configurado, el aviso queda sólo in-app — nunca se cae a un canal de
Pandora's.

```
PUT    /api/v1/tenant/<slug>/notification-channels   { "kind": "leads", "url": "…" }
DELETE /api/v1/tenant/<slug>/notification-channels?kind=leads
```

Requiere sesión de owner del tenant; la organización se toma de la sesión.
