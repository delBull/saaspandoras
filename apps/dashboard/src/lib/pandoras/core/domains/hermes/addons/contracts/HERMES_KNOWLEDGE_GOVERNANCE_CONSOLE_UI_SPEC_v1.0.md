# HERMES KNOWLEDGE GOVERNANCE CONSOLE UI
**Phase 6.8.2 — Formal UI Architecture Contract v1.0**
*Status: Proposed / UI Contract*
*Phase: 6.8.2*
*Depends on: Phase 6.8.1 (Governance Backend Primitives)*

## 1. Core UI Principle
La Knowledge Governance Console es una interfaz de visualización y emisión de comandos. **La UI no inventa estados ni asume autoridad**. Toda mutación (aprobar, rechazar, instalar) pasa por los *Governance Commands* respaldados por el `ControlPlaneContext`.

`UI → Server Action → KnowledgeGovernanceService → State Machine → Audit`

## 2. Los 5 Módulos de la Console

### Módulo 1: 🧠 Knowledge Studio
Visualiza las 10 dimensiones y el inventario de conocimiento.
- **Vistas:** Items `DISCOVERED`, `PENDING_REVIEW`, `ACTIVE`, `REJECTED`, `SUPERSEDED`.
- **Datos expuestos:** Contenido, Autoridad, Visibilidad, Versión, Origen, Fecha, Autorizador.
- **Acciones:**
  - `DISCOVERED / PENDING_REVIEW` → Approve o Reject.
  - `ACTIVE v1` → Edit → genera `PENDING_REVIEW v2`. **Prohibido editar `ACTIVE` in-place.**

### Módulo 2: 🧩 Add-On Marketplace
Integración visual del ciclo de vida de los Add-Ons (Ej. *VIP Family Concierge*, *Proactive Closer*).
- **Vistas:** Tarjetas con status (`AVAILABLE`, `INSTALLING`, `CONFIGURING`, `PENDING_APPROVAL`, `ACTIVE`), Capabilities, y Gobernanza requerida.
- **Regla de oro:** `Install ≠ Active`. El botón *Approve* invoca el *Installation Command* del backend.

### Módulo 3: ⚖️ Governance & Policies
Centro de control de límites.
- Muestra de forma inconfundible qué reglas son configurables por el Tenant y cuáles son reglas **inmutables** del sistema.
- Gestión de canales autorizados, horas de descanso (Quiet Hours), límites proactivos, y requisitos de autorización humana.

### Módulo 4: 🧬 Effective Cognitive Context (con Exclusion Register)
Visualización depurable de lo que Hermes "ve" realmente en tiempo de ejecución para un contacto/contexto dado.
- **Effective Context:** Qué Identidad, Alma, Conocimiento, Memoria y Add-Ons están inyectados.
- **Exclusion Register:** Lista explícita de lo que Hermes **tiene prohibido usar**, indicando la razón (ej. `SUPERSEDED`, `WRONG TENANT`, `RESTRICTED`). 

### Módulo 5: 🔎 Governance Audit
Timeline histórico (append-only) de las mutaciones.
- Muestra el Actor, Dimensión, Acción, Estatus Anterior/Nuevo, Versión y Fecha.
- Esencial para trazabilidad empresarial y reconstrucción histórica.

## 3. Arquitectura Multi-Tenant (Zero Forks)
Una sola Console. Múltiples Tenants.
`Knowledge Governance Console → tenantId → Organization Control Plane → same UI`
La UI utilizará el `tenantId` (pasado por URL) y lo inyectará en el `ControlPlaneContext` para que el backend valide el acceso. No habrá código UI específico para "S'Narai" o "Óscar".

## 4. Certificación KGC (Knowledge Governance Console)
Antes de declarar la fase 6.8.2 terminada, se deben certificar los siguientes comportamientos:

- `KGC-01` Tenant isolation garantizado en la UI.
- `KGC-02` Un usuario Viewer no puede ver botones de mutación habilitados.
- `KGC-03` La UI no puede bypassear un comando (si falla el server action, la UI debe reflejar el error).
- `KGC-04` Items ACTIVE no pueden ser editados in-place desde la UI.
- `KGC-05` Una aprobación en UI crea un evento de auditoría visible en Módulo 5.
- `KGC-06` Un rechazo en UI crea un evento de auditoría visible.
- `KGC-07` Al aprobar una edición, la versión previa se muestra como SUPERSEDED.
- `KGC-08` Ítems de otro Tenant son invisibles en Módulo 1.
- `KGC-09` Logs de otro Tenant son invisibles en Módulo 5.
- `KGC-10` La dimensión Governance requiere flujos de aprobación humana visualizados.
- `KGC-11` La aprobación de un Add-On usa el comando gobernado de instalación.
- `KGC-12` Effective Context solo refleja conocimiento ACTIVE y autorizado.
- `KGC-13` Exclusion Register reconstruye y lista los filtrados correctamente.
- `KGC-14` Forzar un `tenantId` en la URL no puede sobrescribir las validaciones del `ControlPlaneContext` en backend.
