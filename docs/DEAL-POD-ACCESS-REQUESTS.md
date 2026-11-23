# Solicitudes de acceso — categoría Deal Pod

Fecha: 22 nov 2026 · Estado: **implementado** (pendiente de deploy).

## 1. El hueco que cierra

Antes: la landing `/pitch/village` era el gate, pero al pedir acceso el sistema
sólo enviaba magic link a correos **ya registrados como firmantes**. Un lead
nuevo recibía `{ok:true}` y no pasaba nada: ni correo, ni aviso, ni registro.

Ahora: una solicitud de acceso queda **en el pod**, con atribución, aviso a
operación y acuse al solicitante. El acceso lo sigue autorizando una persona.

## 2. Flujo

```
Landing /pitch/village?src=<semilla>
      │  (el CTA arrastra ?src a la sala)
      ▼
/deal/PDR-VILLAGE  →  "Solicitar acceso" (correo + nombre + empresa + consentimiento)
      │
      ├─ correo ya es firmante → magic link (sin cambios)
      └─ correo nuevo → solicitud PENDING en el pod
              ├─ aviso a operación: Discord + correo a DEAL_OPS_EMAIL
              ├─ acuse al solicitante (sin datos del activo)
              └─ OPS HUB → DEAL PODS → "Solicitudes de acceso"
                        ├─ Autorizar → registra firmante + envía magic link (actor + auditoría)
                        └─ Rechazar  → motivo + auditoría
```

## 3. Por qué está aislado

| Decisión | Motivo |
|---|---|
| Tabla propia `nexus_deal_access_requests` (pod + sala) | No mezclar con `clients` ni `marketing_leads`, que son de otros canales |
| No crea firmante ni envía enlace al recibir | Una solicitud es propuesta; la autorización es del propietario |
| Índice único `(room_id, email)` | Reintentos del lead no generan duplicados |
| Respuesta uniforme `{ok:true}` | No revela si un correo ya está autorizado (anti-enumeración) |
| `?src` viaja landing → sala → solicitud | Saber qué semilla del radar produjo el lead |

## 4. Dónde se ve

- **OPS HUB → DEAL PODS**: cada pod muestra "Solicitudes de acceso" con
  pendientes, origen (`semilla /l/<code>`), empresa y botones Autorizar/Rechazar.
- **Discord**: embed `🪪 Solicitud de acceso` con correo, empresa, cargo, origen y puerta.
- **Correo**: a `DEAL_OPS_EMAIL` con `Reply-To` del solicitante (respondes directo).
- **Auditoría**: `nexus_deal_audit_events` registra `Access request approved|rejected`.

## 5. Variables de entorno

| Variable | Uso | Default |
|---|---|---|
| `DEAL_OPS_EMAIL` | destino del aviso interno | `aztecaz@pandoras.finance` |
| `DISCORD_WEBHOOK_URL` / `DISCORD_WEBHOOK_ALERTS` | aviso en Discord | el mismo webhook del radar |
| `RESEND_FROM_EMAIL` | remitente | `hello@pandoras.finance` |
| `NEXT_PUBLIC_APP_URL` | base del magic link | `https://nexus.pandoras.finance` |

## 6. API

| Método | Ruta | Autoridad |
|---|---|---|
| POST | `/api/public/deals/[publicId]/access` | pública (rate limit 30 s por IP) |
| GET | `/api/nexus/pods/[id]/access-requests` | propietario/SUPER_ADMIN, org |
| POST | `/api/nexus/pods/[id]/access-requests/[requestId]` | propietario/SUPER_ADMIN, org |

## 7. Evidencia (22 nov 2026)

```
Migración 0114 aplicada en la base operativa
  → 21 columnas · uq_access_requests_room_email · 2 índices

Smoke contra PDR-VILLAGE (luego borrado)
  creada: true · PENDING
  segunda vez con el mismo correo: created=false (mismo id)
  bandeja: 1 · origen hgv
  rechazo: {"ok":true,"status":"REJECTED"}
  auditoría: "Access request rejected" (limpiada tras la prueba)

tsc --noEmit: 0 errores nuevos
```

**No ejercitado en producción todavía:** el envío real del aviso (Discord +
correo) y la aprobación con magic link. Se comprueba en la primera solicitud
después del deploy.
