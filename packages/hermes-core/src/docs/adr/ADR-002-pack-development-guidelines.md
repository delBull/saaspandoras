# ADR-002: Pack Development Guidelines

## Status
**Accepted** - v1.0.0 Freeze

## Context
Con el lanzamiento del SDK de Pandora's OS (`createPandorasApp`), todo el desarrollo de producto se realiza mediante la inyección de "Packs". Necesitamos establecer fronteras claras sobre qué constituye un Pack válido y qué prácticas están prohibidas para evitar que los desarrolladores corrompan el SO en tiempo de ejecución.

## Decision
Un **Pack** es un conjunto de definiciones declarativas y adaptadores que extienden las capacidades de un dominio sobre el Execution OS.

### ✅ Qué PUEDE contener un Pack:
1. **Workflow Packs**: Definiciones de procesos de negocio (`defineWorkflow`).
2. **Capability Packs**: Declaración de interfaces de entrada/salida (`defineCapability`).
3. **Adapter Packs**: Implementaciones técnicas específicas (`defineAdapter`).
4. **Knowledge Packs**: Reglas y patrones inyectables para el Knowledge Engine.
5. **Identity Packs**: Resolvers personalizados para el ensamblador (ej. `DeepLLocalizationResolver`).

### ❌ Qué NO PUEDE contener un Pack:
Las siguientes acciones están estrictamente prohibidas y representan una violación de la arquitectura:
1. **Modificar el ExecutionDirector**: Un Pack no puede sobrescribir ni parchar la forma en que se dirigen las instancias.
2. **Alterar el ExecutionJournal**: Los eventos deben ser inmutables. Un Pack no puede inyectar eventos falsos o borrar historial.
3. **Sobrescribir el ExecutionRuntime**: El motor de avance de estados (drive) es intocable. Si un flujo no avanza, el error está en la definición del Workflow, no en el motor.
4. **Importar clases privadas del Core**: Un Pack sólo debe depender del SDK exportado en `core/sdk/*` y de los contratos en `core/contracts.ts`.

## Consequences
- El desarrollo de productos se vuelve 100% declarativo.
- Si un desarrollador necesita violar esta guía para construir su producto, debe presentar una propuesta para un cambio en el Kernel (bajo las reglas del ADR-001).
