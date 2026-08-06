# ADR-003: Capability Mesh

## 1. Contexto
Para evitar que Hermes envíe comandos estáticos ("genera un post de twitter") que el receptor podría no saber interpretar de igual manera si cambia el proveedor, se requiere estandarizar las capacidades.

## 2. Decisión
Se instituye la **Capability Mesh**. Esta malla dinámica mantiene el catálogo de capacidades funcionales que Hermes puede orquestar (ej. `content.generate`, `image.edit`, `campaign.launch`).
Cada Capability define su contrato de entrada (Context) y salida (Artifacts), independiente de quién lo vaya a ejecutar.

## 3. Consecuencias
Las aplicaciones y el Kernel solicitarán la ejecución de una "Capability" en lugar de llamar a un servicio concreto. Las capacidades actúan como la capa semántica de abstracción (similar a las interfaces en OOP) entre el requerimiento del usuario y la ejecución técnica.
