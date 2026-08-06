# ADR-001: Hermes as Cognitive OS

## 1. Contexto
Originalmente Hermes fue concebido con responsabilidades difusas que incluían aspectos de UI y manejo de canales (Telegram Bot con lógica incrustada). Esto impedía su escalabilidad.

## 2. Decisión
Hermes v1 se redefine estrictamente como un **Cognitive Operating System** compuesto por 12 pilares fundamentales, divididos en dos dominios: Runtime (Núcleo) e Interfaces/Registros.

**Runtime:**
1. Kernel
2. Execution Engine
3. Intelligence Engine
4. Identity Runtime
5. Artifact Store

**Interfaces:**
6. Unified Execution API
7. Control Plane
8. Workbench
9. Service Registry
10. Capability Registry
11. Binding Registry
12. Channel Adapters & Legacy Adapter Layer

## 3. Consecuencias
Hermes centraliza la toma de decisiones, enrutamiento cognitivo y orquestación, exponiendo todo a través del Unified Execution API. Todos los componentes periféricos (incluyendo bots, aplicaciones web y sistemas externos) deben interactuar con Hermes tratándolo como el Sistema Operativo subyacente.
