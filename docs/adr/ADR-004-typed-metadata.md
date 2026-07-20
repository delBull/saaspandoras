# ADR-004: ¿Por qué metadata está tipada?

## Status
Accepted

## Contexto
El uso de campos JSONB genéricos como `extraConfig` derivó en un anti-patrón donde los Server Actions mutaban la configuración sin validación, causando llaves fantasma, problemas de sincronización de tipos y errores silenciosos.

## Decisión
Todo campo JSONB (como `projects.metadata` o `platform_assets.metadata`) debe tener un contrato o *Validator* asociado (usualmente definido en TypeScript o Zod).
Por ejemplo, en vez de un JSON libre, se definen interfaces explícitas como `IntegrationMetadata`, `ProjectMetadata` y `AssetMetadata`.

## Consecuencias
- **Positivas**: Reducción drástica de bugs en producción por desincronización de campos de configuración. El IDE y el compilador detectan errores de acceso.
- **Negativas**: Mayor trabajo inicial para tipar y validar configuraciones que antes se inyectaban dinámicamente.
