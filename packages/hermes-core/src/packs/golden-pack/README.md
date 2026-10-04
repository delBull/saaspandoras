# The Golden Pack

Este paquete es la **plantilla de referencia (Golden Standard)** para cualquier producto, dominio o aplicación que se construya sobre el **Pandora's Execution OS**.

Nadie debería modificar el Kernel. Todos los nuevos desarrollos (S'Narai, Media Co, Hermes, Commercial, etc.) deben crearse copiando la estructura exacta de este Pack.

## Estructura
- `index.ts`: Exporta el Manifest utilizando `definePack()`.
- `workflows/`: Definiciones de procesos de negocio (`defineWorkflow()`).
- `capabilities/`: Contratos de interfaces abstractas (`defineCapability()`).
- `adapters/`: Implementaciones de integraciones o motores (`defineAdapter()`).
- `knowledge/`: Patrones o reglas inyectables para el Knowledge Engine.
- `prompts/`: Plantillas pre-validadas de sistema.
- `assets/`: Archivos estáticos o URLs por defecto.

## Reglas de Arquitectura
1. **No hay registros imperativos**: Un Pack solo declara arrays de objetos. El SO los registra al momento del boot (en `createPandorasApp`).
2. **Sin dependencias del OS vivo**: Un Pack no debe importar la instancia `runtime` ni `director`. Sólo interactúa usando primitivas.
3. **Control de Versiones**: Asegúrate de definir correctamente tu `version` y la versión de compatibilidad `sdkVersion`.
