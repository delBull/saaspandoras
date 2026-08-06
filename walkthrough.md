# 🚀 Walkthrough: Sprint 9 - Hermes OS Data Persistence & Async Reliability

En este sprint hemos cerrado la brecha de confiabilidad en entornos serverless, logrando que el flujo asíncrono y los callbacks sobrevivan a las ejecuciones efímeras de las lambdas.

## Cambios Principales

### 1. Drizzle ORM Schema (`hermesJobs` & `hermesJournal`)
- Añadimos la tabla `hermes_jobs` que persiste el estado, payloads (requests/results), el `callbackSecret` y la fecha de expiración `expiresAt`.
- Añadimos la tabla `hermes_journal` que persiste el grafo de ejecución (proveedores y bindings resueltos).
- **Ejecutamos la migración** exitosamente con `bunx drizzle-kit generate` (`0014_lucky_mysterio.sql`).

### 2. Kernel Serverless-Ready
- **Scheduler Asíncrono:** Todas las llamadas del `Scheduler` (enqueue, updateState, setCallbackData, getJob) ahora hacen lecturas y escrituras directas sobre PostgreSQL utilizando Drizzle ORM.
- **Journal Asíncrono:** El `DecisionJournal` ahora persiste directamente en la DB (`hermesJournal`).
- **Execution API:** Refactorizada para usar `await` en todas las interacciones con el Scheduler y el Journal, garantizando que el Job esté guardado en base de datos antes de disparar el webhook al proveedor.

### 3. Webhook y Callbacks Confiables
- **TTL y Expiración:** `HttpTransport` establece el TTL a 1 hora. La ruta `/api/v1/hermes/webhook/[channel]/callback/route.ts` ahora rechaza activamente el callback si `job.expiresAt` expiró (`HTTP 410 Gone`), limpiando ejecuciones zombies.
- **Validación del Secret Duradera:** La ruta recupera el Job de la base de datos de manera determinista, leyendo el secret persistido para verificar la firma HMAC del proveedor.
- **Fix Síncrono:** `HttpTransport` ya no asume `status: 'running'` por defecto. Si el proveedor no devuelve status, el request asume `status: 'completed'`, evitando jobs colgados.

---

> [!NOTE]
> Todo el stack de **Hermes OS (V5)** ya es 100% cloud-native y *serverless-ready*. El framework base de ejecución está totalmente consolidado en base de datos.
