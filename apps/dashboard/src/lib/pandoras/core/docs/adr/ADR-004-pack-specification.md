# ADR-004: Pack Specification (The Golden Standard)

## Status
**Accepted** - v1.0.0 Freeze

## Context
Con el Kernel del Execution OS estabilizado, necesitamos definir rigurosamente qué es una "Aplicación" dentro del ecosistema de Pandora's. Hasta ahora, hemos usado el término "Pack" vagamente para referirnos a un conjunto de definiciones inyectables. Para escalar y permitir un futuro Marketplace interno, el concepto de "Pack" debe formalizarse como un artefacto instalable, auditable y versionado, separado totalmente de la lógica del Kernel.

## Decision
Adoptamos el modelo de **Pack Manifest**. Un Pack no es simplemente un directorio de código, sino un contrato de distribución.

### 1. ¿Qué es un Pack?
Un Pack es la unidad lógica de empaquetamiento y distribución para cualquier producto o dominio sobre Pandora's OS (ej. `S'Narai`, `Hermes`, `Commercial`). Es un artefacto declarativo que describe intenciones y capacidades.

### 2. Estructura del Manifest
Todo Pack debe definirse a través del SDK oficial usando `definePack`. El Manifest es la fuente única de verdad:

```typescript
export const SNaraiPack = definePack({
  id: "pandoras.snarai",
  version: "1.0.0",
  sdkVersion: "^1.0.0",
  name: "S'Narai Product Hub",
  author: "Pandoras Core Team",
  categories: ["ai", "marketing"],
  
  workflows: [...],
  capabilities: [...],
  adapters: [...],
  knowledge: [...],
  prompts: [...],
  assets: [...]
});
```

### 3. Principio de Declaración Pura (No Ejecución)
**Un Pack nunca registra nada por sí mismo.** El Pack exporta su Manifest. Es responsabilidad exclusiva de la función `createPandorasApp()` (o el instalador del SO) leer este Manifest y registrar los componentes en los respectivos Registries del Kernel. Declarar ≠ Ejecutar.

### 4. Ciclo de Vida del Pack
A nivel conceptual, el OS soporta el siguiente ciclo de vida para los Packs (aunque las fases dinámicas se implementarán en el futuro):
- `Validate`: Comprueba la integridad estructural y semántica del Manifest.
- `Install`: El SDK resuelve dependencias cruzadas.
- `Enable`: `createPandorasApp` inyecta los componentes en el SO.
- `Disable`: Los componentes se desvinculan del SO.
- `Upgrade`: Migraciones de estado interno del Pack.

### 5. Compatibilidad y Versionado
Todo Pack debe declarar la propiedad `sdkVersion`. Si el SDK de Pandora's OS cargando la aplicación tiene una versión mayor incompatible (ej. OS v2 vs Pack v1), la instalación fallará proactivamente (Fail-Fast).

### 6. Validación Autónoma
Un Pack debe estar diseñado de forma que pueda validarse de manera estática. En el futuro, un CLI (`pandoras pack validate`) debe ser capaz de analizar el Manifest exportado sin necesidad de levantar el Kernel, verificando contratos, assets faltantes y colisión de IDs.

## Consequences
- **Estandarización Total**: Hermes, S'Narai, Media Co, y Commercial compartirán la misma estructura (The Golden Pack).
- **Preparación para Marketplace**: La adición de metadatos (autor, versión, dependencias) permite en el futuro empaquetar y distribuir módulos a otros tenants.
- **Seguridad**: Al prohibir el auto-registro, el OS tiene control absoluto sobre qué Packs habilita o rechaza.
