# ADR-002: ¿Por qué existen Domain Services?

## Status
Accepted

## Contexto
Originalmente, las rutas de la API, Server Actions y UI llamaban a `db.select()` y `db.insert()` directamente. Cuando se requería lógicas compuestas (por ejemplo: "Obtener todos los eventos de un proyecto y cruzarlo con su estado Web3 y sus campañas"), cada Server Action tenía que re-escribir esta lógica, llevando a duplicidad masiva y riesgo de seguridad.

## Decisión
Forzar el uso de `Domain Services` como *Aggregate Roots* (fachadas de alto nivel) para la orquestación de datos de negocio. Por ejemplo, `ProjectDomainService` o `AssetDomainService`. 

## Consecuencias
- **Positivas**: Centraliza las reglas de negocio. Aisla la UI (React/TMA/Dashboard) de saber cómo funcionan las bases de datos. Permite compartir lógica entre APIs, Server Actions y scripts de migración.
- **Negativas**: Añade capas adicionales (Domain -> Repository -> Drizzle). A veces, para algo trivial, parece burocrático (pero esta burocracia protege el sistema).
