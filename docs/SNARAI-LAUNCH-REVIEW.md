# S'Narai — revisión de lanzamiento

Fecha: 22 nov 2026 · Estado: **inspección, sin ejecutar** (tarea pendiente).

## 1. Qué existe hoy

| Campo | Valor |
|---|---|
| Proyecto | `snarai` · S'Narai · **status `live`** |
| Categoría | `residential_real_estate` |
| Descripción | 474 caracteres |
| Branding | logo, cover e imagen: sí |
| Web | `https://snarai.aztecaz.xyz` |
| Whitepaper | `https://snarai.aztecaz.xyz/white-paper` |
| Contrato | `0xd2d5EcF7e2617ff900c22D70E24F7ca2cd2111dF` |
| Tesorería | `0x555a14Fe71270882a5EA038D61F5Eb90b2092c1a` |
| Legal | `sapi_mexico` · **fiduciary_entity vacío** |
| Simulación | `false` |
| Cliente CRM | `admin@snarai.aztecaz.xyz` · `closed_won` |

## 2. Lo que falta para poder vender accesos

**Datos comerciales (bloqueante)**

- `total_tokens`, `tokens_offered`, `token_price_usd`, `total_valuation_usd`: **vacíos**.
- `target_amount`: **0.00** · `raised_amount`: **0.00**.
- `tiered_access_details`: **vacío** — y es justamente el producto (“accesos”).
- `fiduciary_entity`: **vacío** — quién custodia el activo y bajo qué figura.
- Sin `socials`, sin canales de adquisición.

**Superficies**

- **No hay deck** en `nexus_presentations` (`snarai` no existe).
- **No hay Deal Room** (`nexus_deal_rooms` sin sala de S'Narai).
- No hay landing comercial con captura de leads ni tracking.
- No hay campañas, contenido ni secuencia de correo.

## 3. Riesgo principal

El proyecto está marcado **`live` con precio, suministro y meta en cero**. Un
visitante puede interpretar que la venta está abierta cuando en realidad no hay
oferta configurada. **Recomendación: bajarlo a `draft`/`inactive` hasta completar la
configuración comercial**, o completarla antes de cualquier campaña.

## 4. Checklist de lanzamiento (propuesto)

**Fase 0 · Integridad (bloqueante)**

1. Verificar en cadena contrato y tesorería (red, bytecode, owner, verificación).
2. Definir figura legal y `fiduciary_entity` (quién custodia, quién factura).
3. Configurar suministro, oferta, precio, valuación y meta.
4. Definir niveles de acceso (qué incluye cada tier, precio, beneficios, vigencia).
5. Cambiar `status` a `draft` mientras no esté completo.

**Fase 1 · Superficies comerciales**

6. Deck de S'Narai en el CMS (`nexus_presentations`) con slides y guardrails.
7. Deal Room con NDA y secciones (tesis, activo, accesos, proceso).
8. Landing con captura de leads, aviso de privacidad y tracking.
9. CRM: cliente, oportunidad y etapa; atribución por canal.

**Fase 2 · Marketing**

10. Campañas (Meta/Google) con pauta definida por S'Narai.
11. Contenido: 4 piezas/mes, guiones de atención y calificación.
12. Reporte semanal: CPL, leads, calificados, solicitudes, visitas y cierres.

## 5. Decisiones que necesito para ejecutar

1. ¿El producto es **acceso por tiers** (membresía) o **fracciones** del activo?
2. ¿Quién es la **fiduciaria** y qué figura legal cobra?
3. ¿Precio y suministro ya están definidos, o hay que modelarlos?
4. ¿S'Narai ya tiene material aprobado (fotos, planos, precios) o se produce?

Sin respuestas a 1–3 no hay campaña posible: se estaría vendiendo algo sin precio ni
estructura.
