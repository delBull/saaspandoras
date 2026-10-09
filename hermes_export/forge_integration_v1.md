# Forge x Pandora's Media Co - Integración Fase 1 (Identity & API)

## Objetivo
Implementar la base de integración para que Forge opere como un Tenant Consumidor de Hermes y habilitar las APIs de contenido para aprovisionamiento, creación de jobs y aprobación de assets.

## Resumen de Implementación
1. **Content API (Media Co)**: 
   - Se crearon los endpoints base (`/api/v1/content/assets`, `/api/v1/content/jobs`, `/api/v1/content/jobs/[jobId]`, `/api/v1/content/assets/[assetId]/approval`) que validan la identidad server-to-server mediante `IntegrationKeyService` asegurando el aislamiento del tenant.
2. **Endpoint de Aprovisionamiento**:
   - Se creó `/api/v1/integrations/tenants/provision` para permitir a integradores con el permiso `tenant.provision` instanciar tenants programáticamente.
3. **Sección para Devs (Portal Hermes)**:
   - Se refactorizó `DevelopersClient.tsx` para incluir un sistema de navegación por pestañas (API Keys, Webhooks, Conecta tu Agente).
   - La pestaña "Conecta tu Agente" prepara el flujo para que Forge (o cualquier agente de terceros) pueda conectarse al tenant mediante el flujo OAuth/Webhook.

## Auditoría Técnica (Walkthrough)

| Claim | Evidencia (archivo:línea) | Sello | Estado |
| ----- | --------- | ----- | ------ |
| Content API: Listado de Assets | `apps/dashboard/src/app/api/v1/content/assets/route.ts:1` | [NUEVO] | ✅ IMPLEMENTADO+CABLEADO |
| Content API: Creación de Jobs | `apps/dashboard/src/app/api/v1/content/jobs/route.ts:1` | [NUEVO] | ✅ IMPLEMENTADO+CABLEADO |
| Content API: Detalles de Jobs | `apps/dashboard/src/app/api/v1/content/jobs/[jobId]/route.ts:1` | [NUEVO] | ✅ IMPLEMENTADO+CABLEADO |
| Content API: Aprobación de Assets | `apps/dashboard/src/app/api/v1/content/assets/[assetId]/approval/route.ts:1` | [NUEVO] | ✅ IMPLEMENTADO+CABLEADO |
| API Aprovisionamiento de Tenants | `apps/dashboard/src/app/api/v1/integrations/tenants/provision/route.ts:1` | [NUEVO] | ✅ IMPLEMENTADO+CABLEADO |
| UI: Pestañas Developers / Webhooks / Agente | `apps/dashboard/src/app/portal/[organizationSlug]/developers/DevelopersClient.tsx:10` | [NUEVO] | ✅ IMPLEMENTADO+CABLEADO |
| Autorización API Server-to-Server | `apps/dashboard/src/app/api/v1/content/assets/route.ts:15` | [PREEXISTENTE] | ✅ IMPLEMENTADO+CABLEADO |

## Estado del Entorno
- Verificación de tipos ejecutada y limpia:
```bash
bun x tsc --noEmit
Scope: repository
Result: 0 errors
```

## Consideraciones para la Fase 2
- **Webhooks**: La UI de Webhooks y Conecta tu Agente actualmente es un mock preparatorio (Fase 1). En la siguiente iteración se debe conectar con la tabla `integration_clients` para persistir las URLs y Secrets de los webhooks de Forge.
- **Aprovisionamiento**: El endpoint de aprovisionamiento utiliza `isSimulationMode: true` por defecto, por lo que los tenants creados mediante API están aislados en el entorno de pruebas hasta que sean aprobados a producción explícitamente.
