# AGENTS.md - Pandoras Growth OS & Hermes Core

## Contexto del Proyecto

Pandoras Growth OS Backend, Dashboard, Hermes Operating System y APIs de integración multitenant.

---

## Directivas de Arquitectura y Stacked PRs (`gh-stack`)

Para cualquier desarrollo de features complejas, migraciones o tareas multicapa:
- **Regla:** Utilizar el flujo de **GitHub Stacked Pull Requests (`gh-stack`)** para mantener cambios desacoplados, atómicos y fácilmente revisables.
- **Estructura recomendada por capas:**
  1. `feat/<feature>-l1-db`: Esquema de Drizzle / migraciones Neon.
  2. `feat/<feature>-l2-domain`: Entidades de dominio, K25 Knowledge Vault, reglas de Lattice.
  3. `feat/<feature>-l3-api`: Rutas de Next.js API, webhooks y stream handlers.
  4. `feat/<feature>-l4-ui`: Componentes React / Hermes Portal UI.

### Comandos de Operación:
- `gh stack init`: Inicializa la secuencia.
- `gh stack add <branch>`: Añade una nueva capa sobre la rama actual.
- `gh stack submit`: Publica y enlaza los PRs en GitHub.
- `gh stack sync`: Sincroniza y rebasea automáticamente tras el merge de ramas base.
