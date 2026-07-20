# Reglas de Dominio (Pandoras Growth OS)

> "No estamos diseñando; estamos preservando un dominio."

Este documento establece las reglas fundamentales de arquitectura para garantizar la integridad y escalabilidad del ecosistema Pandoras. **Cualquier PR o contribución que rompa estas reglas debe ser rechazado.**

## Frontera de Base de Datos y Drizzle

❌ **Nunca importar `db` desde `/app`:**
Está terminantemente prohibido hacer `import { db } from "@/db"` dentro de Server Actions, Rutas de API, o Server Components. 
Si necesitas datos, consúmelos desde un *Repository* o un *Domain Service*.

❌ **Nunca importar esquemas desde la UI:**
Componentes de presentación (React, TMA, Widget) no deben conocer la existencia de `projects`, `platformAssets` o `campaigns` como tablas de base de datos. Solo conocen DTOs.

❌ **Nunca escribir SQL fuera de un Repository:**
Consultas (Selects, Inserts, Updates, Deletes) pertenecen única y exclusivamente a la capa de infraestructura (`/src/lib/domain/*-repository.ts`).

## Flujo de Datos

✅ **Todo acceso a BD pasa por Repository:**
Si es una consulta simple (Lookup Query) o de infraestructura, utiliza un `Repository`. Ejemplo: `ProjectRepository.findById()`.

✅ **Toda lógica de negocio pasa por Domain Services:**
Si necesitas orquestar múltiples repositorios, aplicar lógica compleja, validaciones, o preparar el agregado completo (Business Query), usa el *Domain Service* correspondiente (ej. `ProjectDomainService`, `MarketingDomainService`).

✅ **Los DTO son la única salida del dominio:**
Los servicios de dominio y repositorios nunca devuelven tipos crudos de Drizzle (`typeof projects.$inferSelect`). Deben mapear los resultados a Data Transfer Objects estrictos (`ProjectDTO`, `AssetDTO`). Esto permite que la base de datos mute sin romper la UI.

## Integridad de Datos y Configuraciones

❌ **Nunca usar `extraConfig` como JSON libre para nuevos desarrollos:**
Se acabó el "Wild West" de configuraciones. Cualquier metadata debe tener un contrato estricto.

✅ **Tipado de Metadata:**
Se deben usar interfaces o esquemas Zod (`ProjectMetadata`, `CampaignMetadata`, `AssetMetadata`) para validar qué entra y sale de los campos JSONB. No se permiten propiedades dinámicas sin esquema.

## Organización de Servicios Satélites

A medida que el proyecto crece, no satures el `ProjectDomainService`. Utiliza el servicio adecuado para tu vertical:
- `ProjectDomainService`: Core del proyecto, ownership y roles.
- `CampaignDomainService`: Campañas y trackers.
- `AssetDomainService`: Recursos, eventos, links.
- `MarketingDomainService`: Analítica general, envíos, newsletters.
- `LeadDomainService`: CRM, submissions y registros.
