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

## 9. AUTO-AUDITORÍA ANTI-DETALLES (ejecutar ANTES de declarar anything "completado")

Estos son los patrones de falla recurrentes del proyecto. Cada entrega debe pasar
esta checklist explícita — y el walkthrough debe incluir la evidencia de haberla corrido:

### A. Test de orfandad (el más repetido)
Antes de decir "X está integrado/cableado/activo", corre tú mismo:
  grep -rln "<NombreDeLaClase|función>" src --include="*.ts" | grep -v "__tests__" | grep -v "<archivo_propio>"
Si los únicos callers son su propio archivo y tests → NO está integrado. Escríbelo
honestamente como "capacidad disponible, pendiente de cablear" con el punto exacto
donde debe conectarse. Prohibido usar verbos como "intercepta", "bloquea", "emite",
"valida en producción" si no hay caller en ruta viva.

### B. Identificadores fabricados
Prohibido generar CIDs/hashes/IDs que PAREZCAN reales:
  - Fallbacks sintéticos SIEMPRE con prefijo mock_: `mock_bafkrei_...`, nunca `bafkrei_...`
  - Si un parámetro de infraestructura es opcional, documenta qué pasa cuando es undefined.

### C. Parámetros de seguridad NUNCA opcionales
agentSigner, vaultService, claves de cifrado, tokens de API: si su ausencia debilita
la garantía, son obligatorios (throw). Revisa tus propias firmas antes de entregar:
¿puede llamarse a esta función y obtener un resultado VÁLIDO pero SIN la garantía
criptográfica claimada? Entonces está mal.

### D. Errores tragados
grep de tus propios cambios buscando `.catch(` y `try {` — cada catch debe o
relanzar, o degradar de forma EXPLÍCITA Y VISIBLE. Un catch que solo loguea sobre
persistencia/seguridad es un bug, no robustez.

### E. Números con vigencia y scope
Los números de tests quedan obsoletos en horas en este repo. Al reportar:
1. Corre los tests EN ESE MOMENTO (no cites corridas previas).
2. Declara el comando exacto y el alcance (hermes ≠ academy ≠ repo completo).
3. Corre `bun x tsc --noEmit` SIEMPRE al final — es la verificación más saltada.
4. Si agregaste archivos nuevos después de tu última corrida, vuelve a correr todo.

### F. Vocabulario de honestidad obligatorio
En cada walkthrough clasifica explícitamente cada elemento como:
  ✅ IMPLEMENTADO+CABLEADO (hay caller en ruta de producción)
  🟡 IMPLEMENTADO-SIN-CABLEAR (existe, tests pasan, sin uso real)
  🔵 ESPECIFICACIÓN (solo diseño/documento)
  ⏳ DEPENDIENTE (espera env var/recurso externo)
Un milestone "completado" no puede contener ítems 🟡 presentados como funcionales.

### G. La prueba del escéptico
Antes de enviar el reporte, imagina que un auditor hostil va a verificar CADA frase.
Para cada afirmación pregúntate: "¿qué comando probaría esto y qué salida daría?"
Si no puedes nombrar el comando, no hagas la afirmación — o corrígela a lo que sí
puedes demostrar.

La clave de este bloque es que convierte mis auditorías en checks auto-ejecutables:
los patrones A, C, D y E son exactamente los cuatro que atrapamos una y otra vez
(orfandad, firmas débiles, catches silenciosos, números obsoletos). Si Antigravity
los corre él mismo antes de reportar, el 90% de estos detalles desaparece.

## 10. PROTOCOLO DE ENTREGA ANTE AUDITORÍA (walkthrough obligatorio)

Complementa §6 y §9: define CÓMO se presenta la entrega. La ejecución de las
verificaciones ya está cubierta por §6 y §9E — esta sección regula la forma del
reporte y la trazabilidad de cada claim. Sin este formato, la entrega se rechaza
aunque el código sea correcto.

### A. Mapa de completitud (verdad de completitud)
- NUNCA declares una fase/checklist "completa" sin incluir una tabla de mapeo
  EXHAUSTIVA: ítem del checklist → archivo tocado → tamaño del diff
  (`git show <commit> --stat`).
- Si un ítem del checklist NO aparece en el stat del commit, márcalo explícitamente
  como ⏳ PENDIENTE. Prohibido omitirlo o doblarlo con otro ítem.
- Prohibido certificar más ítems que archivos tocados.

### B. Sellos de autoría (verdad de autoría)
Clasifica CADA cambio con uno de tres sellos visibles, además del estado de §9F:
  [NUEVO] código escrito en este commit ·
  [PREEXISTENTE] funcionalidad que ya existía y solo se verificó ·
  [INSPECCIÓN] verificado a mano sin test automatizado.
- Describir funcionalidad preexistente como si fuera nueva = fabricación.
- Todo test cuyo nombre diga "invokes X" / "rejects Y" DEBE incluir una
  spy/mock assertion real (`vi.spyOn(...)` + expect de que fue llamado). Un test
  que seguiría pasando sin la implementación es teatro prohibido (caso K27-IPFS-05 original).

### C. Inmutabilidad desktop (frontend responsive)
- En cambios responsive, la clase base puede cambiar SOLO si un prefijo sm:/md:/lg:
  restaura el VALOR COMPUTADO anterior exacto (válido: `p-6` → `p-4 sm:p-6`).
- Prohibido mutar textos/copy visible en el mismo commit responsive.
- Antes de entregar, lista cada clase base modificada junto a su prefijo restore.

### D. Formato de entrega obligatorio
Walkthrough con esta tabla, sin excepciones:
  | Claim | Evidencia (archivo:línea) | Sello | Estado |
Sin tabla = entrega rechazada. Cada celda "Evidencia" debe ser verificable por un
tercero con grep/read — la prueba del escéptico (§9G) aplicada al formato mismo.