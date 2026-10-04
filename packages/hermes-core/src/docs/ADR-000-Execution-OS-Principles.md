# ADR-000: Pandora's Execution OS Principles

**Status:** Adopted
**Date:** 2026-08-06

## Contexto
Pandora's ha evolucionado de ser una herramienta de automatización de marketing a convertirse en un **Execution OS** genérico. Este cambio estructural evita la fragilidad arquitectónica y permite ejecutar cualquier tipo de proceso de negocio (Campañas, Ventas, Onboarding) sobre un mismo núcleo o *Kernel*.

Para evitar que la complejidad del negocio contamine nuevamente el Kernel en futuros sprints (o en 1 año), congelamos los principios constitucionales de esta plataforma.

## Decisiones y Principios Constitucionales

1. **El Runtime es Agnóstico (Ciego al Dominio):**
   El Kernel (`ExecutionRuntime`) nunca conoce, entiende, ni le importa el dominio de negocio. No sabe qué es una "Campaña" ni un "Lead". Administra contenedores genéricos (`ExecutionInstance`) cuyo contenido es un `payload` opaco.

2. **Los Motores (Engines) están Aislados:**
   Los *Engines* (Content, Commercial, Knowledge) nunca se llaman directamente entre sí. Toda interacción ocurre de manera orquestada mediante *Capabilities* y *Workflow Definitions*.

3. **El Workflow es un Activo Declarativo:**
   Un `WorkflowDefinition` no es código vivo; es una declaración de *Stages*, *Transitions* y *Capabilities requeridas*. El Kernel lee este activo para orquestar el trabajo, no lo compila.

4. **Desacoplamiento Estricto de Interfaces (UI):**
   La Interfaz de Usuario (Mission Control) **nunca** lee ni interactúa directamente con el estado interno del `ExecutionRuntime` o la `ExecutionInstance`. Siempre consume una proyección puramente de lectura llamada `ExecutionSnapshot`.

5. **Las Políticas (Policies) no son Workflows:**
   Las reglas de negocio (Límites de budget, permisos, tenancy, horarios) son evaluadas por un `PolicyEngine` externo. El Workflow describe *qué* hacer; el Policy Engine dictamina si *se permite* hacer.

6. **El Execution Journal es la Única Fuente de Verdad:**
   Todo lo que ocurre en la plataforma genera un evento inmutable en el `ExecutionJournal`. No se reconstruye el pasado mirando bases de datos relacionales; el Knowledge Engine, las Auditorías y el Event Bus operan exclusivamente consumiendo este Journal.

7. **Interacción Humana Uniforme:**
   El flujo se pausa emitiendo `PendingActions`. Las decisiones humanas entran al sistema mediante la inyección formal de un objeto `HumanDecision` (vía `resume`), delegando la interpretación al Workflow, y no a servicios externos.

## Consecuencias
- **Positivas:** Escalabilidad absoluta. Añadir un *Support Workflow* o un *Investment Workflow* mañana requiere cero cambios en el Kernel.
- **Negativas/Trade-offs:** Curva de aprendizaje inicial ligeramente mayor para nuevos ingenieros, ya que toda la orquestación ocurre indirectamente vía capacidades y snapshots en lugar de invocaciones directas.
