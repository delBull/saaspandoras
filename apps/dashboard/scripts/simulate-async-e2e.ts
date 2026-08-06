import 'dotenv/config';
import { db } from '../src/db';
import { hermesJobs, hermesJournal } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { HermesExecutionEngine } from '../src/lib/hermes/kernel/execution/execution-api';
import { ExecutionRequest } from '../src/lib/hermes/contracts/universal';
import { randomUUID } from 'crypto';
import { POST as callbackPOST } from '../src/app/api/v1/hermes/webhook/[channel]/callback/route';
import { NextRequest } from 'next/server';

// MOCK FETCH PARA E2E:
const originalFetch = global.fetch;
global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
  const urlStr = url.toString();
  
  // Si el Transport intenta llamar al proveedor externo, simulamos que responde OK y que procesará asíncronamente
  if (urlStr.includes('portal-production-1672.up.railway.app') || urlStr.includes('execute')) {
    console.log(`\n🛡️ [MOCK] Interceptando llamada saliente a proveedor: ${urlStr}`);
    return new Response(JSON.stringify({ status: 'running', telemetry: { accepted: true } }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Dejamos pasar llamadas reales (como el callback a nuestro propio webhook)
  return originalFetch(url, init);
};

async function runE2E() {
  console.log('🚀 Iniciando test end-to-end AUTOMATIZADO de Hermes OS Async Flow...');
  
  const tenantId = 'test-tenant-999';
  const executionId = `e2e-${randomUUID()}`;

  // 1. Simular un Request Directo al Kernel
  const mockRequest: ExecutionRequest = {
    executionId,
    requestId: `req-${randomUUID()}`,
    capability: 'image.generate',
    tenantId,
    requester: 'e2e-tester',
    payload: { prompt: 'A futuristic city skyline at sunset' },
    timeoutMs: 5000,
    channel: 'api',
    identity: { role: 'tester' },
    executionProfile: 'interactive',
    priority: 'normal',
  };

  console.log(`\n📦 [Paso 1] Inyectando request al HermesExecutionEngine (capability: ${mockRequest.capability})`);
  const engine = new HermesExecutionEngine();
  const result = await engine.execute(mockRequest);

  if (result.status !== 'running') {
    console.error(`❌ El engine no devolvió status "running". Status devuelto: ${result.status}`);
    process.exit(1);
  }
  console.log('✅ El Engine rutéo correctamente al proveedor asíncrono y devolvió "running".');

  // 2. Verificar que se haya guardado en DB como "Waiting Callback"
  console.log(`\n🔍 [Paso 2] Buscando el Job en Postgres (ID: ${executionId})...`);
  const jobs = await db.select().from(hermesJobs).where(eq(hermesJobs.id, executionId)).limit(1);

  if (jobs.length === 0) {
    console.error('❌ El Job NO fue guardado en Postgres.');
    process.exit(1);
  }

  const job = jobs[0];
  if (!job) {
    console.error('❌ Job is undefined');
    process.exit(1);
  }
  console.log(`✅ Job encontrado en DB. Estado actual: ${job.state}`);
  
  if (job.state !== 'Waiting Callback') {
    console.error(`❌ El estado en DB es ${job.state}, se esperaba "Waiting Callback".`);
    process.exit(1);
  }

  if (!job.callbackSecret) {
    console.error('❌ El Job no guardó el callbackSecret en DB.');
    process.exit(1);
  }

  // 3. Simular Callback
  console.log(`\n🔐 [Paso 3] Generando firma HMAC y enviando Callback simulado...`);
  const callbackResult = {
    status: 'completed',
    artifacts: [{ type: 'image', uri: 'https://cdn.pandoras.media/e2e-test-image.png' }],
    telemetry: { e2e: true }
  };
  const signature = crypto.createHmac('sha256', job.callbackSecret).update(job.id).digest('hex');

  // Hacemos la llamada directa a la función POST de Next.js
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/v1/hermes/webhook/${job.providerId}/callback`;
  
  console.log(`📡 Invocando directamente la ruta POST (simulación de fetch)...`);
  
  const req = new NextRequest(callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      executionId: job.id,
      signature: signature,
      result: callbackResult
    })
  });

  const response = await callbackPOST(req, { params: Promise.resolve({ channel: job.providerId || 'pandoras-media-co' }) });
  
  const resBody = await response.json();
  
  if (response.status !== 200) {
    console.error('❌ El Webhook de Callback falló:', response.status, resBody);
    process.exit(1);
  }
  console.log('✅ Webhook aceptó el callback exitosamente:', resBody);

  // 4. Verificar estado final en DB
  console.log(`\n🔍 [Paso 4] Verificando persistencia final en DB...`);
  
  const updatedJobs = await db.select().from(hermesJobs).where(eq(hermesJobs.id, job.id)).limit(1);
  const updatedJob = updatedJobs[0];
  if (!updatedJob || updatedJob.state !== 'Completed') {
    console.error(`❌ El estado del Job no se actualizó. Estado: ${updatedJob?.state}`);
    process.exit(1);
  }
  console.log('✅ Job marcado como "Completed" en postgres (hermes_jobs).');

  const journals = await db.select().from(hermesJournal).where(eq(hermesJournal.requestId, mockRequest.requestId)).limit(1);
  const journal = journals[0];
  if (!journal) {
    console.error('❌ No se encontró entrada en hermes_journal.');
    process.exit(1);
  }
  console.log(`✅ Registro encontrado en hermes_journal (Artifacts: ${journal.artifactsGenerated}).`);

  console.log(`\n🎉 TEST E2E ASYNC SUPERADO CON ÉXITO!`);
  process.exit(0);
}

runE2E().catch(err => {
  console.error('Error no controlado:', err);
  process.exit(1);
});
