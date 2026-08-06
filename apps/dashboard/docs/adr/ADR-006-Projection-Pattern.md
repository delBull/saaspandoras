# ADR-006: Projection Pattern

## 1. Contexto
Las bases de datos internas guardan una complejidad que incluye campos legacy (`w2eConfig`), relaciones fragmentadas y lógica de retrocompatibilidad, la cual no debe filtrarse hacia los clientes que consumen Hermes.

## 2. Decisión
El estado emitido por el Control Plane siempre utilizará un **Projection Pattern**. El motor de proyección toma el estado interno complejo (DB, Adapters, Registros) y lo proyecta hacia afuera como un modelo de datos limpio y estandarizado para los consumidores.

## 3. Consecuencias
El esquema de base de datos puede evolucionar de manera independiente a las APIs consumidas por S'Narai, Media Co o el Workbench. Se aísla la deuda técnica interna (`w2eConfig`) mediante proyecciones seguras y versionables.
