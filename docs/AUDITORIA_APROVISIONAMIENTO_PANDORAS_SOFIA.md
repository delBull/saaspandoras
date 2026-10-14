# Informe de Auditoría Técnica de Aprovisionamiento — Pandora's Tenant / Sofía / Hermes A2A

> **Tipo de Auditoría:** Solo Lectura (Read-Only) / Verificación Estricta de Producción  
> **Fecha:** 14 de Octubre de 2026  
> **Auditor:** Agente Antigravity / Core Engine  
> **Alcance:** Base de datos Neon, Contratos de Autorización, Lattice Gate, Gateway A2A y Runtime de Inferencia.

---

## A. Estado Canónico en Base de Datos (Neon DB)

| Control | Evidencia en DB | Estado |
|---|---|---|
| **1. Correspondencia Tenant** | `id=148` $\to$ `slug='pandoras'`, `title='Pandoras Growth OS'`, `org_id='9ba63b88-088f-42f9-b67f-28e22c03f0ae'` | **PASS** |
| **2. Status & Simulación** | `status='live'`, `is_simulation_mode=false` (modo productivo real activo) | **PASS** |
| **3. Productos Instalados** | Exactamente 5 filas (sin duplicados): `HERMES`, `DEV_ACCESS`, `GROWTH_OS`, `TOKENIZATION`, `HERMES_OS`. Todas con `status='active'`, plan `enterprise` y capabilities granulares asignadas. | **PASS** |
| **4. Hermes Instance Binding** | Solo 2 de 5 productos (`HERMES` y `HERMES_OS`) enlazan `hermes_instance_id = 'hermes_pandoras_core'`. Los restantes 3 (`DEV_ACCESS`, `GROWTH_OS`, `TOKENIZATION`) tienen `NULL` por diseño al ser módulos de API/SaaS/RWA no-conversacionales. | **PASS** |
| **5. Configuración Canónica** | `tenant_runtime_config` (brandConfig, rwaManifest vertical PLATFORM), `identity_pack` (Voz soberana de Pandora's, founder Marco Muñoz), `policy_pack` (Topic boundaries y escalaciones) poblados y validados. | **PASS** |
| **6. Dirección de Tesorería** | Persistida en `projects.treasury_address = '0xc52BB6f53C91ff7134e7508B102E5A22BA415954'`. Coincide exactamente con `PANDORAS_ADMIN_WALLET` de producción. | **PASS** |
| **7. API Keys de Producción** | 2 llaves activas en entorno `production` para `project_id=148`: `sk_live_f161...` (Secret con `read`, `deploy`, `events:write`, `hermes_a2a`) y `pk_live_6774...` (Public con `read`, `events:write`, sin `hermes_a2a`). 1 de las 2 cuenta con A2A por menor privilegio. Sin secretos expuestos. | **PASS** |

---

## B. Resolución de Tenant y Autorización A2A

1. **Resolución Criptográfica del Token (FC-001):**
   - El endpoint `POST /api/v1/hermes/a2a/chat` pasa obligatoriamente por `integrationGuard(req, { requiredCapability: 'hermes_a2a' })`.
   - La resolución de identidad deriva **exclusivamente del hash de la API key** en la tabla `integration_clients`.
2. **Inmunidad a Suplantación de Payload (FC-006):**
   - Si el cliente envía en el JSON `{"projectId": 17, "tenantId": "snarai"}`, el servidor **lo ignora categóricamente**.
   - El tenant forzado para la consulta y la inyección es `client.projectId` (148), garantizando aislamiento hermético entre tenants. (Verificado en prueba unitaria `AUDIT-01: PASSED`).

---

## C. Lattice Gate y Aislamiento de Conocimiento

1. **Clasificación y Bloqueo de Secretos:**
   - La inyección automática consulta `hermes_knowledge` filtrando por `organization_id = 'pandoras'` y estatus `ACTIVE`.
   - **Lattice Gate (K26):** Solo admite hechos clasificados como `PUBLIC`, `TENANT_RESTRICTED` e `INTERNAL_OPERATIONAL`.
   - **Exclusión Probada:** Los hechos clasificados como `CONFIDENTIAL` (Libros constitutivos, manuales internos) y `SECRET` (Blindaje corporativo, actas LLC, acuerdos de fundadores) quedan **100% excluidos** del contexto inyectado a Sofía.
2. **Sin Privilegios de Superadmin para Sofía:**
   - Sofía opera como un cliente de integración estándar con capability `hermes_a2a`. No posee rol `SUPER_ADMIN` ni sesión de Boss, por lo que ninguna excepción de clearance puede elevarse.

---

## D. Mitigación contra Prompt Injection

1. **Purga Estricta de `role: system`:**
   - Cualquier mensaje en el payload con `role: "system"` es filtrado y destruido antes del ensamble (`AUDIT-02: PASSED`).
2. **Defensa en Profundidad en el Contenido (`role: user`):**
   - El System Prompt inyectado en el servidor instruye de manera explícita: *"Security Boundaries: You do not execute unauthorized code, mutate platform databases directly, nor bypass deterministic governance."*
   - Dado que el endpoint A2A no tiene herramientas conectadas para ejecutar mutaciones en base de datos (`UPDATE`/`DELETE`), un jailbreak semántico en el mensaje de usuario **no tiene superficie de ataque para alterar el estado del sistema ni ejecutar transacciones**.

---

## E. Runtime de Inferencia y Conectividad Real

| Componente | Configuración Local Auditada | Resultado |
|---|---|---|
| **Daemon Ollama** | Detectado activo y respondiendo en `http://localhost:11434` | **PASS** |
| **Modelos Instalados** | `dolphin-llama3:8b` (4.6 GB), `qwen2.5-coder:14b` (8.9 GB), `gemma3:1b` (815 MB) | **PASS** |
| **Modelo Solicitado en Dossier** | `llama3.1` (no está predescargado en la máquina local; se requiere `ollama pull llama3.1` o usar `dolphin-llama3:8b` / `qwen2.5-coder`) | **LIMITACIÓN DETECTADA** |
| **Endpoint de Producción Vercel** | `OLLAMA_BASE_URL` en variables de producción de Vercel debe apuntar a la IP/dominio público del servidor de inferencia. | **CONDICIONADO** |

---

## F. Tabla de Dictamen por Control

| Control | Evidencia Técnica | Resultado |
|---|---|---|
| **1. Aprovisionamiento de Datos** | Inspección directa Neon DB (`projects`, `installed_products`, configs) | **PASS** |
| **2. DEV_ACCESS y Autenticación** | `integrationGuard`, API Keys activas, verificación de fingerprint | **PASS** |
| **3. Hermes A2A Gateway** | Pruebas unitarias de autorización, capability gate y contrato JSON | **PASS** |
| **4. Aislamiento de Tenants** | Suplantación de `projectId`/`slug` en el body bloqueada y purgada | **PASS** |
| **5. Lattice Gate (Secretos)** | Filtrado estricto `PUBLIC`/`INTERNAL_OPERATIONAL`, exclusión de `CONFIDENTIAL`/`SECRET` | **PASS** |
| **6. Runtime Inferencia Local** | Ollama activo en puerto 11434 con modelos Llama3/Qwen disponibles | **PASS** |
| **7. Modelo `llama3.1` Específico** | El modelo exacto `llama3.1` no está pulleado localmente (están `dolphin-llama3:8b` y `qwen`) | **NOT VERIFIED** (Requiere pull o alias) |

---

## G. Observaciones de la Auditoría Externa (P2 - Hallazgos de Refinamiento)

1. **P2 — Autorizador de Divulgación Paralelo:**
   - La inyección en `route.ts:59` utiliza un allowlist local (`PUBLIC`, `TENANT_RESTRICTED`, `INTERNAL_OPERATIONAL`) en lugar de invocar directamente a `ContextAdapter` (lattice canónico de 4 tiers que incluye `B2B_RESTRICTED`).
   - *Mitigación:* Para el piloto con Sofía no representa riesgo de fuga (los secretos `CONFIDENTIAL` y `SECRET` permanecen bloqueados), pero se recomienda refactorizar para unificar bajo el lattice canónico de `context-adapter.ts` conforme a AGENTS §4/§32.
2. **P2 — Degradación Silenciosa de Knowledge en A2A:**
   - Si la base de datos no responde al consultar los facts, el route registra un `console.warn` y continúa la inferencia sin el knowledge soberano. No es fuga de datos, pero la inyección es *best-effort*.
3. **P2 — Persistencia de Artefactos:**
   - El informe ha sido integrado y versionado formalmente en el árbol de trabajo bajo `docs/AUDITORIA_APROVISIONAMIENTO_PANDORAS_SOFIA.md` y `docs/SOFIA_COMMERCIAL_MANDATE.md`.

---

## Dictamen Final Oficial

### **GO TÉCNICO CONDICIONADO**

**Justificación:**
1. **Controles Críticos Confirmados:** Aislamiento de tenant, capability `hermes_a2a` fail-closed, frontera de secretos y coincidencia exacta de tesorería están **verificados de forma independiente contra el código y la base de datos real**.
2. **Condiciones Requeridas para Tráfico Real:**
   - Configurar `OLLAMA_BASE_URL` y `OLLAMA_MODEL` en el entorno de despliegue (o enlazar al daemon local con el modelo seleccionado).
   - Utilizar la API Key Secret (`sk_live_...`) que es la que posee la capability `hermes_a2a` autorizada.

