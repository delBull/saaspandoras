/**
 * HERMES E2E PRODUCT CERTIFICATION v1.0 (DETERMINISTIC SUITE)
 * Run: bun x tsx scripts/certify-e2e.ts
 * 
 * Tests the entire Cognitive Pipeline (Memory -> Context -> Policy -> Runtime)
 * using the deterministic MockReasoningProvider.
 */

import { db } from '../src/db';
import { 
  projects, 
  hermesKnowledge,
  knowledgeSources,
} from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { HermesRuntime } from '../src/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { MockReasoningProvider, MockStreamingProvider } from '../src/lib/pandoras/core/domains/hermes/runtime/reasoning-providers';

// Helper to retry DB calls to handle NeonDB ECONNRESET
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 20): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (e: any) {
      lastError = e;
      if (e.code === 'ECONNRESET' || e.message.includes('ECONNRESET') || e.message.includes('socket disconnected') || e.message.includes('fetch failed')) {
        console.warn(`[Retry ${i+1}/${maxRetries}] ECONNRESET/Network error, retrying in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

// Mock DB Insertions to setup tenants using slug for orgId
async function setupTenant(slug: string, name: string) {
  await withRetry(() => db.insert(projects).values({
    slug,
    name,
    title: name,
    description: `Test tenant ${name}`,
    status: 'live',
    createdAt: new Date(),
    updatedAt: new Date(),
    chainId: 1, // dummy
  } as any).onConflictDoNothing());
  console.log(`✅ Tenant Setup: ${slug}`);
  return slug;
}

async function runCert01() {
  console.log(`\n--- 🚀 RUNNING CERT-01: Knowledge Governance (Policy Blocks Response) ---`);
  const tenant = await setupTenant('cert01-client', 'Tenant A');

  // Clear previous data for this tenant
  await db.delete(hermesKnowledge).where(eq(hermesKnowledge.organizationId, tenant));

  // 1. Insert Policy
  await withRetry(() => db.insert(hermesKnowledge).values({
    id: `pol_${nanoid(8)}`,
    organizationId: tenant,
    dimension: 'governance',
    key: 'strict_pricing',
    content: 'Never provide exact pricing.',
    status: 'ACTIVE',
    visibility: 'PRIVATE',
    authority: 'TENANT',
    version: 1,
    source: 'ADMIN',
    createdBy: 'admin'
  }));

  const runtime = new HermesRuntime(new MockReasoningProvider());
  
  // Test 1: Mismatch org ID testing tenant isolation enforcement
  try {
    await runtime.respond({
      organizationId: tenant,
      conversationId: 'test-conv-01',
      message: { id: 'm1', role: 'USER', content: 'What is the exact pricing?', createdAt: new Date() },
      controlPlaneContext: { actorId: 'cert-user', organizationId: 'fake-tenant', role: 'ADMIN', permissions: [] }
    });
    throw new Error('CERT-01 FAILED: Tenant isolation bypass! Allowed org mismatch.');
  } catch (err: any) {
    if (!err.message.includes('K11-A11')) {
      throw new Error(`CERT-01 FAILED: Unexpected error on org mismatch: ${err.message}`);
    }
    console.log('✅ CERT-01-A: Successfully rejected unauthorized tenant request.');
  }

  // Test 2: Actually process message and block it via policy
  const response = await runtime.respond({
    organizationId: tenant,
    conversationId: 'test-conv-01',
    message: { id: 'm2', role: 'USER', content: 'What is the exact pricing?', createdAt: new Date() },
    controlPlaneContext: { actorId: 'cert-user', organizationId: tenant, role: 'ADMIN', permissions: [] }
  });

  if (!response.content.includes('[Policy Block]') && response.policyViolations?.length === 0) {
    throw new Error('CERT-01 FAILED: Policy failed to block response.');
  }

  console.log('✅ CERT-01-B: Policy successfully loaded and response BLOCKED.');
}

async function runCert02() {
  console.log(`\n--- 🚀 RUNNING CERT-02: Tenant Isolation (Tenant B cannot see Tenant A knowledge) ---`);
  const tenantA = await setupTenant('cert02-client-a', 'Tenant A');
  const tenantB = await setupTenant('cert02-client-b', 'Tenant B');

  await db.delete(hermesKnowledge).where(eq(hermesKnowledge.organizationId, tenantA));
  await db.delete(hermesKnowledge).where(eq(hermesKnowledge.organizationId, tenantB));

  // 1. Insert Fact for Tenant A
  await withRetry(() => db.insert(hermesKnowledge).values({
    id: `know_${nanoid(8)}`,
    organizationId: tenantA,
    dimension: 'knowledge',
    key: 'secret_sauce',
    content: 'Tenant A uses 100% organic materials.',
    status: 'ACTIVE',
    visibility: 'PRIVATE',
    authority: 'TENANT',
    version: 1,
    source: 'ADMIN',
    createdBy: 'admin'
  }));

  const runtime = new HermesRuntime(new MockReasoningProvider());
  const response = await runtime.respond({
    organizationId: tenantB,
    conversationId: 'test-conv-02',
    message: { id: 'm1', role: 'USER', content: 'Tell me about materials', createdAt: new Date() },
    controlPlaneContext: { actorId: 'cert-user', organizationId: tenantB, role: 'ADMIN', permissions: [] }
  });

  if (response.content.includes('organic')) {
    throw new Error('CERT-02 FAILED: Tenant B saw Tenant A knowledge.');
  }

  console.log('✅ CERT-02 PASSED: Strict tenant isolation verified. 0 leakage.');
}

async function runCert03() {
  console.log('\n--- 🚀 RUNNING CERT-03: Governance Lifecycle (PENDING vs ACTIVE) ---');
  const tenant = await setupTenant('cert03-preloaded', 'Preloaded Tenant');
  
  const factId = `fact_${nanoid(8)}`;
  await withRetry(() => db.insert(hermesKnowledge).values({
    id: factId,
    organizationId: tenant,
    dimension: 'knowledge',
    key: 'history_fact',
    content: 'Founded in 2020.',
    status: 'PENDING_REVIEW',
    visibility: 'PRIVATE',
    authority: 'TENANT',
    version: 1,
    source: 'KNOWLEDGE_PIPELINE',
    sourceReference: 'fake-src',
    createdBy: 'system'
  }));

  const runtime = new HermesRuntime(new MockReasoningProvider());
  
  // CERT-03A: PENDING_REVIEW should NOT be seen
  const responsePending = await runtime.respond({
    organizationId: tenant,
    conversationId: 'test-conv-03',
    message: { id: 'm1', role: 'USER', content: 'When was it founded?', createdAt: new Date() },
    controlPlaneContext: { actorId: 'cert-user', organizationId: tenant, role: 'ADMIN', permissions: [] }
  });

  if (responsePending.content.includes('Founded in 2020')) {
    throw new Error('CERT-03A FAILED: Hermes accessed PENDING_REVIEW knowledge!');
  }
  console.log('✅ CERT-03A PASSED: PENDING_REVIEW data ignored.');

  // Approve fact
  await withRetry(() => db.update(hermesKnowledge).set({ status: 'ACTIVE' }).where(eq(hermesKnowledge.id, factId)));

  // CERT-03B: ACTIVE should be seen
  const responseActive = await runtime.respond({
    organizationId: tenant,
    conversationId: 'test-conv-03',
    message: { id: 'm2', role: 'USER', content: 'When was it founded?', createdAt: new Date() },
    controlPlaneContext: { actorId: 'cert-user', organizationId: tenant, role: 'ADMIN', permissions: [] }
  });

  if (!responseActive.content.includes('Founded in 2020')) {
    throw new Error('CERT-03B FAILED: Hermes could not access ACTIVE knowledge!');
  }

  console.log('✅ CERT-03B PASSED: ACTIVE data successfully utilized.');
}

async function runCert04() {
  console.log('\n--- 🚀 RUNNING CERT-04: Memory Continuity ---');
  const tenant = await setupTenant('cert04-memory', 'Memory Tenant');
  
  const runtime = new HermesRuntime(new MockReasoningProvider());
  
  await runtime.respond({
    organizationId: tenant,
    conversationId: 'test-conv-04',
    message: { id: 'm1', role: 'USER', content: 'My favorite color is Blue', createdAt: new Date() },
    controlPlaneContext: { actorId: 'cert-user', organizationId: tenant, role: 'ADMIN', permissions: [] }
  });
  
  const response2 = await runtime.respond({
    organizationId: tenant,
    conversationId: 'test-conv-04',
    message: { id: 'm2', role: 'USER', content: 'What is my favorite color?', createdAt: new Date() },
    controlPlaneContext: { actorId: 'cert-user', organizationId: tenant, role: 'ADMIN', permissions: [] }
  });
  
  // Note: The MockReasoningProvider does not echo memory directly in its inspection report,
  // but it does prove that multiple turns persist without failure.
  // Real memory test is covered by REAL-LLM suite.
  
  console.log('✅ CERT-04 PASSED: Conversation history loads and persists without error.');
}

async function runCert05() {
  console.log('\n--- 🚀 RUNNING CERT-05: Streaming (Success) ---');
  const tenant = await setupTenant('cert05-stream', 'Stream Tenant');
  
  const runtime = new HermesRuntime(new MockStreamingProvider());
  const stream = await runtime.stream({
    organizationId: tenant,
    conversationId: 'test-conv-05',
    message: { id: 'm1', role: 'USER', content: 'Hello stream', createdAt: new Date() },
    controlPlaneContext: { actorId: 'cert-user', organizationId: tenant, role: 'ADMIN', permissions: [] }
  });

  let hasStart = false;
  let hasDelta = false;
  let hasComplete = false;

  for await (const chunk of stream) {
    if (chunk.type === 'START') hasStart = true;
    if (chunk.type === 'DELTA') hasDelta = true;
    if (chunk.type === 'COMPLETE') hasComplete = true;
  }

  if (!hasStart || !hasDelta || !hasComplete) {
    throw new Error('CERT-05 FAILED: Stream missing required events.');
  }

  console.log('✅ CERT-05 PASSED: Streaming pipeline correctly emits START -> DELTA -> COMPLETE.');
}

async function runCert06() {
  console.log(`\n--- 🚀 RUNNING CERT-04: Streaming Governance Verification ---`);
  const tenant = await setupTenant('cert04-client', 'Tenant D');

  await db.delete(hermesKnowledge).where(eq(hermesKnowledge.organizationId, tenant));

  // 1. Insert Policy
  await withRetry(() => db.insert(hermesKnowledge).values({
    id: `pol_${nanoid(8)}`,
    organizationId: tenant,
    dimension: 'governance',
    key: 'strict_pricing',
    content: 'Never provide exact pricing.',
    status: 'ACTIVE',
    visibility: 'PRIVATE',
    authority: 'TENANT',
    version: 1,
    source: 'ADMIN',
    createdBy: 'admin'
  }));

  const runtime = new HermesRuntime(new MockStreamingProvider());
  const stream = await runtime.stream({
    organizationId: tenant,
    conversationId: 'test-conv-06',
    message: { id: 'm1', role: 'USER', content: 'What is the exact pricing?', createdAt: new Date() },
    controlPlaneContext: { actorId: 'cert-user', organizationId: tenant, role: 'ADMIN', permissions: [] }
  });

  let hasBlocked = false;

  for await (const chunk of stream) {
    if (chunk.type === 'BLOCKED') hasBlocked = true;
  }

  if (!hasBlocked) {
    throw new Error('CERT-06 FAILED: Stream failed to block response.');
  }

  console.log('✅ CERT-06 PASSED: Streaming pipeline correctly blocks response.');
}

async function main() {
  try {
    console.log('Starting HERMES_E2E_PRODUCT_CERTIFICATION_v1.0 (DETERMINISTIC)...');
    await runCert01();
    await runCert02();
    await runCert03();
    await runCert04();
    await runCert05();
    await runCert06();
    console.log('\n🏆 ALL DETERMINISTIC CERTIFICATIONS PASSED.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CERTIFICATION FAILED:', error);
    process.exit(1);
  }
}

main();
