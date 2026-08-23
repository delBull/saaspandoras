# Stacked Pull Requests Rule (gh-stack)

## Regla de Ejecución para Features Complejas y Multicapa

En este proyecto, para tareas grandes, complejas o multicapa (ej. Base de Datos / Migraciones $\to$ Dominio y Lógica de Negocio $\to$ API Routes y Controladores $\to$ Frontend / UI Components):

1. **Evaluación de Stacked PRs:**
   - Antes de iniciar cambios masivos que superen ~300 líneas de diff o afecten más de 2 capas arquitectónicas, evaluar y estructurar el trabajo usando **GitHub Stacked Pull Requests (`gh-stack`)**.
   - Dividir la solución en ramas atómicas e incrementales:
     - **Capa 1:** Esquema DB, migraciones y contratos de datos (`feat/layer-1-db`).
     - **Capa 2:** Servicios de dominio, repositorios y lógica de negocio (`feat/layer-2-domain`).
     - **Capa 3:** Endpoints API y middlewares (`feat/layer-3-api`).
     - **Capa 4:** Componentes UI y vistas del frontend (`feat/layer-4-ui`).

2. **Comandos Estándar:**
   - Iniciar stack: `gh stack init`
   - Añadir capa sobre la actual: `gh stack add <branch-name>`
   - Publicar el stack enlazado en GitHub: `gh stack submit`
   - Sincronizar tras merges de base: `gh stack sync`
   - Rebasear cascada tras modificaciones: `gh stack rebase`

3. **Criterio de Aplicación:**
   - Usar `gh-stack` proactivamente cuando el usuario solicite features grandes o cuando se requiera mantener la trazabilidad limpia y sin bloqueos de code review.
