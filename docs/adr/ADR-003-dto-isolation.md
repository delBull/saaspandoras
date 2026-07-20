# ADR-003: ¿Por qué los DTO aíslan Drizzle?

## Status
Accepted

## Contexto
Drizzle genera tipos derivados del esquema como `typeof projects.$inferSelect`. Cuando los componentes UI, Server Actions o endpoints públicos importan estos tipos, cualquier cambio en una columna de base de datos (`extraConfig` -> `metadata`) rompe todo el flujo en cascada.

## Decisión
Usar DTOs (Data Transfer Objects) puros en TypeScript que funcionen como "Contratos" independientes de la base de datos.
Los *Domain Services* se encargan de levantar datos usando *Repositories* y empaquetarlos en `ProjectDTO`, `AssetDTO` o `CampaignDTO`. La UI y los consumidores consumen exclusivamente DTOs.

## Consecuencias
- **Positivas**: El código React, el Portal, y las Server Actions son impermeables a los cambios de esquema SQL.
- **Negativas**: Necesitamos escribir y mantener "Mappers" que conviertan de Drizzle a DTOs.
