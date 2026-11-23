# S'Narai — revisión de lanzamiento (corregida)

Fecha: 22 nov 2026 · Modelo: **tenant whitelabel sobre la vertical RWA de Pandora's**
(`/portal/snarai`, `/materials/snarai/*`, `dash.pandoras.finance` como plataforma).

> Corrección: la revisión anterior se basó en las columnas legacy de `projects`
> (tokens/precio), que **no son la fuente de verdad** de este modelo. La operación
> real vive en `projects.w2e_config`, `extra_config` y `tenant_runtime_config`.

## 1. Qué está configurado (sí existe)

**Oferta y fases (`w2e_config`)**

| Fase | Precio CP | Asignación | Estado |
|---|---|---|---|
| Fundador | $50 USD | 30,000 CPs (límite 1.5M USD) | **Activa** |
| Estratégica | $75 USD | 13,334 CPs | bloqueada |
| Pública | $100 USD | 25,000 CPs | bloqueada |

**Tiers**: Explorer $500 (10 CPs) · Resident $2,500 (50) · Ambassador $10,000 (200)
· Riviera Owner $50,000 (1,000), con beneficios por nivel.

**Activos on-chain declarados**: contrato de acceso `0xd2d5EcF7…`, licencia
`VHORA` (máx. 1,000), utilidad `PHI` (80,400), red **Base**, treasury
`0x555a14Fe…`, creador `0x121a897f…`.

**Materiales (`extra_config`)**: deck EN/ES, dossier EN/ES, one-pager EN/ES,
resource hub (portal + Telegram), progress log.

**Portal y marca (`tenant_runtime_config`)**: brand config, `vertical: RWA`,
capacidades `rwa.portal/payments/governance/ipfs_evidence/nft.certificates`,
`legalProfile` con plantilla `SNARAI_AGREEMENT_TEMPLATE`.

## 2. Corrección: los legales SÍ existen (estaban mal enlazados)

Revisado el proyecto real en `Aztecas/Proyectos/Narai/apps/web`: las páginas legales
viven en la app de Narai, no en dash.

| Página | URL real | Estado |
|---|---|---|
| Risk disclosure | `snarai.aztecaz.xyz/en/institutional/legal/investor-risk-disclosure` | 200 |
| Participation agreement | `…/investor-participation-agreement` | 200 |
| Strategic agreement | `…/pandoras-snarai-strategic-agreement` | 200 |
| Institutional disclosure | `…/institutional-disclosure-statement` | 200 |
| White paper | `snarai.aztecaz.xyz/white-paper` | 200 |
| Logo | `snarai.aztecaz.xyz/logo-white.png` | 200 |

**Causa del 404:** `tenant_runtime_config.brandConfig` apuntaba a
`dash.pandoras.finance/legal/...` y a `snarai.com/logo.png`.

**Corregido en la base operativa:** `logoUrl`, `riskUrl`, `agreementUrl` y
`termsUrl` ahora apuntan a Narai; se retiró `privacyUrl` porque **no existe aviso de
privacidad** todavía (mejor sin link que con link roto).

## 2.1 Pendientes reales

| # | Punto | Acción |
|---|---|---|
| 1 | **Aviso de privacidad** | crear la página y recién entonces volver a enlazarla |
| 2 | **Términos** | hoy apunta a institutional-disclosure; si quieren términos propios, crearlos |
| 3 | **Colección "Test Collection" (`0x123`)** en `tenant_nft_collections` | confirmar si es data de demo y retirarla |
| 4 | **11 emisiones `pending_mint`** | reintentar o cancelar con motivo |
| 5 | **Blockchain / treasury** | **cubierto por Pandora's**; no se evalúa aquí. Solo confirmar con el equipo de contratos que el despliegue en Base corresponde al entorno de producción |

> Retiro el hallazgo anterior de "treasury con un solo firmante": la capa on-chain la
> opera Pandora's, no este repositorio.

## 3. Checklist para lanzar

**Fase 0 · Integridad (bloqueante)**
1. Publicar términos y privacidad (o apuntar a los correctos).
2. Corregir el logo (asset propio o el del portal).
3. Verificar en Base: contrato de acceso, licencia y utilidad (owner, supply, paused).
4. Resolver las 11 emisiones `pending_mint` (reintentar o cancelar con motivo).
5. Eliminar o archivar la "Test Collection" (`0x123`).
6. Añadir segundo firmante al treasury.
7. Confirmar la ruta de pago (Stripe/crypto) y que el checkout del tier Explorer funcione.

**Fase 1 · Portal del comprador**
8. Onboarding: solicitud → verificación founder → asignación → checkout.
9. Dashboard del miembro con su CP, tier y noches.
10. Emisión automática del certificado al confirmar pago.

**Fase 2 · Marketing**
11. Landing pública con captura y aviso de privacidad.
12. Atribución (`/l/<code>`) y CRM (cliente + oportunidad).
13. Contenido y campañas; reporte semanal.

## 4. Lo que reutiliza del ecosistema

- **Deal Pods** para gestionar la oportunidad y sus semillas.
- **Módulo de prospección** (cuando exista) para compradores de accesos: family
  offices, clubes, operadores boutique (puerta `MX_FAMILY` / `PATIENT_CAPITAL`).
- **Radar `/l/<code>`** para medir cada canal y inversor.
- **Deal Room + NDA** para el dossier privado cuando el material lo requiera.

## 5. Conclusión

El proyecto está **completo en su parte comercial y legal**: fases, tiers, materiales
EN/ES, portal, páginas legales y white paper. El único bloqueo era de **enlaces**
(config apuntando a dash y a un logo inexistente), ya corregido. Quedan tres tareas
de higiene (aviso de privacidad, colección de prueba y mints pendientes) y la
confirmación on-chain con el equipo de Pandora's.
