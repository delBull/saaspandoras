# Decisión · Conocimiento de Hermes (24 nov 2026)

**Decisión vigente (actualizada):** se ejecutó el **camino A** — el vault soberano vuelve a
hidratar en el runtime sin escribir plaintext en Postgres. Pandora's tiene 9 artefactos activos
(2 PUBLIC + 7 INTERNAL_OPERATIONAL) y S'Narai 16 (11 PUBLIC + 5 TENANT_RESTRICTED). Los tiers
CONFIDENTIAL/SECRET siguen fuera del prompt por diseño.

Este documento conserva el diagnóstico original (secciones 1–3), el registro de lo ejecutado
(4-bis) y lo que queda pendiente.

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

## 4-bis. ✅ EJECUTADO: camino A (24 nov 2026)

El Fundador autorizó A. Estado final: **el vault hidrata en producción sin escribir plaintext
en Postgres**.

### Qué estaba roto (y por qué no era "el RPC")

| # | Defecto real | Evidencia |
|---|---|---|
| 1 | `context-merger` comparaba `sha256(plaintext)` contra `registry.content_hash`, pero **esa columna tiene dos convenciones**: Pandora's guarda el hash del sobre (`10d4d051…`), S'Narai el del plaintext (`876452950e…`) | para Pandora's el hash del plaintext es `5a75c737…` → fail-closed en los 9 artefactos |
| 2 | `hermes_knowledge_registry` estaba en `SHADOW_VERIFIED` y **no existía ningún camino a `ACTIVE`** | 0 ACTIVE antes de esta entrega |
| 3 | al hidratar, el merger **reemplazaba** los hechos de BD en vez de unirlos | habría ocultado los 7 hechos operativos |
| 4 | el gate sólo permitía `PUBLIC`/`TENANT_RESTRICTED` | los `INTERNAL_OPERATIONAL` de Hermes quedaban fuera |

### Qué se hizo

1. **`TenantIpfsVaultService.retrieveVerifiedFromIpfs` / `verifyAndDecryptEnvelope`**: verificación en
   tres pasos — identidad del blob (`sha256(ciphertext) === ciphertext_hash`, la única columna con
   convención uniforme), identidad del artefacto (AAD del GCM + campos del sobre) e integridad del
   plaintext (`sha256 === envelope.contentHash`).
2. **`context-merger`**: usa la hidratación verificada, **une** vault + BD (sin duplicar por
   `artifactId`), respeta el `visibility` real y audita distinto un fallo de integridad
   (`CRITICAL`) de un fallo de red (`WARN`).
3. **Gate de tiers**: `PUBLIC`, `TENANT_RESTRICTED` e `INTERNAL_OPERATIONAL` (autorizado por el
   Fundador). **`CONFIDENTIAL` y `SECRET` siguen fuera** del prompt.
4. **`scripts/promote-knowledge-registry.ts`**: camino gobernado a `ACTIVE`, con verificación previa
   obligatoria, dry-run por defecto, actor explícito y evento `KNOWLEDGE_PROMOTED`/`KNOWLEDGE_DEMOTED`.

### Estado del registro

```
pandoras  9 ACTIVE (2 PUBLIC + 7 INTERNAL_OPERATIONAL) · 13 SHADOW_VERIFIED (10 CONFIDENTIAL + 3 SECRET)
snarai   16 ACTIVE (11 PUBLIC + 5 TENANT_RESTRICTED)   ·  5 SHADOW_VERIFIED (CONFIDENTIAL)
```

### Verificación ejecutada

| Prueba | Resultado |
|---|---|
| Fase 0 · descifrado con la KEK real (Pinata) | ✅ `security_whitepaper` 16 081 chars y `blindaje_corporativo` 90 942 chars; hash del plaintext = `envelope.contentHash` |
| `promote-knowledge-registry --dry-run` (2 PUBLIC) | ✅ 2/2 verificados |
| Dry-run S'Narai (16 artefactos) | ✅ 16/16 verificados |
| Hidratación real por tenant | ✅ Pandora's 9 del vault + 7 de BD = 21 con contenido; S'Narai 16 del vault + 1 de BD |
| `vitest src/knowledge/__tests__/k25a-verified-hydration.test.ts` | ✅ 6/6 |
| `vitest` hermes-core completo | 556 passed / 4 failed preexistentes / 347 skipped |

### Costo asumido (medido, no estimado)

| Tenant | Knowledge en el prompt | ≈ tokens/turno |
|---|---|---|
| pandoras | 78 408 chars | ~19 600 |
| snarai | 19 836 chars | ~5 000 |

Si el costo por mensaje pesa, se puede revertir por artefacto:
`bun run scripts/promote-knowledge-registry.ts --tenant=pandoras --artifacts=<id> --actor=<actor> --apply --demote`.
Candidatos a recortar por tamaño: `security_whitepaper` (16k), `academy_walkthrough_v2` (9.4k),
`production_readiness_milestone` (8.5k).

### Notas de honestidad

- Los artefactos de S'Narai `snarai-brand` (102 chars), `snarai-market` (103), `safety_level` (93),
  `snarai-operations` (107) y `snarai-projects` (105) son **stubs**: verifican y se hidratan, pero no
  aportan conocimiento real. Hay que reponerlos desde su fuente.
- Antes del deploy, el código viejo sigue en producción: para Pandora's los nuevos `ACTIVE` no
  hidratan (falla la comparación de hash) y para S'Narai hidratan sin unión (se pierde
  temporalmente `pricing_transparency`, 32 chars, de política). El deploy corrige ambos.

## 4-ter. S'Narai — inventario pendiente (preparado, no ejecutado)

La fuente canónica **sí está versionada en Git**: `packages/hermes-core/src/packs/snarai_knowledge_v1.1/`
(10 archivos con frontmatter gobernado: `organizationId`, `visibility`, `authority`, `status`, `version`).

Pero el pack está incompleto **en origen**, no en el pipeline:

| Artefacto | Fuente del pack | Estado real |
|---|---|---|
| `snarai-brand` | `03_brand.md` | **`# Brand` → `MISSING`** |
| `snarai-projects` | `05_projects.md` | **`MISSING`** |
| `snarai-market` | `07_market.md` | **`MISSING`** |
| `snarai-operations` | `08_operations.md` | **`MISSING`** |
| `safety_level` | *(sin archivo)* | **sin fuente** |
| `snarai-identity`, `snarai-business`, `snarai-products`, `snarai-public-faq`, `snarai-governance` | 01, 02, 06, 09, 10 | contenido real (breve) |
| `snarai-agent-soul` | `04_agent-soul.md` | declara que el alma vive en `snarai-domain-pack.ts`, no en knowledge (redundante por diseño) |
| `core_persona`, `snarai-public-faq`, `banned_topics`, `tone_of_voice` | `sync-snarai-knowledge-vault.ts` | contenido inline en el script |

Material adicional disponible para poblar los `MISSING` (local, fuera de Git):
`S_NARAI_LAUNCH_PLAN.md` (3.6 KB), `AUDIT_NARAI.md` (5.3 KB),
`Pandora-SNarai-Distribution-OS.md` (3.6 KB), `S_NARAI_AI_SUPPORT.md` (3.0 KB),
`S_NARAI_FOUNDER_ACTIONS.md` (2.4 KB), `S_NARAI_METRICS.md` (1.0 KB).

### Lo que falta para ejecutarlo

**Actualización 24 nov 2026 — contenido listo, publicación bloqueada por infraestructura.**

Los 4 artefactos que decían `MISSING` (`snarai-brand`, `snarai-market`, `snarai-projects`,
`snarai-operations`) **ya están escritos y versionados** en el pack, extraídos del proyecto real
(`/Users/Marco/Documents/Company/Aztecas/Proyectos/Narai/apps/web`): `src/knowledge/snarai.ts`,
`public/llms.txt` / `llms-full.txt`, `snarai-materials-v2.ts` y `messages/es.json`. Sin inventar: cada
archivo declara su fuente y lo que **no** puede afirmarse.

Script nuevo: `apps/dashboard/scripts/seed-snarai-from-pack.ts` (el `ingest-snarai-knowledge.ts`
anterior apuntaba a una ruta muerta y escribía plaintext; queda marcado como deprecado).

Verificación hecha (dry-run, cifra + roundtrip):

```
✓ snarai-brand       [PUBLIC]            2 172 chars
✓ snarai-projects    [PUBLIC]            2 814 chars
✓ snarai-market      [PUBLIC]            2 455 chars
✓ snarai-operations  [TENANT_RESTRICTED] 2 408 chars
Resumen: 4 procesados · 0 fallidos (dry-run, nada escrito)
```

**Publicado (24 nov 2026, 20:10):** el nodo propio (Kubo) es el primario y sí escribe. La key vive en
`.env.local` de la raíz del monorepo; el script la resuelve solo.

```
✓ snarai-brand      2 172 chars → bafkreifza5v7k3v42i2x3lgl4ej5jxsm5uu7u7x7hj52uvxtmlv36cmumm
✓ snarai-projects   2 814 chars → bafkreiausn7bxpp2gcv5z2mjjmccpaos3sigzwtxfy4dz5lx3n56dxhmvm
✓ snarai-market     2 455 chars → bafkreiagyiuk3s4rzrac2bpvm7f7uvwnz7me5nb3ewlywrfhy2qqd4t5xu
✓ snarai-operations 2 408 chars → bafkreigktvwhw56kquv2kueveyu3oqjgskm6b7piieeuuutrhwja2dpza4
```

Verificado: el gateway propio sirve los CID (200) y el contexto de S'Narai ya no contiene `MISSING`
(16 artefactos hidratados, 29 616 chars ≈ 7.4k tokens).

**Sobre Pinata:** queda como fallback, no como primario. Hoy está **bloqueada**
(`403 Account blocked due to plan usage limit`), así que **no hay espejo** de los 4 nuevos: si Kubo
cae, se pierden hasta que se reactive. El diseño K25 exige réplica externa, así que reactivarla es
deuda operativa abierta (no bloquea el funcionamiento actual porque el nodo es el primario).

### Decisiones que siguen pendientes

1. **Decisión de política**: los 5 `CONFIDENTIAL` de S'Narai (`banned_topics`, `escalation_rules`,
   `tone_of_voice`, `snarai_founder_actions`, `snarai_audit_report`) siguen fuera del prompt. Tres de
   ellos son *reglas de comportamiento* del agente, no datos sensibles. Propuesta: permitir
   `CONFIDENTIAL` sólo en dimensiones `policy`/`identity` del tenant, nunca en legal/patrimonial.
2. **Publicación (bloqueada)**: falta un proveedor de pin operativo (Pinata 403, Kubo 401). El
   contenido ya no es el problema; la infraestructura sí.
3. **`safety_level` no es conocimiento**: su valor real es `STRICT` (un flag de control, 6 chars). No
   debe "repoblarse" como documento; se deja tal cual.

### Errores de la fuente que NO deben propagarse

- `messages/es.json → Gestores.evolutionDesc` dice **"Riviera Maya"**: el proyecto está en Riviera
  Nayarit. Corregir en el sitio.
- Proyecciones de **12–15% anual** y **"hasta 40% más por entrar primero"**: son copy comercial. En
  conocimiento entran sólo como escenario, nunca como hecho ni promesa.
- **Dos juegos de coordenadas** publicados (`20.7505,-105.3306` y `20.7532569,-105.3354554`): usar la
  dirección postal como dato canónico.


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
