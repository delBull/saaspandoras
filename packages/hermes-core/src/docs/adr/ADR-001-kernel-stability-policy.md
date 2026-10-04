# ADR-001: Kernel Stability Policy

## Status
**Accepted** - v1.0.0 Freeze

## Context
Tras 13 sprints de evolución, el **Pandora's Execution OS** ha madurado de un framework de marketing altamente acoplado a un Runtime de Ejecución verdaderamente agnóstico. El Kernel ya no conoce dominios específicos (S'Narai, CRM, Hermes, Media), sino primitivas de ejecución (Workflows, Capabilities, Events, Identity, Journal).

Para garantizar que el ecosistema siga creciendo sin que el Kernel colapse bajo casos de uso específicos, necesitamos una política estricta sobre cuándo y por qué se puede modificar el Core.

## Decision
El Kernel de Pandora's OS **sólo puede ser modificado** bajo las siguientes condiciones exclusivas:

1. **Problema Compartido**: Cuando al menos *dos dominios/aplicaciones completamente distintas* (ej. Hermes y Media Co) enfrentan exactamente la misma limitación arquitectónica que los Packs actuales no pueden resolver.
2. **Defecto de Infraestructura**: Cuando existe un bug crítico, una fuga de memoria o un problema de concurrencia directamente en los motores (Director, EventBus, Journal, CapabilityRuntime).

**NUNCA se modificará el Kernel porque:**
- *Hermes necesita un feature específico.* (Debe resolverse con un Hermes Pack).
- *S'Narai tiene un caso de uso especial para IA.* (Debe resolverse extendiendo el CapabilityContext o agregando un Adapter específico).
- *Media Co quiere otro estado en su proceso.* (Se resuelve en la definición del `WorkflowDefinition`).

## Consequences
- **Evolución Lenta del Core**: El Kernel avanzará de forma muy conservadora.
- **Evolución Rápida de las Apps**: Los desarrolladores de producto ganarán velocidad al saber que el OS subyacente es inmutable y predecible.
- **Prevención de Acoplamiento**: Evitamos que el Kernel vuelva a llenarse de lógica de dominio (fuga arquitectónica).
