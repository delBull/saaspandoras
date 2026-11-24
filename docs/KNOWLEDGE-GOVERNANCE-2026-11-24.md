# Gobierno del conocimiento · gaps 1–4 (24 nov 2026)

Cierre de los cuatro huecos que impedían prometer "cada tenant con su identidad, su
conocimiento gobernado y su vault a salvo".

---

## Gap 1 · Identidad criptográfica por tenant ✅

**Antes:** una sola `HERMES_IDENTITY_PRIVATE_KEY` firmaba todas las filas de todos los
tenants (`0x8515Fb0F…`). El sello probaba quién operó, no de quién era el conocimiento.

**Ahora:**

| Pieza | Archivo |
|---|---|
| Tabla `tenant_signing_keys` (llave cifrada + versión + estado) | `packages/db-core/src/schema.ts`, migración `0117` |
| Cifrado AES-256-GCM con la KEK (`v1:iv:tag:cipher`) | `packages/hermes-core/src/identity/tenant-signer.ts` |
| `ensureTenantSigner` / `getTenantSigner` / `getSignerForTenant` / `rotateTenantSigner` | idem |
| Script de alta (idempotente) | `apps/dashboard/scripts/provision-tenant-signers.ts` |

**Ejecutado:** 10 identidades creadas. S'Narai = `0x704b96191e1D1f12e9Eb7d30420b0DbcD3f97e13`.

- Las llaves privadas **nunca** salen del servicio: se guardan cifradas y no se registran en logs.
- Si un tenant no tiene llave, se firma con la de plataforma y se marca `isPlatformFallback` (no se rompe
  nada, pero queda auditable).
- Tests: `tenant-signer.test.ts` — **5/5** (roundtrip, IV distinto, manipulación detectada, formatos
  inválidos, la llave no aparece en el cifrado).

**Pendiente:** 21 filas históricas siguen firmadas por la plataforma. El script
`re-sign-vault-artifacts.ts` las migra (descifra, re-cifra, re-firma, actualiza CID y seguro) y ya
tiene reintentos porque el nodo aborta bajo ráfaga. Las 4 más recientes de S'Narai **ya** firman con
su llave propia.

---

## Gap 2 · El portal sella de verdad ✅

Antes "aprobar" sólo cambiaba `status`; no cifraba ni fijaba nada.

`KnowledgeGovernanceService.approve()` ahora: cifra con el vault → fija en IPFS → **firma con la llave
del tenant** → verifica (ciphertext hash + AAD + contentHash) → registra → guarda el sobre en el
seguro → deja `hermes_knowledge.content = null` (el vault es la fuente de verdad) → audita
`KNOWLEDGE_PROMOTED` con CID, hashes y firmante.

Si la verificación falla, **no se promueve** y el hecho no llega al prompt.

---

## Gap 3 · Gobierno completo del conocimiento ✅

`packages/hermes-core/src/knowledge/governance-service.ts`:

| Operación | Qué hace |
|---|---|
| `submit` | fila `PENDING_REVIEW` (visible al revisor, **invisible al LLM**: el runtime sólo hidrata ACTIVE) |
| `approve` | cifra, fija, firma, registra, `ACTIVE`, guarda seguro |
| `reject` | `REJECTED`, descarta el texto, audita con motivo |
| `edit` | nueva versión firmada y fijada; la anterior pasa a `SUPERSEDED` (una sola ACTIVE por artefacto) |
| `listByStatus` | bandeja de revisión del tenant |

Esto reemplaza los stubs que devolvían `null` (`approveKnowledge`, `rejectKnowledge`, `editKnowledge`,
`getKnowledgeByStatus`).

---

## Gap 4 · Seguro contra pérdida del volumen ✅

**El riesgo real:** los pines viven en el repo de Kubo. Si el servicio reinicia sin volumen
persistente, se pierden (ya pasó: artefactos pinneados horas antes desaparecieron).

**Dos capas nuevas:**

1. **Sobre cifrado en Postgres** — tabla `knowledge_vault_blobs` (tenant, artefacto, CID, hashes,
   `envelope_json`). Mismos bytes ⇒ mismo CID ⇒ se puede re-fijar sin red, sin Pinata y sin volver a
   cifrar. **23 de 25 artefactos ya tienen su sobre guardado**; los 2 restantes se completan al
   re-sembrar S'Narai (el seed ya guarda el sobre).
2. **Reconciliación automática** — `verifyAndRepinVault()` + `GET /api/cron/ipfs-repin`
   (`Authorization: Bearer CRON_SECRET`). Recorre los ACTIVE, comprueba `pin/ls` y re-fija lo que falte
   desde el sobre local (o desde el espejo, y en ese caso guarda el sobre para la próxima).
   Agendado en `vercel.json` cada 30 minutos.

**Con esto, un reinicio del nodo ya no es pérdida de conocimiento**: en ≤30 minutos el cron lo
reconstruye, y mientras tanto el runtime hidrata desde el sobre local si se necesita.

---

## Lo que sigue siendo operativo (tuyo)

- **Volumen persistente para `/data/ipfs`** en el servicio Kubo. El cron es la red de seguridad, no un
  sustituto del disco.
- **Programar** el cron en el proveedor (Vercel ya lo declara; si usas otro scheduler, apunta
  `/api/cron/ipfs-repin` con el `CRON_SECRET`).
- **Rotar** la `PANDORAS_KUBO_API_KEY` que se imprimió por error en la sesión anterior.

## Evidencia

| Prueba | Resultado |
|---|---|
| Migración `0117` | aplicada; tablas e índices verificados con `\d` |
| `provision-tenant-signers` | 10/10 identidades creadas |
| `tenant-signer.test.ts` | 5/5 |
| `backfill-vault-blobs --apply` | 23 guardados |
| `tsc --noEmit` dashboard | sin errores nuevos |
| Nodo bajo ráfaga | aborta intermitentemente → de ahí los reintentos en los scripts |
