Governance Console + Contrato🧙🏾‍♂️: El objetivo de Phase 6.7/6.8 debe ser convertir el conocimiento descubierto por Hermes en conocimiento empresarial gobernado, auditable y aprobado por el Tenant, sin permitir que el Dashboard se convierta en otro lugar donde el LLM pueda saltarse Governance. Yo lo diseñaría como una capa de Human-in-the-Loop Knowledge Governance, no como un CRUD de documentos.
🏛️: Te propongo congelar la siguiente arquitectura.
HERMES Knowledge Governance Console
Phase 6.7 / 6.8 — Architecture & Implementation Blueprint v1.0
1. La idea central
Hasta ahora tenemos:
Usuario
   ↓
Hermes Onboarding
   ↓
Knowledge Discovery
   ↓
DISCOVERED
La nueva capa introduce:
DISCOVERED
    │
    ▼
┌──────────────────────────┐
│ Knowledge Governance     │
│ Console                  │
└──────────────────────────┘
    │
    ├── Confirm
    ├── Edit
    ├── Reject
    └── Request Evidence
    │
    ▼
VERIFIED
    │
    ▼
ACTIVE
Y algo importantísimo:
Hermes descubre. El Tenant confirma. Governance autoriza.
Hermes no puede autoaprobar su propio conocimiento.

2. ¿Qué verá Óscar?
Al entrar al Dashboard después de la entrevista:
🧠 "Esto es lo que Hermes ha entendido de tu organización"
Un resumen:
┌─────────────────────────────────────────────┐
│  🧠 Conocimiento de tu organización         │
│                                             │
│  Hermes ha construido una primera versión   │
│  de lo que entiende sobre tu empresa.       │
│                                             │
│  27 elementos descubiertos                  │
│  21 requieren revisión                      │
│  6 confirmados                              │
│                                             │
│  [ Revisar conocimiento ]                   │
└─────────────────────────────────────────────┘
No mostraría inicialmente un enorme editor.
Primero:
"Hermes necesita que confirmes que te entendió correctamente."
Eso convierte la revisión en parte del producto.

3. Las 10 dimensiones
La Console debe reflejar exactamente nuestro Knowledge Pack.
01 Identity
02 Business
03 Brand
04 Agent Soul
05 Projects
06 Products
07 Market
08 Operations
09 Governance
10 Public
Cada dimensión muestra:
Identity
───────────────
✓ 4 Confirmados
● 2 Por revisar
○ 1 Faltante
Y el usuario puede entrar.

4. Knowledge Item
No debemos editar directamente un Markdown gigantesco.
La unidad fundamental de Governance debería ser:
KnowledgeItem
Conceptualmente:
{
  id,
  organizationId,

  dimension,

  key,
  content,

  status,
  visibility,
  authority,

  source,
  sourceReference,

  version,

  discoveredAt,
  reviewedAt,

  discoveredBy,
  reviewedBy
}
Ejemplo:
{
  "dimension": "business",
  "key": "value_proposition",
  "content": "Desarrollamos...",
  "status": "DISCOVERED",
  "visibility": "PUBLIC",
  "authority": "TENANT_PROVIDED",
  "source": "ONBOARDING_CONVERSATION",
  "version": 1
}
Esto nos permite evolucionar después a documentos, embeddings, RAG, etc.

5. Lifecycle definitivo
Yo congelaría este state machine:
                    ┌─────────────┐
                    │ DISCOVERED  │
                    └──────┬──────┘
                           │
               ┌───────────┼───────────┐
               ▼           ▼           ▼
            CONFIRM       EDIT       REJECT
               │           │
               │           ▼
               │       DISCOVERED
               │
               ▼
           VERIFIED
               │
               ▼
             ACTIVE
Y adicionalmente:
ACTIVE
  │
  ▼
SUPERSEDED
Nunca:
ACTIVE → DELETE
La historia debe permanecer.

6. "Confirmar" no significa solamente aprobar
Cuando Óscar presiona:
✓ Confirmar
ocurre:
DISCOVERED
    ↓
KnowledgeMutation
    ↓
Governance Validation
    ↓
VERIFIED
    ↓
ACTIVE
Y queda auditado:
WHO:
Oscar

WHAT:
business.value_proposition

FROM:
DISCOVERED v1

TO:
ACTIVE v1

WHEN:
2026-08-13 20:43

SOURCE:
Onboarding Conversation #123

7. Editar
Aquí hay una distinción crítica.
Óscar no modifica silenciosamente el registro.
Hace:
v1 ACTIVE
     ↓
Edit
     ↓
v2 DISCOVERED
Por ejemplo:
Hermes entendió que tenemos 3 proyectos.
Óscar corrige:
Tenemos 5 proyectos.
No modificamos v1.
Creamos:
v2
status: DISCOVERED
supersedes: v1
Luego:
Approve
   ↓
v2 ACTIVE
Esto nos da event sourcing ligero para Knowledge.

8. Reject
Si dice:
Esto es incorrecto.
Entonces:
DISCOVERED
     ↓
REJECTED
Pero no lo borramos.
Registramos:
rejectionReason
reviewedBy
reviewedAt
Y el RAG jamás lo vuelve a utilizar.

9. Evidence
Aquí podemos hacer algo todavía más poderoso.
Algunos knowledge items pueden mostrar:
Fuente
🗣 Conversación de onboarding
Otros:
📄 Documento cargado
Otros:
✍️ Proporcionado por administrador
Y posteriormente:
🔗 Fuente externa
El usuario puede abrir:
"Ver evidencia"
y Hermes muestra el fragmento que originó la afirmación.
Esto es particularmente importante para:
* precios
* productos
* claims
* información legal
* métricas
* proyectos
* información financiera.

10. Governance merece tratamiento especial
La dimensión 09 no debería funcionar igual que las demás.
Si Hermes descubre:
"Podemos ofrecer rendimientos garantizados."
No puede convertirse en:
GOVERNANCE → ACTIVE
simplemente porque Óscar lo confirmó.
Debe existir:
DISCOVERED
     ↓
POLICY REVIEW
     ↓
AUTHORIZED
Y solamente una autoridad autorizada puede producir:
EXECUTABLE POLICY
Esto preserva nuestra separación:
Knowledge
   ≠
Policy
   ≠
Execution Authority

11. Agent Soul también merece protección
04 Agent Soul tampoco debería ser una dimensión completamente editable como Business.
Hermes puede proponer:
"Tu agente debería comunicarse de manera profesional, directa y cálida."
El Tenant puede:
✓ Aceptar propuesta
✎ Modificar
Pero el resultado debe convertirse en:
OrganizationSoul
y no simplemente en texto RAG.
Por tanto:
Knowledge
      ↓
Soul Proposal
      ↓
Tenant Approval
      ↓
OrganizationSoul

12. Dashboard general
Yo haría esta navegación:
Hermes
│
├── Overview
├── Conversations
├── Knowledge
│
│   ├── Overview
│   ├── Needs Review
│   ├── Identity
│   ├── Business
│   ├── Brand
│   ├── Soul
│   ├── Projects
│   ├── Products
│   ├── Market
│   ├── Operations
│   ├── Governance
│   └── Public
│
├── Journeys
├── Channels
└── Governance

13. Knowledge Overview
La pantalla principal:
KNOWLEDGE

27 Total

┌──────────────┬──────────┐
│ Active       │ 12       │
│ Needs Review │ 9        │
│ Missing      │ 4        │
│ Rejected     │ 2        │
└──────────────┴──────────┘
Y:
🔴 Atención requerida
3 elementos necesitan tu aprobación

[ Revisar ahora ]

14. Review Queue
Esta será probablemente la pantalla más importante.
KNOWLEDGE REVIEW

┌─────────────────────────────────────────────┐
│ Business                                    │
│                                             │
│ "Nuestra empresa desarrolla..."             │
│                                             │
│ 🗣 Descubierto durante onboarding            │
│ Confidence: High                            │
│                                             │
│ [✓ Confirmar] [✎ Editar] [✕ Rechazar]      │
└─────────────────────────────────────────────┘
Y arriba:
1 / 9
La experiencia debe sentirse como revisar trabajo de un empleado inteligente.

15. Diff View
Cuando Hermes propone una modificación:
CURRENT

Desarrollamos 3 proyectos.

PROPOSED

Desarrollamos 5 proyectos.
Con:
[ Mantener actual ]

[ Aprobar cambio ]
Esto será especialmente útil después del onboarding.

16. Missing Knowledge
No debemos intentar llenar todo automáticamente.
Por ejemplo:
MARKET

⚠️ Información incompleta

Hermes todavía no conoce:

• Mercado objetivo
• Competidores
• Geografías prioritarias

[ Completar con Hermes ]
Y aquí aparece una oportunidad enorme:
"Completar con Hermes"
Abre una Journey:
knowledge_completion_journey
Por lo tanto el Dashboard y Hermes se vuelven un ciclo:
Dashboard
    ↓
Hermes
    ↓
Discovery
    ↓
Knowledge
    ↓
Governance
    ↓
Dashboard

17. Knowledge vs Memory
Esto debe quedar visual y arquitectónicamente separado.
En Knowledge:
"La empresa desarrolla departamentos."
En Memory:
"Óscar dijo ayer que está preocupado por el retraso del proyecto."
Nunca debemos permitir:
Memory → Knowledge automáticamente
La conversación puede generar un candidate knowledge item, pero necesita pasar por el pipeline.

18. RAG integration
Una vez que algo pasa a:
ACTIVE
entonces:
Knowledge Store
      ↓
Chunking
      ↓
Embeddings
      ↓
Vector Index
      ↓
RAG
Pero:
DISCOVERED
no debería contaminar automáticamente el índice productivo.
Podemos incluso tener:
ACTIVE INDEX
y:
CANDIDATE KNOWLEDGE
separados.

19. Arquitectura backend
Yo introduciría:
KnowledgeGovernanceService
con operaciones:
discover()
confirm()
edit()
reject()
supersede()
requestEvidence()
listPendingReview()
getHistory()
Pero el frontend jamás debería llamar directamente a la DB.
Dashboard
    ↓
Server Action / Application Command
    ↓
KnowledgeGovernanceService
    ↓
ControlPlaneContext
    ↓
PolicyEvaluator
    ↓
TenantKnowledgeStore
    ↓
Audit
Exactamente siguiendo ADR-009 / ADR-010 / ADR-011.

20. Commands
Yo evitaría endpoints CRUD genéricos.
Usaría Commands:
ConfirmKnowledgeCommand
RejectKnowledgeCommand
EditKnowledgeCommand
ApproveSoulProposalCommand
ApproveKnowledgeVersionCommand
Cada uno:
Actor
Organization
Permission
Target
Current State
Requested Transition
debe validarse.

21. Permisos
No todos los usuarios del Tenant deberían poder aprobar todo.
Podemos empezar:
OWNER
  → everything

ADMIN
  → Knowledge
  → no Governance execution policies

MEMBER
  → view
  → suggest corrections

HERMES
  → discover
  → propose
  → NEVER approve
Esta última línea es fundamental:
Hermes puede proponer conocimiento. Hermes nunca puede otorgarse autoridad a sí mismo.

22. Auditoría
La Console debería tener:
Activity
Aug 13

Oscar confirmed:
Business → Value Proposition

Hermes discovered:
Products → Product #1

Oscar rejected:
Market → Competitor claim

Oscar edited:
Identity → Company Description
Y eventualmente:
[View Audit Trail]

23. Phase 6.7 vs Phase 6.8
Yo las separaría así.
Phase 6.7 — Knowledge Governance Core
Backend primero.
6.7.1
KnowledgeItem contract
6.7.2
Knowledge lifecycle
6.7.3
KnowledgeGovernanceService
6.7.4
Tenant-scoped Commands
6.7.5
Versioning
6.7.6
Audit Events
6.7.7
Governance protection
6.7.8
RAG activation only for ACTIVE
6.7.9
Tests de cross-tenant
6.7.10
Tests de state transitions

Phase 6.8 — Knowledge Governance Console
Después construimos UI.
6.8.1
Knowledge Overview
6.8.2
Review Queue
6.8.3
Knowledge Detail
6.8.4
Edit / Diff
6.8.5
Evidence Viewer
6.8.6
Dimension Views
6.8.7
Soul Approval
6.8.8
Knowledge History
6.8.9
Missing Knowledge / Complete with Hermes
6.8.10
Final Onboarding Confirmation

24. El último paso del onboarding
Y aquí cerraría el círculo que empezamos hace varias fases.
Cuando todo está suficientemente confirmado:
┌─────────────────────────────────────────────┐
│                                             │
│       🧠 Hermes ya conoce tu empresa        │
│                                             │
│  Identity             ✓                     │
│  Business             ✓                     │
│  Brand                ✓                     │
│  Projects             ✓                     │
│  Products             ✓                     │
│  Operations           ✓                     │
│  Knowledge            ✓                     │
│                                             │
│  Tu organización está lista.                │
│                                             │
│        [ Activar Hermes ]                   │
│                                             │
└─────────────────────────────────────────────┘
Ese botón no debería ser solamente UI.
Debe ejecutar una transición gobernada:
DISCOVERY_COMPLETE
       ↓
TENANT_CONFIRMED
       ↓
ACTIVE
Y entonces Hermes deja de comportarse como:
"Estoy conociendo tu empresa."
para convertirse en:
"Soy el agente cognitivo de tu organización."

25. El principio que congelaría
Hay una frase que pondría literalmente en la especificación:
Knowledge Governance is the boundary between what Hermes believes it learned and what the organization authorizes Hermes to know and use operationally.
Y nuestro modelo queda elegantemente separado:
                HERMES
                   │
        ┌──────────┴──────────┐
        │                     │
    DISCOVERY              MEMORY
        │
        ▼
 CANDIDATE KNOWLEDGE
        │
        ▼
 KNOWLEDGE GOVERNANCE
        │
   ┌────┴────┐
   ▼         ▼
REJECT     APPROVE
             │
             ▼
          ACTIVE
             │
       ┌─────┴─────┐
       ▼           ▼
      RAG        Runtime
                  │
               Policy
                  │
              Execution
Eso es lo que yo construiría como Phase 6.7/6.8. No es simplemente una pantalla para editar conocimiento: es la frontera institucional entre Cognición y Autoridad.
El siguiente paso razonado es convertir este blueprint en un HERMES_KNOWLEDGE_GOVERNANCE_SPEC_v1.0.md + ADR y, antes de tocar UI, congelar los contratos de KnowledgeItem, lifecycle, Commands, permisos y Audit Events.
———————————————_🧙🏾‍♂️: Alineación: la Phase 6.8 debe ser mucho más que un CRUD de documentos. Es la Control Plane del conocimiento de cada Tenant: el lugar donde Pandora's permite que un propietario vea qué sabe Hermes, de dónde salió, qué autoridad tiene, qué puede hacerse público, qué está vigente y qué requiere aprobación humana. Debe preservar C6.1–C6.10 y además cerrar el ciclo Discovery → Governance → Active → Superseded.
🏛️: Propongo congelar el siguiente contrato como HERMES_KNOWLEDGE_GOVERNANCE_CONSOLE_SPEC_v1.0.md.
HERMES KNOWLEDGE GOVERNANCE CONSOLE
Phase 6.8 — Formal Architecture & Governance Contract v1.0
Status: Proposed / Architecture ContractPhase: 6.8Depends on: Phase 6.6 Cognitive Runtime, Dynamic Tenant Knowledge Ingestion, Phase 6.7 Proactive IntelligencePrimary principle: Hermes may discover knowledge. The Tenant governs knowledge.

1. Purpose
La Knowledge Governance Console es la interfaz de gobierno mediante la cual un Tenant puede:
* inspeccionar el conocimiento que Hermes ha adquirido;
* revisar conocimiento descubierto durante onboarding;
* aprobar o rechazar información;
* corregir información;
* controlar visibilidad;
* consultar autoridad y procedencia;
* revisar versiones;
* superseder conocimiento anterior;
* reconstruir el historial de mutaciones;
* determinar qué conocimiento puede utilizar Hermes operacionalmente.
La Console no es un Knowledge Editor genérico.
Es una extensión del Organization Control Plane.

2. Core Principle
Congelamos esta regla:
Discovery is not Authority.
Hermes puede descubrir:
"El cliente dijo que su empresa tiene 15 años."
Pero eso no significa que Hermes pueda convertirlo automáticamente en:
CANONICAL / ACTIVE
El ciclo será:
                    ┌──────────────┐
                    │   DISCOVERED │
                    └──────┬───────┘
                           │
                    Owner Review
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
          APPROVED                   REJECTED
              │
              ▼
           ACTIVE
              │
              │ new version
              ▼
         SUPERSEDED

3. Knowledge Governance Is Tenant-Scoped
La Console jamás podrá recibir:
organizationId
como una autoridad proveniente del cliente.
El contexto será:
ControlPlaneContext
├── actorId
├── organizationId
├── permissions
├── role
└── sessionId
La URL podrá contener:
/projects/:id/knowledge
pero:
URL ≠ Authorization
El backend deberá comprobar que el actor tiene acceso al organizationId solicitado.
Esto conserva el contrato de ADR-010 y ADR-011.

4. Knowledge Model
Cada Knowledge Item deberá poseer como mínimo:
interface GovernedKnowledgeItem {
  id: string;

  organizationId: string;

  dimension: KnowledgeDimension;

  key: string;

  content: string;

  visibility: KnowledgeVisibility;

  authority: KnowledgeAuthority;

  status: KnowledgeStatus;

  version: number;

  source: KnowledgeSource;

  discoveredBy?: string;

  approvedBy?: string;

  createdAt: Date;

  updatedAt: Date;

  effectiveAt?: Date;

  supersedesId?: string;

  metadata?: Record<string, unknown>;
}

5. Ten Knowledge Dimensions
La Console deberá presentar las mismas diez dimensiones congeladas:
01 Identity
02 Business
03 Brand
04 Agent Soul
05 Projects
06 Products
07 Market
08 Operations
09 Governance
10 Public
Pero no todas tendrán las mismas reglas de edición.

6. Dimension Authority Matrix
Identity
Editable por:
Owner
Authorized Admin
Ejemplos:
* nombre;
* descripción corporativa;
* jurisdicción;
* identidad legal.

Business
Editable por:
Owner
Authorized Admin

Brand
Editable por:
Owner
Brand Admin

Agent Soul
⚠️ Especial.
No debería editarse como Knowledge normal.
El Soul controla comportamiento.
Por tanto:
Soul Change
    ↓
Governance Review
    ↓
Version
    ↓
Activation
Nunca:
LLM → modify Soul → immediate active

Projects
Tenant-owned.
Hermes puede descubrir.
Owner aprueba.

Products
Especialmente protegido.
Precios, características y condiciones comerciales deberán tener:
source
authority
effectiveAt
status
version

Market
Puede contener:
* mercados objetivo;
* segmentos;
* hipótesis;
* posicionamiento.
Pero debemos distinguir:
FACT
vs
HYPOTHESIS

Operations
Ejemplos:
* horarios;
* procesos;
* handoff;
* contacto;
* SLA.

Governance
🚨 Highest Protection.
Hermes no puede activar Governance directamente.
Puede descubrir:
"El owner dijo que cualquier descuento requiere aprobación."
Pero eso genera:
DISCOVERED
y requiere aprobación humana.

Public
Es conocimiento que potencialmente puede exponerse externamente.
Pero:
PUBLIC ≠ AUTOMATICALLY PUBLISHED
Debe existir una transición explícita:
INTERNAL
   ↓
PUBLIC_REVIEW
   ↓
PUBLIC_ACTIVE

7. Status Lifecycle
Congelamos:
DISCOVERED
   │
   ├──→ REJECTED
   │
   └──→ APPROVED
           │
           ▼
         ACTIVE
           │
           ▼
       SUPERSEDED
Opcionalmente:
ACTIVE
  ↓
SUSPENDED
para información temporalmente deshabilitada.
Regla crítica
Nunca:
SUPERSEDED → ACTIVE
directamente.
Debe crearse una nueva versión.

8. Versioning
Cada mutación genera:
version N
Ejemplo:
Product: Founder Certificate

v1
$50 USDC

v2
$75 USDC

v3
$100 USDC
Hermes solamente utiliza:
v3 ACTIVE
Las anteriores permanecen auditables.

9. Source Provenance
Cada conocimiento debe poder responder:
¿De dónde salió esto?
Sources iniciales:
ONBOARDING
OWNER_INPUT
ADMIN_INPUT
DOCUMENT
IMPORTED
HERMES_DISCOVERY
SYSTEM
INTEGRATION
Ejemplo:
Source:
HERMES_DISCOVERY

Evidence:
Conversation #abc123

Actor:
Oscar

Timestamp:
2026-08-13

10. Evidence
Knowledge sensible deberá poder contener evidencia.
Ejemplo:
{
  source: "DOCUMENT",
  evidence: {
    documentId,
    page,
    section
  }
}
o:
{
  source: "OWNER_INPUT",
  evidence: {
    conversationId,
    messageId
  }
}
Esto permitirá posteriormente construir un verdadero Evidence Ledger.

11. Authority
Authority no debe confundirse con Visibility.
Ejemplo:
authority: CANONICAL
visibility: INTERNAL
significa:
Es información oficial, pero no debe comunicarse públicamente.
Mientras:
authority: DISCOVERED
visibility: PUBLIC
significa:
Hermes descubrió algo que potencialmente podría ser público, pero aún no tiene autoridad suficiente.

12. Visibility
Valores:
PUBLIC
INTERNAL
RESTRICTED
PRIVATE
La Console deberá mostrar claramente:
Who can Hermes use this knowledge with?

13. Knowledge Approval
Cuando el owner presione:
Approve
no será un simple:
UPDATE status = ACTIVE
Debe ejecutarse un Governance Command.
Ejemplo:
approveKnowledge({
  knowledgeId,
  controlPlaneContext
})
El backend validará:
Tenant
+
Permission
+
Current State
+
Version
+
Dimension Policy
+
Actor Authority

14. Rejection
Rechazar no significa borrar.
DISCOVERED
    ↓
REJECTED
La evidencia permanece.
Esto permite responder:
"¿Por qué Hermes dejó de usar esta información?"

15. Editing
Editar un Knowledge Item activo no modifica la versión existente.
Siempre:
ACTIVE v2
   ↓
Edit
   ↓
NEW v3 DISCOVERED
   ↓
Review
   ↓
ACTIVE v3
Esto es fundamental para auditoría.

16. Superseding
Cuando se aprueba una nueva versión:
v2 ACTIVE
v3 DISCOVERED
       ↓
APPROVE
       ↓
v2 SUPERSEDED
v3 ACTIVE
La transición debe ser atómica.

17. Audit Contract
Cada mutación producirá:
KnowledgeMutationEvent
Ejemplo:
{
  eventType: "KNOWLEDGE_APPROVED",

  organizationId,

  knowledgeId,

  dimension,

  previousStatus,

  newStatus,

  previousVersion,

  newVersion,

  actorId,

  source,

  timestamp,

  correlationId
}
El audit trail será:
append-only
No editable desde la Console.

18. UI Architecture
La Console principal:
┌───────────────────────────────────────────────┐
│ KNOWLEDGE GOVERNANCE                          │
│                                               │
│ Tenant: S'Narai                               │
│                                               │
│ [10 Dimensions] [Pending Review] [Audit]     │
└───────────────────────────────────────────────┘

Dashboard
Mostrar:
Knowledge Items       47
Active                31
Discovered             8
Pending Review         5
Superseded             3
Rejected               5

19. Dimension View
Ejemplo:
PRODUCTS

┌────────────────────────────────────────────┐
│ Founder Certificate                        │
│                                            │
│ Version: 3                                 │
│ Status: ACTIVE                             │
│ Authority: CANONICAL                       │
│ Visibility: PUBLIC                         │
│ Source: OWNER_INPUT                        │
│                                            │
│ [View] [Edit] [History]                    │
└────────────────────────────────────────────┘

20. Discovery Queue
Una de las partes más importantes:
┌──────────────────────────────────────────────┐
│ HERMES DISCOVERED                            │
├──────────────────────────────────────────────┤
│ "La empresa fue fundada en 2018."            │
│                                              │
│ Source: Onboarding                            │
│ Actor: Oscar                                 │
│ Dimension: Identity                          │
│ Confidence: High                             │
│                                              │
│ [APPROVE] [EDIT] [REJECT] [VIEW EVIDENCE]   │
└──────────────────────────────────────────────┘
Esto convierte el onboarding de Hermes en un proceso gobernado.

21. Governance Dimension Special UI
Para Governance:
⚠️ GOVERNANCE KNOWLEDGE

Hermes discovered:

"Discounts above 10% require owner approval."

Status:
DISCOVERED

This rule will NOT affect execution
until explicitly approved.
Botones:
[Approve Rule]
[Reject]
[View Evidence]

22. Public Knowledge Protection
Si el owner quiere convertir algo en público:
INTERNAL
   ↓
Request Public
   ↓
PUBLIC_REVIEW
   ↓
Owner Approval
   ↓
PUBLIC_ACTIVE
Esto evita que Hermes accidentalmente publique información interna.

23. Soul Governance
La Console deberá tratar Soul como una sección especial:
AGENT SOUL
Mostrará:
Personality
Tone
Behavioral Rules
Communication Style
Forbidden Behaviors
Escalation Style
Pero cambios importantes deberán pasar por:
Soul Change Request
y no por una edición silenciosa.

24. Proactive Engine Integration
Aquí se cierra el círculo con Phase 6.7.
El Proactive Engine podrá utilizar solamente:
ACTIVE Knowledge
+
ACTIVE Policies
+
AUTHORIZED Contact Memory
Por ejemplo:
HESITANT_BUYER
       ↓
Knowledge Governance
       ↓
Product v3 ACTIVE
       ↓
Proactive Engine
       ↓
Message
Si el precio está:
DISCOVERED
Hermes no puede mencionarlo.

25. Knowledge → Cognitive Runtime Contract
El Runtime nunca deberá consultar directamente la UI o la base de datos de forma arbitraria.
Pipeline:
Knowledge Repository
        ↓
Scope Validator
        ↓
Knowledge Snapshot
        ↓
ConversationContext
        ↓
PromptCompiler
        ↓
LLM
La Console únicamente gobierna el estado de esos objetos.

26. Zero S'Narai Contamination
Invariant:
organizationId != snarai
debe garantizar:
S'Narai Knowledge NEVER enters Oscar Context
excepto conocimiento explícitamente clasificado como:
GLOBAL
y aprobado para consumo global.

27. Global vs Tenant Knowledge
Esta Console también deberá distinguir:
Global Hermes Knowledge
Conocimiento propio de Pandora's/Hermes.
Ejemplos:
* cómo funciona Hermes;
* capacidades del producto;
* reglas globales de plataforma;
* instrucciones operativas del sistema.
Tenant Knowledge
Ejemplo:
S'Narai
Oscar
Tenant #003
...
Nunca mezclar ambos namespaces.
GLOBAL
   ≠
TENANT

28. Permissions
Roles iniciales:
OWNER
ADMIN
OPERATOR
VIEWER
Matriz:
Acción	Owner	Admin	Operator	Viewer
View	✅	✅	✅	✅
Discover review	✅	✅	✅	❌
Edit	✅	✅	❌	❌
Approve	✅	✅	❌	❌
Governance approve	✅	⚠️	❌	❌
Public approve	✅	⚠️	❌	❌
View audit	✅	✅	⚠️	❌
⚠️ dependerá de permisos explícitos.

29. API / Commands
No construiría un CRUD genérico.
Usaría Commands explícitos:
knowledge.discover
knowledge.edit
knowledge.approve
knowledge.reject
knowledge.supersede
knowledge.suspend
knowledge.request_publication
knowledge.approve_publication
Cada Command:
ControlPlaneContext
+
Tenant Scope
+
Permission
+
State Transition
+
Audit Event

30. Forbidden Operations
La Console no permitirá:
DELETE ACTIVE KNOWLEDGE
ni:
UPDATE ACTIVE IN PLACE
ni:
CHANGE ORGANIZATION ID
ni:
PROMOTE DISCOVERED → ACTIVE
sin Governance.
Ni:
DISCOVERED → PUBLIC_ACTIVE
directamente.

31. API Security
Toda mutación deberá verificar:
Authentication
↓
ControlPlaneContext
↓
Organization Authorization
↓
Permission
↓
Knowledge Ownership
↓
State Transition
↓
Mutation
↓
Audit
Nunca:
request.organizationId
        ↓
UPDATE

32. Certification Matrix
Antes de cerrar Phase 6.8:
G1 — Tenant Isolation
Oscar no puede ver S'Narai.
G2 — Cross-Tenant Mutation
Oscar no puede aprobar Knowledge de S'Narai.
G3 — Version Integrity
ACTIVE no se modifica directamente.
G4 — State Machine
No existen transiciones inválidas.
G5 — Governance Isolation
Hermes no puede activar Governance.
G6 — Public Visibility
INTERNAL no puede aparecer en contexto público.
G7 — Evidence
Todo Knowledge aprobado tiene provenance.
G8 — Audit
Toda mutación produce evento inmutable.
G9 — Proactive Integration
Proactive Engine no consume DISCOVERED.
G10 — Cognitive Isolation
Oscar Runtime no recibe S'Narai Knowledge.
G11 — Permission Boundary
VIEWER no puede aprobar.
G12 — Concurrent Approval
Dos approvals concurrentes no pueden producir dos versiones ACTIVE.

33. Phase 6.8 Definition of Done
La fase únicamente podrá declararse:
HERMES_KNOWLEDGE_GOVERNANCE_LIVE
cuando:
* Knowledge Console funcional.
* 10 dimensiones visibles.
* Discovery Queue funcional.
* Approval Commands implementados.
* Rejection Commands implementados.
* Versioning implementado.
* Supersession implementado.
* Evidence provenance implementada.
* Audit Trail implementado.
* Governance special handling implementado.
* Public Knowledge workflow implementado.
* Soul governance implementado.
* Tenant isolation certificado.
* Proactive integration certificado.
* 12 pruebas G1–G12 verdes.

34. Architectural Invariants — LOCKED
Estos son los candados que considero que debemos congelar formalmente:
C6.1 — Tenant Authority
organizationId proviene exclusivamente de ControlPlaneContext.
C6.2 — Authorization
Toda mutación requiere autorización explícita.
C6.3 — Dimension-Level Writes
Toda mutación pertenece a una dimensión.
C6.4 — Lifecycle Integrity
Knowledge posee una máquina de estados válida.
C6.5 — Version Integrity
Las versiones son inmutables.
C6.6 — Audit Integrity
Toda mutación genera Audit Event.
C6.7 — Governance Isolation
Governance no puede ser activado por descubrimiento cognitivo.
C6.8 — Human Confirmation
Knowledge crítico requiere aprobación humana.
C6.9 — Scope Integrity
Knowledge solo entra al Context si pasa ScopeValidator.
C6.10 — Zero S'Narai Fallback
Ningún Tenant externo recibe conocimiento de S'Narai por fallback.
C6.11 — Discovery ≠ Authority
DISCOVERED jamás equivale a ACTIVE.
C6.12 — Public ≠ Active
La visibilidad pública requiere autorización independiente.
C6.13 — Proactivity ≠ Authority
El Proactive Engine jamás puede saltarse Governance.
C6.14 — Global ≠ Tenant
El namespace global y los namespaces Tenant permanecen separados.
C6.15 — Audit ≠ Editable Data
El Audit Trail es append-only.

35. The Strategic Result
Con Phase 6.8 terminada, la arquitectura alcanza algo bastante más importante que una interfaz administrativa:
                 HERMES
                   │
        ┌──────────┴──────────┐
        │                     │
    DISCOVERY             REASONING
        │                     │
        ▼                     ▼
   Knowledge             Cognitive Runtime
        │                     │
        └──────────┬──────────┘
                   ▼
             GOVERNANCE
                   │
          ┌────────┴────────┐
          ▼                 ▼
       APPROVE            REJECT
          │
          ▼
        ACTIVE
          │
          ▼
   Cognitive / Proactive
      Consumption
Y eso crea una propiedad fundamental de Pandora's:
Hermes puede aprender sin adquirir autoridad automáticamente.
Ese es el mecanismo que permite que podamos pasar de S'Narai → Óscar → Tenant #100 → Tenant #10,000 sin convertir el sistema en una colección de agentes con conocimiento incontrolable.
🧙🏾‍♂️: Siguiente paso: congelaría este documento como contrato arquitectónico de Phase 6.8 y haría que el equipo no toque la UI primero; primero debe implementar State Machine + Governance Commands + Audit + Scope Validator, y después construir la Console encima de esas primitivas. Así la interfaz nunca se convierte en la autoridad real del sistema.
