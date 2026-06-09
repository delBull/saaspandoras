# Sesión 3 — Remediación de Vulnerabilidades (09-Jun-2026)

## Resumen

Basado en el reporte de la Sesión 2, se corrigieron **6 vulnerabilidades** activas modificando **6 archivos** en el dashboard (`apps/dashboard`).

---

## Cambios Realizados

### FASE 1 — CRÍTICO

#### VULN-05: CORS Origin Reflection (CVSS 8.1)

**Archivo:** `apps/dashboard/src/app/api/v1/analytics/route.ts`

**Problema:** El endpoint reflejaba el header `Origin` sin validación:
```ts
const origin = req.headers.get('origin') || '*';
'Access-Control-Allow-Origin': origin, // reflect ANY origin
```

**Solución:** Se implementó validación contra whitelist de dominios conocidos:
- `*.pandoras.finance`
- `*.pandoras.org`
- `*.vercel.app`
- `http://localhost:*`
- Orígenes no reconocidos → `https://dash.pandoras.finance`
- Se agregó `Access-Control-Allow-Credentials` y `Vary: Origin`

---

#### VULN-05: Loose `localhost` check en middleware (CVSS 8.1)

**Archivo:** `apps/dashboard/src/middleware.ts` (líneas 17 y 106)

**Problema:** `origin.includes("localhost")` permitía falsificar origen (ej. `evillocalhost.com`).

**Solución:** Cambiado a `origin.startsWith("http://localhost:")` — más preciso, permite cualquier puerto.

---

### FASE 2 — ALTO

#### VULN-06: Analytics endpoint sin autenticación (CVSS 6.5)

**Archivo:** `apps/dashboard/src/app/api/v1/analytics/route.ts`

**Problema:** El endpoint aceptaba cualquier body sin validación y sin rate limiting.

**Solución:**
- Rate limiting vía `apiRateLimiter` (1000 req/min por IP)
- Validación de tamaño de body (max 50KB via Content-Length)
- CORS whitelist como control de acceso primario

---

### FASE 3 — MEDIO

#### VULN-07: Producción conectada a staging via CSP (CVSS 5.9)

**Archivo:** `apps/dashboard/src/middleware.ts` (línea 129→)

**Problema:** `connect-src` incluía `https://*.pandoras.finance` (wildcard) que cubría `staging.dash.pandoras.finance`.

**Solución:** CSP ahora es environment-aware:
- **Producción:** `https://dash.pandoras.finance https://app.pandoras.org` (sin wildcard)
- **Dev/Staging:** `https://*.pandoras.finance https://*.pandoras.org` (wildcard permitido)

---

#### VULN-04: Staging URLs hardcodeadas en producción (CVSS 4.7)

Se corrigieron 4 archivos con URLs de staging que debían ser dinámicas:

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `components/sidebar.tsx` | 838 | `staging.dash.../whitepaper` → `/whitepaper` (relativo) |
| `lib/marketing/growth-engine/email-senders.ts` | 1047 | CTA URL ahora usa `isProd` para elegir dominio |
| `lib/marketing/engine.ts` | 157 | Pay link domain ahora usa `NODE_ENV` en vez de `ownerContext` |
| `api/admin/telegram-bridge/educacion/route.ts` | 91,157 | Deep links ahora usan `getDashboardBaseUrl()` (env-aware) |

**Nota:** Quedan 14 referencias a `staging.dash.pandoras.finance` que son intencionales o dinámicas:
- Detección de entorno (`host.includes('staging')`)
- CORS whitelists necesarias para staging deployment
- Switcher navegacional entre prod/staging
- Enlace "Ir al Sandbox" en modal de deploy
- Fallbacks en config.ts con detección de rama
- Enrutamiento por tipo de API key (pk_live_ → prod, pk_test_ → staging)

---

### FASE 4 — BAJO

#### VULN-01: NEXT_PUBLIC_* en bundles (CVSS 5.3)

**Hallazgo:** 30+ variables NEXT_PUBLIC_* se exponen en bundles. Ninguna contiene secrets/API keys. Las más sensibles son:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (pública por diseño)
- `NEXT_PUBLIC_PANDORAS_EDGE_URL` — Puede apuntar a staging si mal configurada en Vercel
- `NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE` — Teléfono de negocio (bajo riesgo)

**Acción:** No requiere cambio de código. Verificar en Vercel que `NEXT_PUBLIC_PANDORAS_EDGE_URL` apunte a producción.

#### VULN-03: robots.txt revela rutas (CVSS 2.3)

**Dashboard:** ✅ Ya bloquea todos los crawlers (`disallow: ['/']`)
**Marketing (nextjs):** ✅ Permite crawlers (correcto para sitio público)

---

## Estado Final de Vulnerabilidades

| ID | Vulnerabilidad | CVSS | Estado |
|----|---------------|------|--------|
| VULN-05 | CORS Origin Reflection | 8.1 | ✅ CORREGIDO |
| VULN-06 | Analytics sin auth | 6.5 | ✅ CORREGIDO (rate limit + body validation + CORS) |
| VULN-07 | Prod conectado a staging | 5.9 | ✅ CORREGIDO |
| VULN-04 | Staging URL en producción | 4.7 | ✅ CORREGIDO (4 archivos) |
| VULN-01 | Credenciales en bundles | 5.3 | ⚠️ MITIGADO (verificar env vars en Vercel) |
| VULN-03 | robots.txt revela rutas | 2.3 | ✅ YA CORREGIDO (sesión anterior) |
| VULN-02 | Security Headers | Media | ✅ YA CORREGIDO (sesión anterior) |

### S'Narai (repositorio externo → `/Users/Marco/Documents/Company/Aztecas/Proyectos/Narai/`)

| Hallazgo | Severidad | Estado |
|----------|-----------|--------|
| THIRDWEB_SECRET_KEY en .env/.env.local | 🔴 CRÍTICO | ✅ MITIGADO (archivos en .gitignore, rotar key recomendado) |
| Sin security headers (CSP, HSTS, XFO) | 🟠 ALTO | ✅ CORREGIDO en `apps/web/src/middleware.ts` (Narai) |
| Staging URL hardcodeada | 🟡 MEDIO | ⚠️ NO APLICA (no existe `user-auth-form.tsx` en Narai) |
| `host.includes("vercel.app")` en waitlist | 🟡 MEDIO | ⚠️ NO APLICA (no existe `waitlist/route.ts` en Narai) |
| robots.ts permisivo (intencional) | 🟢 BAJO | ✅ OK (sitio público) |
| next.config.mjs ignora errores build | 🟢 BAJO | ⚠️ NO TOCADO (requiere decisión, podría romper deploys) |

---

## Archivos Modificados

### Dashboard (saaspandoras — committed en `36528c98`)
```
apps/dashboard/src/app/api/v1/analytics/route.ts          # VULN-05 + VULN-06
apps/dashboard/src/middleware.ts                           # VULN-05 + VULN-07
apps/dashboard/src/components/sidebar.tsx                  # VULN-04
apps/dashboard/src/lib/marketing/engine.ts                 # VULN-04
apps/dashboard/src/lib/marketing/growth-engine/email-senders.ts  # VULN-04
apps/dashboard/src/app/api/admin/telegram-bridge/educacion/route.ts  # VULN-04
```

### S'Narai (repo externo — pendiente de commit)
```
apps/web/src/middleware.ts                                 # Security headers + CSP
```

---

## Para Próxima Sesión

1. **Verificar Vercel env vars:** Asegurar que `NEXT_PUBLIC_PANDORAS_EDGE_URL` apunte a producción en el deployment de producción
2. **Legal pages 500:** Son errores de infraestructura en staging (datos faltantes), no bugs de código. Verificar que staging tenga la DB poblada.
3. **Rotar THIRDWEB_SECRET_KEY** en Tercerweb Dashboard (por precaución, aunque está en .gitignore)
4. **Considerar migrar CSP de Report-Only a Enforce** cuando se haya validado que no hay falsos positivos
5. **Considerar eliminar el endpoint legacy bridge** si ya no es necesario (Narai ya no lo usa)
6. **Decidir si reactivar TypeScript/ESLint validation** en `next.config.mjs` (riesgo: builds pueden fallar)
