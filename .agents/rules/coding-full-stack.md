---
trigger: always_on
---

DIRECTIVAS PERMANENTES DE OPERACIÓN — PRODUCCIÓN

## 1. Mentalidad de Producción
- Este sistema está EN PRODUCCIÓN con usuarios reales y datos reales en Neon y IPFS.
- Toda acción se hace como si pudiera romper un negocio vivo: cambios quirúrgicos,
  backwards-compatible, nunca destructivos sin confirmación explícita del usuario.
- Prohibido experimentar contra la base productiva. Si necesitas probar algo riesgoso,
  decláralo y pide entorno staging.

## 2. Trabajo Full-Stack REAL (prohibiciones duras)
- Prohibido entregar módulos huérfanos: si creas una clase/servicio/engine, debe estar
  CONECTADO al flujo real (runtime/API/UI) o declarado explícitamente como "SPEC NO IMPLEMENTADA".
- Prohibido simular infraestructura: nada de CIDs, hashes, IDs o respuestas fabricados.
  Si IPFS/Pinata no está disponible en dev, usa el fallback mock oficial (mock_bafkrei)
  y dilo; en producción es fail-closed (throw), jamás fallback silencioso.
- Prohibido tragar errores: ningún `.catch(err => console.warn(...))` que oculte fallos
  de persistencia. Fail-closed con throw, o degradación EXPLÍCITA y visible.

## 3. Esquema de Datos = SIEMPRE con migraciones
- Todo cambio de schema pasa por drizzle-kit generate → revisar el SQL → aplicar →
  VERIFICAR en la base real (`information_schema` / psql) antes de declarar listo.
- Si el código referencia una tabla/columna, esa tabla/columna DEBE existir en Neon.
  Verificarlo es parte de "terminado".
- Nunca editar migraciones ya aplicadas; siempre migraciones nuevas.
- Siempre haz las migraciones contra base de datos en .env, pero para base de datos en producción pídemela siempre porque no la exponemos.

## 4. Secretos y Seguridad (no negociable)
- Nada de secretos hardcodeados: ni defaults en código, ni en SQL, ni en migrations,
  ni valores de ejemplo reales. Solo variables de entorno con lectura fail-closed.
- Prohibido imprimir/loguear tokens, JWTs, private keys, DATABASE_URL o plaintext sensible.
- Al hacer scripts contra la DB: usar .env, nunca hardcodear conexión, y BORRAR el script
  temporal al terminar (dejar el repo limpio es parte de la definición de terminado).
- Por defecto: validación de entrada, tenant isolation (RLS donde aplique), rate limiting,
  auditoría de eventos de seguridad ante denegaciones y anomalías, y principio de menor privilegio.

## 5. Optimización para Vercel y recursos
- Pensar en cada PR: tamaño de bundle, funciones serverless frías, tiempo de ejecución
  y memoria. Evitar dependencias pesadas innecesarias.
- Queries: siempre indexadas y acotadas (limit), sin N+1, sin SELECT * en rutas calientes.
  Pooling de conexiones adecuado para serverless (Neon serverless driver).
- Cache agresivo donde sea seguro (revalidate tags, no páginas enteras con datos privados).
- Imágenes optimizadas, dynamic imports para componentes pesados, edge donde convenga.

## 6. Definición de TERMINADO (obligatoria antes de reportar éxito)
1. `bun x tsc --noEmit` → 0 errores.
2. Suite de tests del dominio tocado → pass, con números REALES verificados por ti.
3. Verificación funcional contra la base real cuando toque datos.
4. Reporte honesto: qué quedó, qué NO, alcance exacto de los números (qué comando y qué scope).
- Declarar "certificado/completado" sin haber corrido las verificaciones es la falla más grave.

## 7. Mejora continua
- Cada feature nueva debe reutilizar los patrones existentes (vault fail-closed, signer
  obligatorio, gates deterministas post-LLM, audit logger con hash-chain).
- Si detectas deuda técnica, repórterla; si puedes arreglarla barata, arréglala.
- Antes de proponer arquitectura nueva, pregúntate: ¿existe ya un mecanismo para esto?

## 8. ANALIZAR ANTES DE EJECUTAR (regla de oro en proyecto robusto)

Antes de escribir UNA sola línea de código, ejecuta obligatoriamente este análisis
de impacto y preséntalo en 5-10 líneas máximo:

1. **Mapa de blast radius**: ¿Quién llama/importa lo que voy a tocar? (grep de callers,
   importers y usos en tests). Lista los archivos afectados directa e indirectamente.
2. **Contratos compartidos**: Si edito un tipo, interfaz, schema o firma de función,
   ¿qué otros dominios/runtime/UI/tests se rompen o cambian de comportamiento?
3. **Datos en producción**: ¿El cambio altera lecturas/escrituras existentes? ¿Puede
   cambiar resultados para tenants actuales (S'Narai u otros)? ¿Hay migración involucrada?
4. **Superficie de regresión**: ¿Qué tests existen que cubran esta zona? Si no hay ninguno,
   decláralo y crea el test ANTES de editar.
5. **Plan declarado**: Di en 2-3 líneas QUÉ vas a cambiar, POR QUÉ es seguro, y qué NO vas
   a tocar. Si algo del análisis es ambiguo o el blast radius es grande (>5 archivos),
   DETENTE y pregunta antes de ejecutar.

Prohibido: ediciones "rápidas" sobre archivos críticos (runtime, policy gates, vault,
schema, adaptadores de canal) sin este análisis. La velocidad nunca justifica romper
producción: primero entender, luego proponer, después ejecutar, siempre verificar.

Las reglas 2.2, 4 y 6 capturan exactamente los tres patrones de falla que atrapamos durante casi todo el engagement: módulos huérfanos, errores silenciados sobre tablas inexistentes, y certificaciones con compilador roto.