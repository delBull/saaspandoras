# Railway — Operación y control de coste

> Última actualización: **2026-11-11** · Cuenta: `delBull (marco.munoz9@gmail.com)`
> Factura del periodo 13 oct → 13 nov: **$26.97** (estimado $28.51).

## 1. Modelo de coste (para decidir rápido)

| Recurso | Precio Railway |
|---|---|
| RAM | **$10 / GB / mes** (se cobra mientras el contenedor está encendido) |
| CPU | $20 / vCPU / mes |
| Volumen | **$0.15 / GB / mes** (se cobra por el tamaño **provisionado**, no por lo usado) |
| Egress | $0.05 / GB |
| **Builds** | **Gratis** (redeployar no cuesta; no perseguir "muchos deploys") |

Consecuencia: lo que manda es **RAM encendida 24/7** y **GB provisionados de volumen**. Un servicio idle de 250 MB cuesta ~$2.5/mes.

## 2. Estado actual (2026-11-11)

### pandoras-production
| Servicio | Dominio | Estado | Nota |
|---|---|---|---|
| App B2C | `app.pandoras.finance` | **App Sleeping ON** | Se duerme sin tráfico → ~$0. Despierta con la primera petición (~5-15 s de cold start) |
| deployer | `deployer-production-d834.up.railway.app` | **App Sleeping ON** | Idle la mayor parte del tiempo |
| IPFS Server | `rpc.ipfs.pandoras.finance` | encendido | 0.22 GB |
| api_pandoras_miniapp | `api-tma.pandoras.finance` | encendido | 0.13 GB |
| Discord Bot | — | encendido | Debe escuchar eventos (no puede dormir) |
| saaspandoras | — | **SLEEPING** | Ya dormido |
| Postgres / Redis | — | encendidos | Necesarios |
| ~~IPFS BioGuard Server~~ | — | **ELIMINADO** | Producto discontinuado; volumen en borrado (`isPendingDeletion`) |
| Pandoras Finance Bot · bullslab-webhooks | — | sin deployment | $0 |

### pandoras-staging — **APAGADO + APP SLEEPING EN TODOS**
Los 7 servicios tienen `sleepApplication: true` **y** sus deployments están detenidos
(`SLEEPING`/`FAILED`, ninguno `RUNNING`). Coste de cómputo ≈ $0.
**Único coste residual:** los 2 volúmenes (9.8 GB provisionados ≈ **$1.47/mes**), que se
cobran por tamaño aunque el servicio esté dormido. Para $0 absoluto habría que borrarlos
(se pierde el dato de staging).

## 3. Encender / apagar staging

```bash
# vincular (una vez por carpeta)
railway link -p 2afb87f8-d06e-487e-bad4-e271a6aad99f -e production

# APAGAR TODO (dejar sin coste)
for S in saaspandoras deployer api_pandoras_miniapp Postgres Redis telegram-bot bullslab-webhooks; do
  railway down -s "$S" -y
done
```

```bash
# ENCENDER (redeploy de la última versión; no rebuild)
for S in saaspandoras deployer api_pandoras_miniapp Postgres Redis telegram-bot bullslab-webhooks; do
  railway redeploy -s "$S" -y
done
```

**Regla de oro:** al terminar de probar en staging → ejecutar el bloque de APAGAR y avisar en el canal del equipo.
Alternativa recomendada para staging: activar **App Sleeping** en los servicios web (se duermen solos, sin cold start de datos en DBs, que se quedan encendidas).

## 4. Volúmenes (importante: NO se pueden reducir)

Los volúmenes están provisionados a **4.9 GB** y sólo usan **0.15–0.23 GB**, pero Railway:

- **No expone el tamaño en la API pública** (ni CLI): no se puede automatizar.
- En el dashboard el único control es **Live Resize**, y según la documentación sirve para
  **ampliar**, no para reducir. No hay "shrink" in-place.

Cómo llegar a la pantalla: canvas del proyecto → clic en el **nodo del volumen** (conectado al
servicio) → **Live Resize** → seguir el prompt.

**Si de verdad se quiere bajar el tamaño**, hay que recrear el volumen:
1. Exportar el dato (`pg_dump` para Postgres, `railway volume files download` para ficheros).
2. Borrar el volumen y crear uno de **1 GB**.
3. Restaurar el dato y volver a montarlo.

No vale la pena hoy: el ahorro máximo son ~$2.9/mes a cambio de downtime + riesgo de datos.

Volúmenes existentes: `pandoras-production` → postgres-volume, redis-volume ·
`pandoras-staging` → Postgres, Redis (borrables si el dato de staging es desechable: **−$1.47/mes**).

## 5. Consultar el gasto

```bash
railway usage                      # total del workspace
railway usage projects --json      # por proyecto
railway metrics -a -p <projectId> -e production --since 7d   # RAM/CPU por servicio
```

## 6. Pendiente / notas

- **Proyecto `bioguard`** (cuenta `donaldmatute8@gmail.com`, otro login): pendiente de eliminar. Requiere volver a iniciar sesión con esa cuenta (`railway logout && railway login`) y borrar el proyecto (servicios `BioGIS` + `Postgres` + volumen de 5 GB).
- **`app.pandoras.finance`** no tiene tráfico hoy: queda dormido, no borrado (decisión de producto: se usará más adelante).
- Si `App B2C` vuelve a necesitar estar siempre despierto, se desactiva el sleeping en el dashboard (Service → Settings → Serverless) — o por API:
  ```bash
  railway api 'mutation { serviceInstanceUpdate(serviceId: "1a35448c-511b-4201-bab0-4b2913adbc79", environmentId: "2cc67f2b-1437-4de3-bf16-c8733796bd70", input: { sleepApplication: false }) }'
  ```
