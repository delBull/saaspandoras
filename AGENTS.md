# AGENTS.md — Pandoras Growth OS & Hermes Core

> **ESTRUCTURA DE DIRECTIVAS:**
> - **`AGENTS.md`** define cómo razonar y diseñar.
> - **`.agents/rules/DIRECTIVAS_PERMANENTES_PRODUCCION.md`** define las restricciones operativas de ejecución.
> - **`.agents/rules/FROZEN_CONTRACTS.md`** actúa como el registro constitucional inmutable de la arquitectura.

## 0. PROPÓSITO

Este repositorio contiene infraestructura real de Pandora's:

* Multi-Tenant Agent OS
* Hermes Operating System
* Growth OS
* APIs y runtimes multitenant
* Integraciones omnichannel
* Payment Core
* Governance / approvals
* Knowledge / intelligence systems
* Dashboard / Portal / Nexus

El sistema opera con usuarios, tenants y datos reales.

El objetivo del agente NO es simplemente producir código que compile.

El objetivo es producir cambios:

1. arquitectónicamente correctos,
2. compatibles con los contratos existentes,
3. seguros bajo un modelo adversarial,
4. conectados al runtime real,
5. verificables,
6. reversibles cuando sea razonable,
7. honestamente reportados.

---

# 1. PRINCIPIO FUNDAMENTAL

Antes de modificar código:

> **Understand → Locate Authority → Identify Contracts → Map Blast Radius → Reuse Existing Mechanisms → Design Minimal Change → Adversarial Review → Execute → Verify → Report**

Nunca invertir este orden deliberadamente salvo que el usuario lo autorice.

El agente debe pensar primero en:

* autoridad,
* identidad,
* tenant isolation,
* capability,
* policy,
* resource scope,
* contratos congelados,
* datos reales,
* seguridad,
* compatibilidad,
* integración,
* observabilidad,
* reversibilidad.

La solución técnicamente más elegante NO es necesariamente la solución correcta.

La prioridad es preservar las invariantes del sistema.

---

# 2. MODELO MENTAL CANÓNICO

Toda operación sensible debe poder explicarse mediante:

> **Identity → Context → Capability → Policy → Resource Scope → Execution**

Y para Hermes:

> **Hermes proposes. Governance authorizes/disposes. Operations execute.**

Consecuencias:

* Hermes no es la autoridad final.
* El LLM nunca es una frontera de autorización.
* Un prompt nunca concede permisos.
* Una UI nunca concede permisos.
* Un slug nunca es autoridad.
* Un `tenantId` enviado por frontend nunca es autoridad.
* Un wallet nunca es automáticamente identidad canónica.
* Una sesión autenticada no implica capability suficiente.
* Una capability no implica acceso a cualquier recurso.
* Un recurso autorizado debe estar dentro del `ResourceScope` correspondiente.
* La ejecución debe ocurrir únicamente después de los gates deterministas correspondientes.

Flujo conceptual:

```text
Authenticated Identity
        ↓
Canonical Identity
        ↓
Canonical Organization / Tenant
        ↓
Membership / Relationship
        ↓
Capability
        ↓
Policy
        ↓
Resource Scope
        ↓
Authorized Context
        ↓
Proposal / Intelligence
        ↓
Governance / Explicit Confirmation
        ↓
Execution
        ↓
Audit / Outcome
```

Si una implementación salta una capa, el agente debe señalarlo antes de ejecutarla.

---

# 3. REGLA DE CONTRATOS CONGELADOS

Existen contratos arquitectónicos que deben tratarse como interfaces constitucionales.

Un contrato congelado NO debe modificarse para facilitar una implementación local.

Antes de modificar una pieza crítica, el agente debe determinar:

1. ¿Está dentro de un contrato congelado?
2. ¿Quién depende de él?
3. ¿Existe una extensión compatible?
4. ¿Puede resolverse mediante adapter / provider / resolver?
5. ¿El cambio altera semántica o solamente implementación interna?

### Contratos que requieren especial protección

Como mínimo:

* Canonical Identity
* `canonicalOrgId`
* `ControlPlaneContext`
* Tenant Context
* Capability model
* Policy gates
* Resource Scope
* Authentication / session authority
* Governance / approval contracts
* Signer requirements
* Hermes proposal → governance → execution flow
* PaymentIntent / settlement contracts
* Vertical payment adapters
* Omnichannel normalization contracts
* Authorized message/context contracts
* `projects.tenantRuntimeConfig`
* Sovereign Display Engine presentation boundary
* Simulation vs Real data providers
* IPFS ownership/privacy contracts
* Audit / hash-chain contracts

Si el agente encuentra referencias históricas a contratos anteriores:

> **No recrear automáticamente el contrato antiguo.**

Primero determinar si es:

* activo,
* legacy,
* dead code,
* scratch,
* documentación histórica,
* migración antigua.

---

# 4. REGLA DE FUENTE DE VERDAD

Para cada dominio, identificar primero cuál es la fuente de verdad.

Ejemplos:

```text
Tenant identity
→ canonicalOrgId / ControlPlaneContext

Hermes runtime configuration
→ projects.tenantRuntimeConfig

Production truth
→ real database / real provider

Payment authority
→ PaymentIntent + server-side context

Authorization
→ capability + policy + resource scope

Display preferences
→ presentation layer only
```

Nunca crear una segunda fuente de verdad para resolver un problema local.

Antes de crear:

* nueva tabla,
* nuevo servicio,
* nuevo resolver,
* nuevo context,
* nuevo config store,
* nuevo permission check,

preguntar:

> **¿Ya existe un mecanismo canónico para esto?**

Si existe, reutilizarlo o extenderlo.

---

# 5. REGLA DE AUTORIDAD

Distinguir siempre:

### Identity

¿Quién es?

### Context

¿En qué organización/proyecto/superficie/recurso está operando?

### Capability

¿Qué puede hacer?

### Policy

¿Está permitido hacerlo ahora?

### Resource Scope

¿Sobre qué recursos concretos puede hacerlo?

### Execution Authority

¿Quién o qué puede finalmente ejecutar?

Nunca sustituir uno por otro.

Ejemplo prohibido:

```text
role === OWNER
→ puede ejecutar cualquier operación
```

La evaluación correcta debe considerar el contexto y la operación concreta.

---

# 6. REGLA DE CLIENTE NO CONFIABLE

Todo input proveniente del cliente es una propuesta, nunca autoridad.

Esto incluye:

* `tenantId`
* `organizationId`
* `canonicalOrgId`
* slug
* projectId
* resourceId
* wallet address
* destination wallet
* role
* capability
* targetRole
* channel
* surface
* payment amount
* payment destination
* vertical
* product
* approval state
* governance state

El servidor debe resolver los valores autoritativos.

El frontend puede expresar:

> "quiero operar sobre X"

pero el backend debe determinar:

> "¿X pertenece al scope autorizado de esta identidad?"

---

# 7. HERMES

Hermes es una capa de propuesta, inteligencia, coordinación y operación gobernada.

No debe convertirse accidentalmente en:

* authorization engine implícito,
* tenant resolver paralelo,
* identity provider paralelo,
* source of truth paralelo,
* payment ledger paralelo,
* execution bypass,
* memory authority global.

## Regla de LLM

Nunca:

```text
LLM → execute
```

Debe ser:

```text
LLM
→ Structured Proposal
→ Schema Validation
→ Action Allowlist
→ Capability Check
→ Policy Check
→ Resource Scope Check
→ Prerequisite Check
→ Governance / Explicit Confirmation
→ Execution
→ Audit
```

Si una acción no necesita autorización humana por diseño, debe existir una política determinista explícita que lo permita.

---

# 8. CONTEXTO HERMES

Separar estrictamente:

```text
Identity
Context
Surface
Channel
Conversation
Memory
Resource Scope
```

Ejemplo:

```text
channel = TELEGRAM
surface = NEXUS
```

no significa:

```text
channel = surface
```

Ni tampoco:

```text
channel = authority
```

El contexto enviado por frontend debe validarse nuevamente en backend.

---

# 9. MEMORIA

Las conversaciones y la memoria canónica son conceptos diferentes.

```text
Conversation
= historial específico de canal/contexto

Canonical Memory
= conocimiento autorizado que puede sobrevivir entre canales
```

La memoria canónica debe ser:

* tenant-scoped,
* identity-scoped,
* provenance-aware,
* auditable,
* revocable,
* expirable cuando corresponda,
* susceptible de supersession/conflict resolution.

Nunca:

```text
LLM → INSERT memory
```

Usar:

```text
Conversation
→ Memory Candidate
→ Schema Validation
→ Memory Policy
→ Provenance
→ Deduplication
→ Conflict Check
→ Persist
```

Nunca asumir memoria cross-tenant.

Regla:

> **Hermes puede recordar entre canales, pero nunca fuera del scope autorizado de identidad, organización y recurso actual.**

---

# 10. PAYMENT CORE

Payment Core es infraestructura transversal, pero no debe absorber la semántica de cada vertical.

Separar:

```text
Payment Core
    ↓
Settlement
    ↓
Vertical Adapter
    ↓
Vertical Domain Mutation
```

No permitir:

```text
Hermes Payment Core
→ mutate arbitrary Growth/RWA state
```

Los destinos deben resolverse server-side según el contexto:

```text
PrivatePaymentContext
→ wallet privada del usuario

PlatformBillingContext
→ treasury de Pandora's

TenantCommerceContext
→ treasury del tenant
```

Nunca reutilizar `PrivatePaymentContext` como shortcut para comercio de tenants.

Los metadatos como:

```text
tenantId
vertical
product
```

sirven para correlación, no para autorizar.

---

# 11. PRODUCCIÓN REAL

Nunca fabricar:

* CIDs
* hashes
* transaction IDs
* payment settlements
* balances
* metrics
* percentages
* identities
* wallet addresses
* API responses
* provider states

Si una fuente real no está disponible:

```text
UNKNOWN
UNAVAILABLE
NOT_CONFIGURED
PARTIAL
```

según corresponda.

Nunca:

```text
DB failure → []
API failure → fake success
provider failure → default value
missing config → invented config
```

---

# 12. SIMULACIÓN

Simulation Mode y Production Mode deben ser arquitecturas explícitamente separadas.

```text
SimulationDataProvider
RealDataProvider
```

No distribuir:

```text
if (simulation) ...
```

por todo el sistema.

La transición a producción debe ser:

* server-authoritative,
* capability-gated,
* auditable,
* explícita,
* preferentemente irreversible en V1.

Nunca usar datos simulados silenciosamente en producción.

---

# 13. BLAST RADIUS

No utilizar únicamente el número de archivos como criterio.

Evaluar:

### Blast Radius Semántico

* ¿cambia autoridad?
* ¿cambia tenant isolation?
* ¿cambia schema?
* ¿cambia persistencia?
* ¿cambia payment state?
* ¿cambia governance?
* ¿cambia authentication?
* ¿cambia API contract?
* ¿cambia shared types?
* ¿cambia channel routing?
* ¿cambia Hermes context?
* ¿cambia UI solamente?
* ¿afecta datos existentes?

Clasificación:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Si es HIGH o CRITICAL:

> detenerse antes de ejecutar y presentar análisis + propuesta.

---

# 14. IMPACT ANALYSIS OBLIGATORIO

Antes de editar código, presentar:

```text
1. Objective
2. Current source of truth
3. Frozen contracts involved
4. Callers/importers
5. Data impact
6. Security/authority impact
7. Regression surface
8. Existing mechanism to reuse
9. Minimal change proposed
10. What will NOT be changed
```

Si existe ambigüedad material sobre autoridad, datos o contrato:

> **NO EJECUTAR.**

Preguntar.

---

# 15. REGLA DE CAMBIO MÍNIMO

Preferir:

```text
adapter
resolver
provider
extension
migration additive
feature flag
policy gate
```

sobre:

```text
rewrite
duplicate subsystem
new source of truth
parallel authorization system
new identity model
new configuration store
```

La solución debe cambiar la menor cantidad posible de invariantes.

---

# 16. ADVERSARIAL THINKING

Antes de declarar una implementación correcta, intentar romperla.

Como mínimo preguntar:

### Identity

¿Puede Tenant A acceder a Tenant B?

### Authorization

¿Puede alguien con UI escondida llamar directamente al endpoint?

### Resource scope

¿Puede cambiar projectId/resourceId manualmente?

### Client authority

¿Qué ocurre si manipulo todos los IDs enviados por frontend?

### Replay

¿Puede reutilizarse una solicitud, approval o webhook?

### Race

¿Qué pasa si dos operaciones ocurren simultáneamente?

### Failure

¿Qué ocurre si DB/provider/IPFS falla?

### Missing configuration

¿El sistema inventa un valor o devuelve estado honesto?

### Legacy

¿Estoy reviviendo un contrato antiguo?

### Orphan

¿La nueva capacidad realmente tiene caller en producción?

### Audit

¿Existe evidencia verificable de la afirmación?

---

# 17. DATA INTEGRITY

Distinguir:

```text
absence
unknown
unavailable
zero
empty
not configured
not applicable
```

Nunca convertir automáticamente:

```text
DB error → 0
query failure → []
provider unavailable → false
missing config → default
```

Esto es especialmente obligatorio para:

* metrics,
* health,
* governance,
* payments,
* identity,
* cognitive state,
* manifests,
* activity,
* analytics.

---

# 18. ERROR HANDLING

Cada `catch` debe responder:

> ¿Estoy manejando el error o escondiéndolo?

Permitido:

```text
throw
return explicit failure
return UNKNOWN/UNAVAILABLE
controlled retry
explicit degradation
```

Prohibido:

```text
catch → console.warn → continue
```

cuando el error compromete:

* persistencia,
* seguridad,
* autorización,
* payment state,
* identity,
* tenant isolation,
* auditability.

---

# 19. SEGURIDAD

Por defecto:

* input validation,
* server-side authorization,
* tenant isolation,
* capability checks,
* policy checks,
* resource scope,
* rate limiting,
* idempotency donde corresponda,
* replay protection,
* audit logging,
* least privilege,
* secret isolation,
* fail-closed cuando la garantía dependa del componente ausente.

Los secretos nunca:

* se hardcodean,
* se imprimen,
* se devuelven al cliente,
* se almacenan en logs,
* se usan como identidad.

---

# 20. IDEMPOTENCIA ≠ RATE LIMITING ≠ DEDUPLICATION

No confundir:

```text
Rate limit
= frecuencia de requests

Idempotency
= misma operación lógica

Deduplication
= evitar procesar repetidamente un evento/notificación
```

Cada uno necesita su propia garantía.

---

# 21. DATABASE / MIGRATIONS

Todo cambio de schema:

```text
Drizzle schema
→ drizzle-kit generate
→ inspect SQL
→ apply
→ verify actual DB
→ verify application
```

Nunca editar una migration aplicada.

Nunca asumir que una columna existe porque TypeScript compila.

Verificar:

```text
information_schema
```

o herramienta equivalente.

---

# 22. PERFORMANCE

Optimizar después de preservar corrección.

Revisar:

* N+1
* indexes
* query bounds
* `SELECT *`
* connection pooling
* serverless cold starts
* bundle size
* dynamic imports
* unnecessary dependencies
* cache correctness

Nunca introducir cache si puede romper:

* tenant isolation,
* authorization,
* private data,
* payment state,
* governance state.

---

# 23. UI = PRESENTACIÓN

La UI puede:

* presentar,
* solicitar,
* previsualizar,
* mostrar estado.

La UI no puede:

* autorizar,
* asignar capability,
* determinar tenant,
* determinar wallet de destino,
* ejecutar acciones privilegiadas,
* modificar ResourceScope.

Responsive/display changes must not alter:

```text
Identity
Capability
Policy
ResourceScope
Execution
API semantics
```

---

# 24. ORFANDAD

Una clase, servicio o engine no está integrado solamente porque existe.

Antes de decir:

* integrado,
* conectado,
* activo,
* intercepta,
* bloquea,
* valida,

encontrar un caller real en una ruta de producción.

Si solamente existen:

* implementación,
* tests,
* imports muertos,

clasificar:

```text
IMPLEMENTED — NOT WIRED
```

Nunca como funcionalidad activa.

---

# 25. CLASIFICACIÓN OBLIGATORIA

Cada elemento de una entrega debe clasificarse:

```text
✅ IMPLEMENTED + WIRED
🟡 IMPLEMENTED — NOT WIRED
🔵 SPECIFICATION ONLY
⏳ DEPENDENT
❌ BLOCKED
```

Nunca presentar 🟡 como funcional.

---

# 26. TESTS QUE REALMENTE PRUEBAN

Un test debe fallar si la implementación desaparece.

Los tests que afirman:

```text
invokes X
rejects Y
authorizes Z
```

deben verificar realmente el comportamiento.

Cuando corresponda usar:

```text
spy
mock assertion
database assertion
response assertion
state transition assertion
```

Un test que puede pasar aunque se elimine la implementación es inválido.

---

# 27. DEFINICIÓN DE TERMINADO

Una tarea no está terminada porque:

* compila,
* existe el archivo,
* pasa un test,
* la UI muestra algo.

Está terminada cuando:

1. implementación existe,
2. está cableada si se declaró activa,
3. contratos preservados,
4. seguridad verificada,
5. datos verificados,
6. tests ejecutados,
7. `bun x tsc --noEmit` ejecutado,
8. comportamiento funcional verificado cuando corresponde,
9. no existen errores silenciosos,
10. walkthrough contiene evidencia.

---

# 28. NÚMEROS Y EVIDENCIA

Nunca reutilizar números de una corrida anterior.

Siempre indicar:

```text
Command:
Scope:
Timestamp/context:
Result:
```

Ejemplo:

```text
bun x tsc --noEmit
Scope: repository
Result: 0 errors
```

Si no se ejecutó:

```text
NOT VERIFIED
```

Nunca:

```text
should pass
probably works
looks good
```

como sustituto de evidencia.

---

# 29. PRUEBA DEL ESCÉPTICO

Para cada afirmación:

> “¿Qué comando, test, query o evidencia demostraría esto?”

Si no existe:

* no hacer la afirmación,
* o marcarla como inferencia,
* o crear la verificación necesaria.

El agente debe imaginar un auditor hostil que intenta refutar cada claim.

---

# 30. REPORTE DE ENTREGA

Todo walkthrough debe contener:

| Claim | Evidencia | Sello | Estado |
| ----- | --------- | ----- | ------ |

Sellos:

```text
[NUEVO]
[PREEXISTENTE]
[INSPECCIÓN]
```

Nunca presentar funcionalidad preexistente como si hubiera sido creada en el cambio.

---

# 31. DECISION FRAMEWORK

Cuando existan varias soluciones técnicamente posibles, evaluarlas en este orden:

### A. Correctness

¿Preserva invariantes?

### B. Authority

¿Mantiene la fuente de autoridad correcta?

### C. Security

¿Introduce bypass?

### D. Compatibility

¿Rompe contratos existentes?

### E. Data Integrity

¿Puede corromper o reinterpretar datos existentes?

### F. Reversibility

¿Puede revertirse razonablemente?

### G. Complexity

¿Añade infraestructura innecesaria?

### H. Performance

¿Es adecuada para producción?

### I. Maintainability

¿Respeta patrones existentes?

La simplicidad solamente importa DESPUÉS de seguridad y corrección.

---

# 32. NO CREAR INFRAESTRUCTURA PARA RESOLVER UN PROBLEMA LOCAL

Antes de crear un nuevo:

* service,
* table,
* provider,
* context,
* registry,
* config store,
* auth layer,
* permission model,

buscar primero:

```text
existing service
existing resolver
existing adapter
existing provider
existing context
existing schema
existing policy
existing registry
```

Si existe, reutilizar.

---

# 33. REGLA DE LEGACY

Código legacy no debe considerarse automáticamente arquitectura vigente.

Clasificar:

```text
ACTIVE
LEGACY
DEAD
SCRATCH
HISTORICAL
UNKNOWN
```

Nunca revivir un contrato porque un archivo antiguo lo referencia.

---

# 34. REGLA DE DOCUMENTACIÓN

La documentación no demuestra implementación.

Un documento puede demostrar:

```text
SPECIFICATION
```

pero no:

```text
IMPLEMENTED
WIRED
PRODUCTION READY
```

sin evidencia runtime.

---

# 35. REGLA FINAL

El agente debe preferir:

> **menos código, más invariantes preservadas, más evidencia.**

Y debe recordar permanentemente:

> **No estás construyendo una demo. Estás modificando infraestructura institucional en producción.**

Antes de ejecutar:

> **Understand.**

Antes de diseñar:

> **Find the existing mechanism.**

Antes de cambiar:

> **Protect the frozen contracts.**

Antes de autorizar:

> **Resolve identity, capability, policy and resource scope.**

Antes de declarar éxito:

> **Try to break it.**

Antes de reportar:

> **Show the evidence.**
