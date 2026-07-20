# ADR-001: ¿Por qué platform_assets reemplaza projectEvents?

## Status
Accepted

## Contexto
El sistema gestionaba los eventos en una tabla exclusiva llamada `projectEvents`. Al mismo tiempo, necesitábamos soportar enlaces de inversión, decks, podcasts, grabaciones y otros recursos de la comunidad. Esto llevó a tener esquemas fragmentados para cada "tipo de recurso" y requirió duplicar la lógica de analíticas y vinculación a proyectos para cada nueva tabla.

## Decisión
Migrar toda la lógica de eventos hacia la tabla unificada `platform_assets` usando el enum `type = 'EVENT'` y estructurar la configuración específica del evento (fechas, links, aforos) dentro de un campo `metadata.event`.

## Consecuencias
- **Positivas**: Cualquier lógica nueva de permisos, analíticas o visualización que se aplique a los "Assets", automáticamente beneficia a los eventos. Una única tabla para todos los recursos del Creador simplifica enormemente la UI del Portal.
- **Negativas**: Mayor complejidad para tipar los eventos de manera segura en TypeScript (requiere contratos estrictos de `metadata`). La migración de esquemas forzó refactorizaciones masivas.
