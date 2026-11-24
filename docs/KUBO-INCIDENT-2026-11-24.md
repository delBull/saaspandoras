# Incidente Kubo · alarma "Primary Node Offline" en cada mensaje (24 nov 2026)

## Síntoma

Cada mensaje de WhatsApp a Hermes disparaba en `#pandoras-alerts`:

```
Kubo Primary Node Offline — Fail-Over Engaged
Failed to retrieve content from Kubo for CID: bafkreiaq2tif… (security_whitepaper)
Active Fail-Over Provider: PINATA
```

Hermes respondía, pero con alarma constante y posible pérdida de conocimiento.

## Diagnóstico (medido)

| Prueba | Resultado |
|---|---|
| `POST /api/v0/version` con key | **200** — el nodo está vivo |
| `POST /api/v0/cat?arg=<cid>` con key | **200 en 0.29 s** |
| `POST /api/v0/cat` sin key | **401** `Unauthorized Sovereign RPC Access` |
| `pin/ls` del mismo CID | **"is not pinned"** |
| Gateway `ipfs.pandoras.finance/ipfs/<cid>` | **500** (bloque ausente) para 24 de 25 artefactos |

**Causa raíz: los artefactos no estaban pinneados.** El nodo tenía algunos bloques
en el blockstore (caché), no pinneados. Cuando el GC los soltaba, `cat` intentaba descargarlos de la red,
tardaba más que el timeout de 15 s y fallaba; el gateway respondía 500 por el mismo motivo. Con Pinata
bloqueada (403) el espejo tampoco rescataba el contenido.

**Segundo problema: la alarma estaba mal clasificada.** Cualquier fallo de `cat` se reportaba como
"nodo caído". Un bloque ausente no es una caída de servicio.

## Lo ejecutado

1. **Re-pin de los 25 artefactos ACTIVE.**
   - Pandora's (9): fetch desde `gateway.pinata.cloud` → `add?cid-version=1&raw-leaves=true&pin=true`
     en Kubo. **CID idéntico** en los 9 (mismo contenido ⇒ misma dirección), el registro no cambió.
   - S'Narai (16): los 4 re-sembrados desde el pack (`seed-snarai-from-pack.ts --apply --force`) y los
     12 restantes re-pinneados desde el propio nodo.
   - **Verificación final: 25/25 pinneados, 0 lecturas lentas.**
2. **Clasificación de la alerta** (`isKuboFailureCritical`): sólo alerta con `rpc=401/403/5xx` sin marca
   de bloque ausente, `rpc=network`, `ECONNREFUSED`, `ETIMEDOUT` o `abort`. Si el bloque falta, se
   registra un `WARN` y se hace fail-over **sin sonar la alarma**.
3. **Throttle**: máximo una alarma de nodo cada 10 minutos por proceso.
4. **Diagnóstico en el propio error**: el provider ahora adjunta `rpc=<status>, gateway=<status>` y un
   fragmento del cuerpo de cada respuesta, así la próxima alerta dice exactamente qué falló.
5. **Credencial**: se volvió a cargar `PANDORAS_KUBO_API_KEY` en Vercel production con la key que
   verifica 200 (la anterior no autenticaba).

## Riesgo abierto (operativo, no de código)

Los pines viven en el repo de Kubo. Si el nodo corre **sin volumen persistente**, un reinicio los pierde
y el incidente vuelve. Señales que apuntan a eso: los 4 artefactos que se pinneadearon hace dos horas
ya no estaban.

**Acción recomendada:** confirmar que el servicio Kubo monta un volumen persistente para
`/data/ipfs` (Railway volumen o equivalente) y, si no, crearlo. Mientras no exista, el re-pin es un
parche que hay que repetir tras cada reinicio; el script de verificación lo detecta en segundos
(`pin/ls` de los CIDs ACTIVE).

## Cómo verificarlo en cualquier momento

```bash
# 1) ¿están pinneados todos?
psql "$DATABASE_URL" -tA -c "select ipfs_cid from hermes_knowledge_registry where governance_status='ACTIVE' and ipfs_cid is not null" \
 | while read -r cid; do
     curl -s -X POST "$PANDORAS_KUBO_RPC_URL/api/v0/pin/ls?arg=$cid&type=all" \
       -H "Authorization: Bearer $PANDORAS_KUBO_API_KEY" | grep -q "^$cid" || echo "SIN PIN: $cid";
   done

# 2) ¿responde rápido?
time curl -s -o /dev/null -X POST "$PANDORAS_KUBO_RPC_URL/api/v0/cat?arg=<cid>" \
  -H "Authorization: Bearer $PANDORAS_KUBO_API_KEY"
```

## Evidencia de los tests

`packages/hermes-core/src/knowledge/ipfs/__tests__/kubo-alert-classifier.test.ts` — **6/6**: no alerta por
bloque ausente ni por `no link named`, sí por 401/403, por red/timeout y por 5xx sin marca de ausencia.
