# ADR-002: Service Provider Architecture

## 1. Contexto
Para ejecutar tareas, Hermes necesita apoyarse en servicios externos e internos (por ejemplo, Pandora's Media Co, OpenAI, Stripe). Antes, estos se referenciaban directamente por nombre dentro del motor cognitivo.

## 2. Decisión
Se adopta la arquitectura de **Service Provider**. Todo sistema externo o interno que brinde funcionalidades a Hermes debe acoplarse como un Service Provider.
Hermes interactúa con ellos a través de contratos estrictos de integración:
* Identity Contract
* Capability Catalog
* Context Contract
* Artifact Contract
* Workflow Contract
* Telemetry & Health Contracts

## 3. Consecuencias
El código del Kernel de Hermes no contendrá referencias a "Sofía", "Minerva" o "Media Co". Estos se registrarán como entidades abstractas (`EditorialServiceProvider`, `LLMProvider`) bajo el Service Registry. Esto garantiza que cualquier proveedor pueda ser reemplazado o versionado sin necesidad de modificar el Kernel de Hermes.
