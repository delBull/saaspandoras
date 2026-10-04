# ADR-007: Strategy Above Execution

## Status
**Accepted** - Phase II (Integration Phase)

## Context
A medida que evolucionamos Hermes, es evidente que el modelo clásico de Chatbot transaccional (`Intent` -> `Workflow`) es insuficiente para administrar procesos de negocio a largo plazo (ej. "Lanzar campaña comercial"). Si delegamos la estrategia a los Workflows, el OS perderá su propósito como motor agnóstico de máquinas de estado.

## Decision
Establecemos el principio **Strategy Above Execution**: Hermes administra objetivos; el Execution OS ejecuta tareas.

### Reglas
1. **Contexto Estratégico:** Hermes es el dueño y mantenedor del contexto estratégico a largo plazo (`Missions` y `Goals`).
2. **Workflows como Herramientas:** Una `Mission` no es un historial de Workflows ejecutados. Los Workflows son simplemente herramientas operativas invocadas por Hermes para avanzar el estado de una `Mission`.
3. **OS Ignorante de Estrategia:** El Execution OS nunca contiene lógica de estrategia ni conoce el panorama general. Solo recibe una petición de ejecutar un Workflow específico (`ExecutionRequest`) bajo una Identidad (`ExecutionIdentitySnapshot`) y devuelve un resultado.
4. **Decisión Desacoplada:** El `OrganizationRuntime` (Bootstrap) provee el contexto pero no toma decisiones. Las políticas (`CanExecute`) son evaluadas por el Policy Engine del OS, no por el Bootstrap.
5. **No Ejecución Directa (Prohibición Estricta):** Hermes solamente solicita progresión de una Mission. Toda acción concreta (como enviar un mensaje a Telegram o llamar a OpenAI) DEBE transformarse en una ejecución administrada por el Execution OS (Workflows/Capabilities). Hermes tiene prohibido ejecutar capacidades directamente.

## Consequences
- **Hermes (Shell):** Se convierte en un "Chief Operating Agent". Analiza intenciones (`GoalRecognizer`), administra misiones (`MissionManager`), y planea siguientes pasos (`MissionPlanner`), que pueden ser ejecutar workflows, hacer preguntas o esperar.
- **Jerarquía Cognitiva:** La relación pasa a ser `Goal -> Mission -> Intent -> Workflow`, degradando al Intent a una señal de acción táctica inmediata sin eliminarlo por completo.
- **Execution OS:** Permanece puro y sin estado a largo plazo. Solo sabe cómo transicionar máquinas de estado y ejecutar código de Providers.
