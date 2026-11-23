# Master checklist — trabajo activo

Actualizado: 22 nov 2026. Marca: ✅ hecho · 🟡 en curso · ⏳ pendiente · ❌ bloqueado.

---

## A. Village (Deal Pod de la oportunidad)

| # | Acción | Estado | Evidencia / nota |
|---|---|---|---|
| A1 | Landing `/pitch/village` EN/ES, sin nombre/ubicación/precio, con scroll | ✅ | 200 en prod; `overflow-y-auto` |
| A2 | Deal Room `PDR-VILLAGE` + NDA `v1.0-village` (Nayarit, no circunvención 3%) | ✅ | secciones 01–04 |
| A3 | POF desde la sala (declaración + carta ≤5 MB) | ✅ | `nexus_deal_pof_documents` |
| A4 | OM gateado (NDA + POF) por enlace de 7 días | ✅ | `/api/public/deals/.../om` |
| A5 | Radar `/l/<code>` con aperturas + aviso Discord | ✅ | 302 + eventos verificados |
| A6 | 10 semillas creadas (Onda 1) | ✅ | `nexus_outreach_links` |
| A7 | Tablero de semillas en Deal Pods | ✅ | aperturas + copiar link |
| A8 | Pack de correos EN/ES + segundo toque | ✅ | `docs/VILLAGE-OUTREACH-PACK.md` |
| A9 | Confirmar recepción del correo de prueba | 🟡 | enviado a marco; falta confirmar |
| A10 | Buzón `aztecaz@pandoras.finance` | ⏳ | crear alias de reenvío en Namecheap |
| A11 | Enviar Onda 1 desde el buzón | ⏳ | depende A9/A10 |
| A12 | Segundo toque día 5 | ⏳ | plantilla lista |

## B. Plataforma Deal Pods

| # | Acción | Estado |
|---|---|---|
| B1 | Crear pod desde la UI | ✅ |
| B2 | Cambiar estado del pod (ACTIVE/PAUSED/CLOSED_*) | ✅ |
| B3 | Agregar semilla y obtener link | ✅ |
| B4 | API reutilizable (`/api/nexus/pods*`) con autoridad centralizada | ✅ |
| B5 | Desactivar/editar semilla | ✅ API · ⏳ UI |
| B6 | API keys por organización (para otros tenants) | ⏳ |
| B7 | Plantillas de correo por pod en la UI | ⏳ |

## C. Correo y entregabilidad

| # | Acción | Estado |
|---|---|---|
| C1 | Envío de prueba por el flujo real | 🟡 (requiere firmante; ya registrado) |
| C2 | Verificar Resend en dashboard (logs/bounces) | ⏳ |
| C3 | From verificado + Reply-To al alias | ⏳ |
| C4 | Prueba a Gmail y Outlook | ⏳ |

## D. Prospección (módulo reutilizable)

| # | Acción | Estado |
|---|---|---|
| D1 | Especificación (`docs/PROSPECTING-MODULE-SPEC.md`) | ✅ |
| D2 | Tabla `nexus_prospects` + jobs | ⏳ |
| D3 | Worker: 3 fuentes (prensa, webs, SEC) con `robots.txt` | ⏳ |
| D4 | UI en Deal Pod: reglas, targets, horarios, edades, puertas | ⏳ |
| D5 | **Text-to-scrap**: descripción libre → job estructurado | ⏳ |
| D6 | Bandeja de aprobación → link `/l/<code>` + borrador | ⏳ |

## E. S'Narai (tenant whitelabel RWA)

| # | Acción | Estado |
|---|---|---|
| E1 | Revisión corregida (`docs/SNARAI-LAUNCH-REVIEW.md`) | ✅ |
| E2 | Publicar términos y privacidad (hoy 404) | ❌ |
| E3 | Corregir logo (hoy 404) | ❌ |
| E4 | Verificar contratos en Base (acceso, licencia, utilidad) | ⏳ |
| E5 | Resolver 11 mints `pending_mint` | ❌ |
| E6 | Retirar "Test Collection" (`0x123`) | ❌ |
| E7 | Segundo firmante en treasury | ⏳ |
| E8 | Probar checkout del tier Explorer ($500) | ⏳ |
| E9 | Landing + atribución + CRM | ⏳ |

## F. Discord de Pandora's

| # | Acción | Estado |
|---|---|---|
| F1 | Estrategia y estructura (`docs/DISCORD-COMMUNITY-STRATEGY.md`) | ✅ |
| F2 | Crear servidor, roles y verificación | ⏳ |
| F3 | Links individuales por miembro | ⏳ (radar listo) |
| F4 | Calendario de contenido y AMA | ⏳ |

## Decisiones abiertas

1. ¿Se aprueba el MVP de prospección (D2–D6) como siguiente bloque?
2. ¿S'Narai se baja a `draft` hasta cerrar E2–E8?
3. ¿El alias `aztecaz@` se crea por reenvío en Namecheap?

## Índice de documentos

- `docs/VILLAGE-OUTREACH-PACK.md`
- `docs/DB-ROTATION-NOTES.md`
- `docs/PROSPECTING-MODULE-SPEC.md`
- `docs/HERMES-SCRAPING-FEASIBILITY.md`
- `docs/SNARAI-LAUNCH-REVIEW.md`
- `docs/DISCORD-COMMUNITY-STRATEGY.md`
- `docs/NEXUS-IA-AUDIT-2026-11-20.md`
- `docs/NEXUS-IP-ASSETS-MIGRATION-PLAN.md`
