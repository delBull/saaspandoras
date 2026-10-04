# ADR-008: Event Driven Strategy Layer

## Contexto
En iteraciones anteriores, establecimos a Hermes como la capa estratégica y al Execution OS como la capa táctica (ADR-007). El Sprint 19 añadió la persistencia de misiones, permitiendo que las decisiones tácticas sobrevivan reinicios. 
Sin embargo, el progreso de la misión dependía del "polling" implícito del usuario preguntando `"¿Qué sigue?"`. 
Para que Pandora's opere verdaderamente como un *Operating Agent*, Hermes debe ser capaz de reaccionar de forma asíncrona y autónoma ante cambios en la misión, delegando acciones sin esperar la intervención humana.

## Decisión
Implementar un **Mission Event Engine** que eleve los eventos operacionales a señales que desencadenan comportamientos autónomos, utilizando el patrón **Event Bus** en el corazón de la capa estratégica.

### 1. Separación Estricta de Eventos
Evitaremos el acoplamiento separando dos dominios de eventos:
- **Strategic Events (Mission Events)**: Pertencen a Hermes. Modelan el ciclo de vida del objetivo (e.g., `goal_created`, `milestone_completed`, `strategy_changed`, `mission_blocked`, `approval_required`).
- **Execution Events**: Pertenecen al OS. Modelan la operación pura (e.g., `workflow_started`, `workflow_completed`, `task_failed`, `provider_error`).

Hermes escucha sus propios *Strategic Events* para planear la siguiente acción, pero ignora los detalles de cómo el *Execution Event* mueve los engranes, preservando la barrera arquitectónica.

### 2. Event Envelope (Trazabilidad y Contexto)
Todo evento de la capa estratégica usará un envoltorio (envelope) estructurado para garantizar su trazabilidad cuando escale a cientos de organizaciones y miles de misiones:
```typescript
interface MissionEvent {
  id: string;
  type: MissionEventType;
  organizationId: string;
  missionId: string;
  packId: string;
  occurredAt: Date;
  actor?: string;
  payload: any;
  metadata: any;
}
```

### 3. Event Bus & Dispatcher
El `MissionManager` sigue siendo la fuente de verdad. El flujo correcto es:
1. El `MissionManager` actualiza la Misión y la persiste vía `MissionRepository`.
2. Una vez guardada, el `MissionManager` **despacha** la noticia al `MissionEventBus`.
3. El Bus distribuye el evento a sus handlers: `SnapshotHandler`, `AnalyticsHandler`, `PlannerHandler`.

El evento no reemplaza la persistencia, simplemente comunica que el estado ya cambió.

### 4. Mission Snapshots (Gobernabilidad de IA)
Los `mission_snapshots` no serán solo backups de datos, sino **Strategic State Snapshots**. Guardarán el contexto exacto de *por qué* Hermes tomó una decisión en ese preciso instante.
Almacenarán el estado, fase, hitos, próxima acción y, críticamente, la **razón (reason)** de la decisión (ej. "branding completed & campaign criteria satisfied").

### 5. Frontera del Autonomous Planner
El Planner, al reaccionar a un evento estratégico, no inyecta directamente la acción en el OS. Primero, genera una **Strategy Decision**:
```typescript
{
  decision: "start lead generation",
  reason: ["branding milestone completed", "campaign phase reached"],
  workflow: "marketing.lead_generation.v1"
}
```
Esa decisión se audita (vía Snapshot) y posteriormente se transforma en un `ExecutionRequest` para el OS. Esto separa el "pensar" del "ejecutar" y genera oro para la trazabilidad de la IA.

## Consecuencias
- **Positivas**: Hermes adquiere autonomía real. Un *webhook* externo puede detonar un milestone que provoque que Hermes despierte, decida la siguiente acción táctica y se la delegue al Execution OS en background, cerrando el ciclo de *Agentic Automation*.
- **Negativas/Riesgos**: Mayor complejidad al depurar flujos asíncronos en cadena y el riesgo de generar ciclos infinitos (loops) si un milestone dispara un workflow que a su vez dispara repetitivamente el mismo milestone.
