# ADR 013: Core Contracts Freeze

## Estado
Aceptado - Blueprint v1 (Pandora's Core)

## Contexto
El ecosistema Pandora's (Growth OS, Hermes OS, S'Narai, Media Co, Capital) está listo para su lanzamiento. Sin embargo, para garantizar que los productos evolucionen sin obligarnos a refactorizaciones destructivas en el futuro, es necesario congelar las interfaces base que comunican al núcleo (Core) con las implementaciones de negocio.

## Decisión (El Congelamiento de Contratos)
Declaramos que **Pandora's Core queda estrictamente congelado alrededor de 9 contratos fundamentales**. Estos contratos solo podrán alterarse mediante un cambio de versión mayor (v2, v3, etc.) y nunca a través de modificaciones incrementales menores.

### Los 9 Contratos Inmutables
1. **ExecutionRequest**: Representa la petición de ejecución (reemplaza `ExecutionContext` + `capability`). Contiene el contexto, capability, input, metadata, y executionOptions (timeout, prioridad, etc.).
2. **ExecutionResult**: El objeto estándar devuelto tras la ejecución de una capability.
3. **CapabilityDefinition**: El registro de una capacidad. Define el `id`, `version`, `inputSchema`, `outputSchema`, `executionType` (sync/async), permisos, y el dominio al que pertenece (ej. `marketing.scoreLead`).
4. **ServiceProvider**: La interfaz que deben implementar todos los Providers (`execute(request: ExecutionRequest): Promise<ExecutionResult>`).
5. **Artifact**: El modelo universal para todo lo producido o consumido por los módulos (imágenes, documentos, JSON, calendarios, certificados).
6. **Event**: Estructura de eventos para el Event Bus (ej. `LeadQualified`, `PaymentReceived`). El Core no inventa eventos aislados; existe un estándar.
7. **Identity**: Representación única del tenant/usuario o agente a través de la plataforma.
8. **Job**: Representación de trabajos en segundo plano o tareas asíncronas orquestadas por el Automation Domain.
9. **Resource**: Representación abstracta de recursos gestionados (GPU, llamadas a API externas, workers de colas, workflows, etc.).

## Consecuencias y Regla Arquitectónica de Oro (El Décimo Principio)

> **"Los productos nunca consumen implementaciones de dominio directamente. Siempre consumen contratos del Core. Las implementaciones evolucionan detrás de Providers y Facades, preservando la estabilidad del ecosistema."**

1. Hermes nunca importará un módulo interno como `MarketingService` o `DrizzleRepository`.
2. Hermes y cualquier OS del ecosistema interactúan exclusivamente mediante el `ExecutionRequest`.
3. El `Provider` y el `Facade` asociado se encargarán de mapear el contrato congelado hacia la lógica de negocio subyacente.
4. Cuando un módulo cambie (por ejemplo, extraer Marketing a un paquete propio), el `ServiceProvider` se actualizará, pero los contratos (1 al 9) permanecerán intactos, resultando en un ecosistema altamente modular y resiliente.
