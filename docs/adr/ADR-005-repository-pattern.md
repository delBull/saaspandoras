# ADR-005: ¿Por qué usamos el Repository Pattern?

## Status
Accepted

## Contexto
Teníamos más de 80 referencias a `db.insert` y más de 200 referencias a `db.select` esparcidas en la UI (Server Components), Rutas de API y Server Actions. Modificar una columna de tabla o la lógica subyacente requería hacer un Search/Replace en todo el repositorio, propenso a errores y omisiones.

## Decisión
Encapsular toda interacción con la base de datos (y la dependencia de Drizzle) en clases Repository (ej. `ProjectRepository`, `AssetRepository`). 
Ningún archivo dentro de `/app` tiene permitido importar de `@/db`.

## Consecuencias
- **Positivas**: Las operaciones de infraestructura quedan centralizadas. Se reduce la duplicidad de queries. Facilitará la migración o testeo de módulos.
- **Negativas**: Aumenta la verbosidad de leer y escribir a la base de datos.
