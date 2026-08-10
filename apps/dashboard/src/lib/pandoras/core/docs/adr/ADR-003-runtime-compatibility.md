# ADR-003: Runtime Compatibility & Versioning

## Status
**Accepted** - v1.0.0 Freeze

## Context
Al separar el Kernel de las Aplicaciones (Packs), surge el problema clásico de los sistemas operativos: la compatibilidad. Si el Kernel evoluciona a la versión 2.0, no podemos permitir que los Packs antiguos fallen silenciosamente en producción o que rompan todo el sistema.

## Decision
Se instaura un modelo estricto de versionado semántico (SemVer) tanto para el Runtime como para los Packs.

### 1. Versionado del Runtime
El `PandorasRuntime` declarará explícitamente su versión al ser instanciado:
```typescript
const runtime = createPandorasRuntime();
console.log(runtime.version); // "1.0.0"
```

### 2. Declaración de Compatibilidad en los Packs
Cada Pack (o la aplicación completa en `createPandorasApp`) debe declarar con qué versión del Runtime fue compilado y es compatible:

```typescript
createPandorasApp({
  runtime,
  compatibility: ">=1.0.0 <2.0.0", // SemVer format
  packs: { ... }
});
```

### 3. Falla Temprana (Fail-Fast)
Si un `PandorasApp` intenta registrarse en un `PandorasRuntime` cuya versión no satisface la regla de compatibilidad del Pack, el SDK arrojará un `CompatibilityError` síncrono al momento del arranque. Nunca intentará ejecutar procesos con incompatibilidad potencial.

## Consequences
- Múltiples aplicaciones pueden coexistir en un monorepo, cada una declarando sus requisitos.
- Se garantiza la seguridad del runtime: un pack obsoleto no será cargado en un OS más moderno si hay *breaking changes*.
- Permite actualizaciones graduales de dominios (ej. actualizar Hermes a la v2.0 mientras S'Narai sigue corriendo con la política de compatibilidad v1.x en otro despliegue).
