# PLAN DE IMPLEMENTACIÓN: COMPLIANCE OPERATIVO (SOC 2 / ISO 27001)
## Plataforma de Auditoría Continua y Evidencia Automatizada (Comp AI / Self-Hosted)

**Estado:** 🔵 ESPECIFICACIÓN / BACKLOG PLANIFICADO  
**Fecha:** 29 de Septiembre, 2026  
**Objetivo:** Establecer un plano de cumplimiento continuo (GRC) de grado institucional para Pandoras Growth OS y Hermes AI, logrando preparación formal para auditoría **SOC 2 (Tipo 1 y 2)** e **ISO/IEC 27001:2022** con costo de software $0 USD mediante el uso de la plataforma open-source [Comp AI (`trycompai/comp`)](https://github.com/trycompai/comp).

---

## 1. Justificación y Análisis de Arquitectura

### 1.1 El Reto de Compliance Tradicional
Plataformas propietarias como Vanta o Drata conllevan costos recurrentes de $15,000 – $35,000 USD anuales únicamente por la licencia de software, más la tarifa independiente del auditor (CPA).

### 1.2 Por qué Comp AI (`trycompai/comp`)
* **Stack Tecnológico Homogéneo:** Next.js (App Router), Bun, Tailwind CSS, Prisma ORM, PostgreSQL, Upstash Redis y Trigger.dev. Es la misma base tecnológica en la que opera el ecosistema de Pandoras.
* **Modelo Operativo:** Auto-alojado (Self-Hosted) bajo licencia AGPLv3 para uso interno exclusivo de la organización (sin redistribución pública SaaS, protegiendo la propiedad intelectual de Pandoras OS).
* **Alcance de Auditoría:** Soporta colecciones automáticas de evidencia, políticas estándar pre-redactadas y monitoreo continuo de controles para:
  - **SOC 2:** Seguridad, Disponibilidad, Confidencialidad e Integridad de Procesamiento (Trust Services Criteria).
  - **ISO 27001:2022:** Anexo A (Controles organizacionales, de personas, físicos y tecnológicos).
  - **GDPR / HIPAA:** Protección de datos personales y cifrado en tránsito/reposo.

---

## 2. Topología de Despliegue Aislada

Para garantizar el principio de mínimo privilegio y aislamiento de fallas, la suite de compliance **NO** se integrará en el monorepo de producción de Pandoras OS, sino como un servicio satélite dedicado:

```text
┌──────────────────────────────────────────────────────────────┐
│                    RED INTERNA / INFRAESTRUCTURA             │
│                                                              │
│  ┌──────────────────────┐             ┌──────────────────┐  │
│  │ Pandoras Monorepo    │             │ Vercel / Neon /  │  │
│  │ (GitHub Org)         │             │ AWS / IPFS       │  │
│  └──────────┬───────────┘             └─────────┬────────┘  │
│             │ (Read-Only Token)                 │ (Read-Only)│
│             ▼                                   ▼            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Comp AI Server (Railway / Container Aislado)          │  │
│  │  - URL: compliance.pandoras.internal                   │  │
│  │  - Base de Datos: PostgreSQL dedicada (Neon/Railway)   │  │
│  │  - Trigger.dev: Tareas de escaneo recurrente           │  │
│  └──────────────────────────┬─────────────────────────────┘  │
│                             │                                │
│                             ▼                                │
│             ┌──────────────────────────────┐                 │
│             │ Firma Auditora Independiente │                 │
│             │ (Acceso de solo lectura CPA) │                 │
│             └──────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Plan de Implementación por Fases

### Fase 1: Infraestructura y Despliegue del Servicio Satélite
* **Objetivo:** Poner en marcha la instancia privada de Comp AI sin fricción ni impacto en producción.
* **Acciones:**
  1. Clonar el repositorio `trycompai/comp` en un repo privado de control de infraestructura (`pandoras-compliance-ops`).
  2. Aprovisionar una base de datos PostgreSQL aislada (ej. nuevo proyecto en Neon o Railway Postgres).
  3. Configurar variables de entorno y auth interno (Google Workspace / GitHub OAuth restringido a dominio corporativo y superadministrador).
  4. Desplegar en Railway / Vercel bajo subdominio protegido (`compliance.pandoras.finance` o acceso tras VPN/Tailscale).

### Fase 2: Conexión de Conectores y Recolección de Evidencia
* **Objetivo:** Automatizar la extracción de evidencia de los servicios que sostienen Pandoras.
* **Integraciones Clave:**
  - **GitHub (`delBull/saaspandoras` y orgs):** Verificación de Branch Protection Rules (`main`/`staging`), 2FA obligatorio en colaboradores, escaneo de secretos (Secret Scanning) y alertas de Dependabot.
  - **Vercel:** Monitoreo de SSL/TLS 1.3 activo en dominios, variables de entorno cifradas y logs de despliegue.
  - **Neon DB:** Evidencia de cifrado en reposo (AES-256), TLS obligatorio en conexiones (`sslmode=require`) y políticas de backup continuo.
  - **Pinata / IPFS (Knowledge Vault):** Verificación de inmutabilidad y pruebas de no-repudio.

### Fase 3: Adopción y Mapeo de Políticas Organizacionales
* **Objetivo:** Adaptar las plantillas estándar a la operativa real de Pandoras.
* **Documentos a formalizar en el portal:**
  - *Information Security Policy (ISP)*.
  - *Access Control & Password Policy* (gestión de llaves criptográficas y accesos administrativos).
  - *Incident Response & Business Continuity Plan* (procedimientos de contingencia y fail-closed).
  - *Vendor Risk Management* (Thirdweb, Vercel, Neon, OpenAI, etc.).
  - *Data Retention & Disposal Policy* (gestión de hash-chains y datos en DB vs. IPFS).

### Fase 4: Ventana de Observación (Audit Readiness)
* **Objetivo:** Lograr una tasa de cumplimiento del 100% en los controles automatizados.
* **Acciones:**
  1. Correr los escaneos automatizados semanales vía Trigger.dev.
  2. Resolver cualquier anomalía técnica (ej. dependencias desactualizadas o falta de MFA en alguna cuenta de infraestructura).
  3. Establecer el "Observation Period" de 3 a 6 meses requerido para **SOC 2 Type 2**.

### Fase 5: Selección y Conexión del Auditor Externo (CPA)
* **Objetivo:** Emisión del reporte oficial.
* **Acciones:**
  1. Invitar al auditor independiente directamente a la plataforma Comp AI con rol de solo lectura (`Auditor Access`).
  2. El auditor valida la evidencia histórica exportada automáticamente sin necesidad de enviar cientos de capturas manuales por email.
  3. Emisión del informe final de certificación (SOC 2 Tipo 1 / 2 e ISO 27001).

---

## 4. Matriz de Controles Esenciales para Pandoras OS

| Dominio de Control | Implementación en Pandoras | Evidencia en Comp AI |
|---|---|---|
| **Control de Acceso (CC6.1)** | Auth basado en firma Web3 (`SUPER_ADMIN_WALLET`) + RBAC estricto | Configuración de roles y sesiones en DB |
| **Integridad de Datos (CC6.6)** | Hash-chains criptográficos y anclaje en IPFS (K25/K26) | Contratos inteligentes y logs de transacciones |
| **Cifrado (CC6.7)** | Tránsito: TLS 1.3 forzado (HSTS). Reposo: AES-256 en Neon | Verificación automática de headers e infraestructura |
| **Seguridad de Código (CC8.1)** | Flujo obligatorio de PRs, Typecheck estricto (`tsc --noEmit`), auditoría de deps | GitHub API Branch Rules & Commit Signatures |
| **Respuesta a Incidentes (CC7.3)** | Canales de alerta inmediatos (Discord Ops, Hermes alerts) | Webhooks configurados y logs de monitoreo |

---

## 5. Checklist para cuando se inicie la implementación
- [ ] Crear repositorio privado `pandoras-compliance-ops`.
- [ ] Configurar proyecto en Railway con Postgres y Redis.
- [ ] Generar GitHub Personal Access Token con alcance de solo lectura de auditoría.
- [ ] Ejecutar el asistente de políticas de Comp AI y adaptar las 24 políticas institucionales.
- [ ] Validar el dashboard de puntuación de controles (Health Score > 95%).
