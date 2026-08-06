# ADR-008: Execution Lifecycle

## 1. Contexto
La orquestación de tareas cognitivas requiere manejar tiempos impredecibles, interrupciones, estados asíncronos o streaming de datos en tiempo real. 

## 2. Decisión
El ciclo de vida de ejecución queda formalmente aislado en el **Execution Engine**, operando independientemente de los Channel Adapters que originaron la petición.
El ciclo vital consta de fases definidas (ej. Intent -> Decision -> Execution -> Outcome), emitiendo eventos de telemetría a lo largo de su progreso.

## 3. Consecuencias
Los Channel Adapters (ej. Bot de Telegram) solo inyectarán peticiones vía el `Unified Execution API`. La lógica que determina *cómo* y *cuándo* se completa la ejecución residirá puramente en el Kernel, que podrá decidir si se atiende de forma sincrónica, asincrónica, diferida o si se encola para el Resource Manager.
