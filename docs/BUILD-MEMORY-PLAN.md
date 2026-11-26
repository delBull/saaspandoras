# Plan para encajar el build en el plan Hobby

**Estado:** análisis para aprobación. **No se ha cambiado nada.**
**Objetivo:** que `next build` quepa en el contenedor de 8 GiB (Hobby, 2 vCPU) para
volver a desplegar por git, sin depender de la cuota de uploads de la API.

---

## 1. Diagnóstico medido

| Dato | Valor | Cómo se obtuvo |
|---|---|---|
| Memoria del contenedor | 8 GiB fijos (Hobby) | docs de Vercel |
| Pico real del build (turbopack, heap 3584) | **7.24 GiB** | `/usr/bin/time -l`, build local |
| Rutas que compila la app | **845** | `app-path-routes-manifest.json` |
| Tamaño de `.next` | 507 MB | `du -sh .next` |
| Fallo en Vercel | `SIGKILL` + reporte OOM | logs de los deploys `f667e1b`, `c6ffd54` |

Margen actual: **0.76 GiB**. Cualquier ruta nueva lo agota.

**Meta:** pico ≤ **6.2 GiB** (1.8 GiB de margen), idealmente ≤ 6.0.

El pico **no** lo domina el heap de JS: bajar `--max-old-space-size` a 2048/2560/3072
dio 7.60 / 7.11 / 7.49 GiB. Lo domina la compilación (memoria nativa de turbopack
+ grafo de módulos).

---

## 2. Palancas, en orden de impacto esperado

| # | Cambio | Ahorro esperado | Riesgo | Coste |
|---|---|---|---|---|
| **L1** | `experimental.cpus: 1` (menos workers en prerender) | −0.5 a −1.0 GiB | build más lento (+2-3 min) | 1 línea |
| **L2** | Ampliar `serverExternalPackages` con deps **JS puras** pesadas: `openai`, `ethers`, `viem`, `@vercel/blob` | −0.2 a −0.6 GiB | bajo (se trazan en `node_modules`) | 1 línea |
| **L3** | Ampliar `optimizePackageImports`: `viem`, `ethers`, `recharts`, `thirdweb`, `@tanstack/react-table` | −0.1 a −0.3 GiB | bajo | 1 línea |
| **L4** | Forzar `dynamic = 'force-dynamic'` en las páginas de marketing/pitch más pesadas (no prerenderizarlas) | −0.3 a −0.8 GiB | cambia TTFB de esas páginas | N archivos |
| **L5** | Arreglar el build de webpack (falla con `TypeError: Cannot read properties of null`) y usar `webpack` + `webpackMemoryOptimizations` (ya configurado) | incierto, potencialmente el mayor | requiere depurar el TypeError | 1-2 h |

**Restricción importante:** `@saasfly/*` **no** puede ir a `serverExternalPackages`.
Su `main` es `src/index.ts` (TypeScript sin compilar): externalizarlos rompe el
runtime. Sólo entran deps con JS ya compilado.

---

## 3. Protocolo de medición (sin gastar deploys)

Para cada candidato, en local:

```bash
rm -rf .next
NODE_OPTIONS="--max-old-space-size=3584" /usr/bin/time -l npx next build --turbopack
# leer "maximum resident set size" y convertir a GiB
```

- 2 repeticiones por configuración (la varianza medida fue ±0.5 GiB, hay que
  promediar y descartar lecturas anómalas).
- Criterio de aceptación: build OK **y** pico ≤ 6.2 GiB.
- Sólo se valida en Vercel **una vez**, con un push (los builds por git **no**
  consumen la cuota `api-upload`).

### Orden de experimentos

```
B0  baseline actual ......................... 7.24 GiB (ya medido)
E1  L1 (cpus: 1) ............................ a medir
E2  E1 + L2 ................................ a medir
E3  E2 + L3 ................................ a medir
E4  E3 + L4 (si hace falta) ................ a medir
```

Si E3 baja de 6.2 GiB, se valida en Vercel y se para.
Si no, se evalúa E4 y, como último recurso, L5 (webpack).

---

## 4. Requisito previo (importante)

Hoy el proyecto `pandoras-dashboard` tiene el Ignored Build Step puesto para
**omitir** los builds que vienen de git (para no gastar el slot único). Para
validar por git hay que **revertirlo** (o ponerlo en `AUTO`) antes del push de
prueba. Si el build encaja, se queda revertido (vuelve el deploy automático); si
no encaja, se vuelve a poner.

---

## 5. Qué NO se toca

- `canonicalOrgId`, `ControlPlaneContext`, capabilities, policy gates.
- Contratos de deal rooms, firma, POF y OM.
- `outputFileTracingIncludes` del OM (`private/**`) — si se toca, el PDF deja de
  viajar en la función.
- Cualquier lógica de negocio: este plan es sólo configuración de build.

---

## 6. Criterio de reversión

Cada cambio es una línea de configuración. Si el build empeora en tiempo sin
bajar el pico, se revierte y se prueba el siguiente. Se documenta el pico medido
de cada configuración en este mismo archivo.

---

## 7. Alternativa si nada encaja

- **Pro**: máquina Enhanced (16 GiB) + cuota de upload alta. Resuelve las tres
  limitaciones de golpe.
- **Prebuilt**: sigue disponible en cuanto se reponga la cuota de upload
  (`api-upload-free`, 5.000/24 h).
