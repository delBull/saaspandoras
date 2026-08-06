# ADR-011: Unified Execution Model

## 1. Contexto
En las primeras iteraciones de Hermes, los distintos canales (ej. Telegram Bot, S'Narai Web) llamaban a módulos específicos del sistema de manera directa, creando cuellos de botella e impidiendo centralizar la telemetría, políticas y delegación.

## 2. Decisión
Se establece un único modelo universal de ejecución (La ABI del Sistema Operativo): el **Unified Execution Model**.

Todo evento que requiera orquestación cognitiva en Hermes debe pasar obligatoriamente por el método central:
`Hermes.execute(context: ExecutionContext): Promise<ExecutionResult>`

1. **Entrada Única (`ExecutionContext`):** El contexto de ejecución estandariza la petición. Ya no hay variaciones por canal. Todo sistema, agente o adaptador que invoque al Kernel provee el mismo contrato (tenant, channel, identity, priority, capability y payload).
2. **Salida Única (`ExecutionResult`):** Todo Service Provider que complete una `Capability` debe regresar el mismo tipo de objeto, reportando un estatus, un listado de Artifacts estandarizados, y su telemetría/métricas.

## 3. Consecuencias
Ninguna aplicación periférica invocará directamente la lógica cognitiva. Todas actuarán como meros *Channel Adapters* (adaptadores I/O) que construyen un `ExecutionContext`, lo entregan al Kernel, y esperan un `ExecutionResult` para renderizar el resultado en su UI nativa. Esto permite la evolución independiente del Kernel, habilitando el camino para el Resource Manager (Sprint 8).
