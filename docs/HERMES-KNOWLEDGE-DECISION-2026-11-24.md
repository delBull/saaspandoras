# Decisión · Conocimiento de Hermes (24 nov 2026)

**Decisión vigente:** operar con los **7 hechos gobernados que hoy tienen contenido**. No se
re-mina ni se toca IPFS por ahora. Este documento existe para que la deuda quede explícita y
para poder retomarla sin volver a investigar.

## 1. Estado real (medido, no estimado)

```
hermes_knowledge · status = ACTIVE
  pandoras   28 activos → 22 sin content   (10 CONFIDENTIAL · 7 INTERNAL_OPERATIONAL · 3 SECRET · 2 PUBLIC)
  snarai     22 activos → 21 sin content   (5 CONFIDENTIAL · 11 PUBLIC · 5 TENANT_RESTRICTED)
  fixtures de certificación (cert0x, tenant_A): 5 filas, irrelevantes

pandoras · 7 hechos legibles (los que Hermes usa hoy)
  pandoras_contexto_operativo · pandoras_productos_y_proyectos · agenda_soberana_ecosistema
  hermes_canales_y_herramientas · hermes_system_limits · pricing_transparency
  prospect_pablo_coffree
```

Cobertura actual: operación, productos, canales, límites y un prospecto.
**No cubierto:** constitución corporativa, gobernanza, tesorería, IP, legal/patrimonial,
academia, y todo el conocimiento de S'Narai.

## 2. Por qué no está el contenido (causa, no síntoma)

- `migrate-ecosystem-to-ipfs.ts` (K25 Phase C) cifró todo lo no-PUBLIC con sobre cifrado +
  AAD y **purgó el plaintext** de `hermes_knowledge`; el texto quedó en el vault IPFS.
- El nodo IPFS no responde: `POST /api/v0/version` → **401** (proxy propio del RPC).
- El gateway sí responde, pero **no tiene los bloques**:
  `GET /ipfs/bafkreiaq2tif…` → 500 `block was not found locally (offline)`.
- No hay réplica: `backup_ipfs_cid` vacío en los 22 artefactos del registro.
- `hermes_knowledge_registry`: 22 artefactos, **0 en ACTIVE** (todos `SHADOW_VERIFIED`).

Conclusión: no es un problema de credencial. **El contenido no existe en IPFS.**

## 3. Por qué "re-minar" no es trivial

El texto fuente **sí está en la máquina del Fundador**, pero:

1. `DOCUMENTACIÓN/` está en `.gitignore` (69 archivos locales, **0 en Git**). Si se pierde esa
   carpeta, no hay recuperación desde el repositorio.
2. Re-minar = volver a escribir plaintext en Postgres. Para **PUBLIC** es exactamente lo que hacía
   el diseño original. Para **CONFIDENTIAL/SECRET** revierte la decisión de K25 (cifrado en reposo):
   eso no lo puede decidir el agente.
3. El mapeo key → archivo es **exacto sólo para Pandora's** (22 de 22, vía el manifiesto del script).
   En S'Narai, 4 de 21 tienen archivo; las 11 PUBLIC (`snarai-brand`, `snarai-business`, …) no
   tienen fuente identificable en el repo ni en la carpeta local: no se pueden restaurar sin que
   alguien diga de dónde salieron.

## 4. Caminos posibles (cuando se decida)

| # | Camino | Alcance | Requiere |
|---|---|---|---|
| A | Restaurar el vault IPFS (Kubo/Cluster + clave del proxy) | los 43 hechos, cifrado intacto | ops/credenciales + verificar `cat` por CID |
| B | Re-minar **sólo PUBLIC e INTERNAL_OPERATIONAL/TENANT_RESTRICTED** desde `DOCUMENTACIÓN/` | Pandora's 9 · S'Narai 16 (parcial) | autorización del Fundador + aceptar plaintext en BD para tiers no confidenciales |
| C | Re-minar **todo** desde `DOCUMENTACIÓN/` | 22 Pandora's | autorización explícita de revertir K25 para CONFIDENTIAL/SECRET |
| D | Dejar los 7 hechos y enriquecer los que se usan | inmediato | nada (es la decisión vigente) |

**Prohibido en cualquiera de los caminos:** inventar contenido, deducir cifras legales o
patrimoniales, o presentar un hecho sin `content` como si Hermes lo supiera.

## 5. Mapeo verificado key → archivo (Pandora's, 22/22)

| key | archivo fuente (local, gitignored) | clasificación |
|---|---|---|
| libro_0_constitution | `PANDORAS_LIBRO_0_CONSTITUTION.md` | CONFIDENTIAL |
| libro_i_corporate_charter | `PANDORAS_LIBRO_I_CORPORATE_CHARTER.md` | CONFIDENTIAL |
| libro_ii_governance | `PANDORAS_LIBRO_II_CORPORATE_GOVERNANCE.md` | CONFIDENTIAL |
| libro_iii_treasury | `PANDORAS_LIBRO_III_INSTITUTIONAL_TREASURY.md` | CONFIDENTIAL |
| libro_iv_ip_register | `PANDORAS_LIBRO_IV_IP_AND_ASSET_REGISTER.md` | CONFIDENTIAL |
| libro_ix_agent_os | `PANDORAS_LIBRO_IX_AGENT_OS_FRAMEWORK.md` | CONFIDENTIAL |
| pandoras_operating_model | `PANDORAS_INSTITUTIONAL_OPERATING_MODEL_IOM.md` | CONFIDENTIAL |
| pandoras_playbook | `PANDORAS_PLAYBOOK.md` | CONFIDENTIAL |
| hermes_os_master_manual | `DOCUMENTACIÓN` (Academy/manual) | CONFIDENTIAL |
| academy_disclosure_boundary | `Academy/FASE_2_2_DISCLOSURE_BOUNDARY_SPEC.md` | CONFIDENTIAL |
| blindaje_corporativo | `BLINDAJE_PROYECTO.md` | SECRET |
| estructura_empresarial_llc | `EstructuraEmprsarialLLC.md` | SECRET |
| ip_master_register | `PANDORAS_IP_MASTER_REGISTER.md` | SECRET |
| cognitive_knowledge_scope | `HERMES_COGNITIVE_KNOWLEDGE_SCOPE_SPEC_v1.0.md` | INTERNAL_OPERATIONAL |
| patrimonial_agent_arch | `HERMES_PATRIMONIAL_AGENT_ARCHITECTURE.md` | INTERNAL_OPERATIONAL |
| production_readiness_milestone | `Hermes/MILESTONE_4_HERMES_PRODUCTION_READINESS.md` | INTERNAL_OPERATIONAL |
| security_expansion_milestones | `Hermes/MILESTONE_5_6_7_HERMES_SECURITY_EXPANSION.md` | INTERNAL_OPERATIONAL |
| academy_rwa_tokenization | `Academy/ACADEMY_TOKENIZATION_RWA_CURRICULUM.md` | INTERNAL_OPERATIONAL |
| academy_smart_contracts_nfts | `Academy/ACADEMY_SMART_CONTRACTS_NFTS.md` | INTERNAL_OPERATIONAL |
| academy_walkthrough_v2 | `Academy/WALKTHROUGH_ACADEMY_V2.md` | INTERNAL_OPERATIONAL |
| editorial_constitution | `PANDORAS_EDITORIAL_CONSTITUTION.md` | PUBLIC |
| security_whitepaper | `PANDORAS_SECURITY_WHITEPAPER.md` | PUBLIC |

## 6. Cómo verificar el estado en cualquier momento

```sql
-- ¿qué puede leer Hermes hoy?
select organization_id, count(*) filter (where content is not null) as legibles, count(*) as activos
from hermes_knowledge where status='ACTIVE' group by 1 order by 2 desc;

-- ¿qué sigue pendiente en la organización principal?
select classification, key from hermes_knowledge
where status='ACTIVE' and content is null and organization_id='pandoras' order by 1,2;
```

Si en el futuro se restaura A o B, la verificación es la misma: `content is not null` en las filas
esperadas **y** que Hermes responda con ese hecho en una conversación real (no basta el SQL).

## 7. Consecuencia operativa asumida

Hermes sabe lo operativo y **no** sabe lo constitucional/legal. Por eso:

- debe decir que no sabe cuando le pregunten por constitución, legal o S'Narai,
- el fallback del alma (`PANDORAS_SOUL.fallbackResponse`) ya lo obliga a declararlo y ofrecer handoff,
- y el prompt de sistema le prohíbe presentar como cierto cualquier hecho que no esté en su contexto.
