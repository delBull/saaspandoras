import 'dotenv/config';
import { db } from '../src/db';
import { hermesJobs } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function testAsyncFlow() {
  console.log('🚀 Iniciando test end-to-end de Hermes OS Async Flow...');

  // 1. We assume the DB has been migrated and a job has been pushed.
  // We can just query the latest Waiting Callback job.
  const jobs = await db.select().from(hermesJobs).where(eq(hermesJobs.state, 'Waiting Callback')).limit(1);

  if (jobs.length === 0) {
    console.error('❌ No se encontró ningún job en estado "Waiting Callback".');
    console.log('💡 Por favor, lanza un request a Telegram que invoque a Media Co primero.');
    process.exit(1);
  }

  const job = jobs[0];
  if (!job) {
    console.error('❌ No se encontró ningún job en estado "Waiting Callback".');
    process.exit(1);
  }
  console.log(`✅ Job encontrado: ${job.id} (Provider: ${job.providerId})`);

  if (!job.callbackSecret) {
    console.error('❌ El job no tiene callbackSecret.');
    process.exit(1);
  }

  // 2. Simulate Media Co callback payload
  const result = {
    status: 'completed',
    artifacts: [
      { type: 'image', uri: 'https://cdn.pandoras.media/test-image-123.png' }
    ],
    telemetry: { simulated: true }
  };

  // 3. Generate correct HMAC signature
  const signature = crypto.createHmac('sha256', job.callbackSecret).update(job.id).digest('hex');

  console.log(`🔐 Firma HMAC generada: ${signature}`);

  // 4. Fire POST to our own webhook
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/v1/hermes/webhook/${job.providerId}/callback`;
  
  console.log(`📡 Enviando callback POST a: ${callbackUrl}`);
  
  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      executionId: job.id,
      signature: signature,
      result: result
    })
  });

  const resBody = await response.json();
  
  if (response.ok) {
    console.log('✅ Webhook de Callback respondió con ÉXITO:', resBody);
  } else {
    console.error('❌ Webhook de Callback FALLÓ:', response.status, resBody);
    process.exit(1);
  }

  // 5. Verify the DB state updated to Completed
  const updatedJobs = await db.select().from(hermesJobs).where(eq(hermesJobs.id, job.id)).limit(1);
  const updatedJob = updatedJobs[0];
  if (!updatedJob) {
    console.error('❌ No se pudo re-leer el job tras el callback.');
    process.exit(1);
  }

  console.log(`📊 Estado final en DB: ${updatedJob.state}`);
  
  if (updatedJob.state === 'Completed') {
    console.log('🎉 Test End-to-End superado exitosamente!');
  } else {
    console.error('❌ El estado en DB no es Completed.');
  }
  
  process.exit(0);
}

testAsyncFlow().catch(console.error);
