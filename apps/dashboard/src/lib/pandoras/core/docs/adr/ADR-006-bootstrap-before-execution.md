# ADR-006: Bootstrap Before Execution

## Status
**Accepted** - Phase II (Integration Phase)

## Context
A medida que conectamos el entorno SaaS (PostgreSQL, Tenants, Billing, Configuración) con el **Pandora's Execution OS**, surge el riesgo de que el Kernel, Hermes o los Workflows intenten consultar la base de datos para obtener su propio contexto durante la ejecución. Esto acoplaría el motor de ejecución a la infraestructura de la aplicación (Drizzle, NextAuth, etc.), destruyendo su portabilidad.

## Decision
Establecemos la regla inquebrantable de **Bootstrap Before Execution**.

1. **Aislamiento Total del Kernel**: Ningún componente del Execution OS (Kernel, Hermes, Workflows) puede consultar bases de datos, APIs o repositorios para construir su contexto (identidad, políticas, branding).
2. **Contexto Hidratado**: Toda la información necesaria para ejecutar un Workflow se resuelve **antes** de que el OS se entere de que existe una ejecución.
3. **El Bootstrap Layer (Organization Runtime)**: Se crea una capa que pertenece exclusivamente al entorno de la aplicación (no al OS). Esta capa es la única responsable de conectarse a la Base de Datos, recolectar la configuración del Tenant y ensamblar el `ExecutionIdentitySnapshot`.
4. **Hermes Ignorante de Infraestructura**: Hermes no recibe `tenantId` ni `userId` para ir a buscarlos. Recibe el `ExecutionIdentitySnapshot` ya hidratado por la capa de Bootstrap.

## Consequences
- **Portabilidad Asegurada**: El OS y Hermes pueden ser extraídos y ejecutados en un entorno móvil o de consola sin modificar una sola línea de código, siempre que se les provea un Snapshot válido.
- **Acoplamiento Nulo**: Los Workflows y Adapters operan de forma pura usando el `ExecutionContext`, garantizando ejecuciones reproducibles.
- **Rendimiento**: Se evita el n+1 de consultas a la BD durante la ejecución del OS, ya que todo el estado necesario fue congelado en el Snapshot antes de arrancar.
