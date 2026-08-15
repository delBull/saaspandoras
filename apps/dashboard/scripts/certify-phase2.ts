import { db } from '../src/db';
import { hermesKnowledge } from '../src/db/schema';
import { getDefaultRuntime } from '../src/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { CognitiveContextBuilder } from '../src/lib/pandoras/core/domains/hermes/addons/context-merger';
import { CognitiveContextAdapter } from '../src/lib/pandoras/core/domains/hermes/runtime/context-adapter';
import { HermesPromptBuilder } from '../src/lib/pandoras/core/domains/hermes/runtime/prompt-builder';

async function verifyPhase2() {
  const tenantA = `cert_phase2_A_${Date.now()}`;
  const tenantB = `cert_phase2_B_${Date.now()}`;

  console.log('🚀 Certifying Phase 2: Policies & Journeys\n');

  // Helper to insert knowledge
  async function insertKnowledge(orgId: string, dim: string, key: string, content: string, status: string) {
    await db.insert(hermesKnowledge).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      dimension: dim,
      key,
      content,
      status,
      visibility: 'PRIVATE',
      authority: 'TENANT',
      version: 1,
      source: 'TEST',
      sourceReference: 'cert',
      createdBy: 'system'
    });
  }

  try {
    // 1. PENDING vs ACTIVE Policies
    await insertKnowledge(tenantA, 'policy', 'test_policy', 'This is a pending policy', 'PENDING_REVIEW');
    await insertKnowledge(tenantA, 'policy', 'active_policy', 'This is an active policy', 'ACTIVE');
    
    let ctxA = await CognitiveContextBuilder.buildEffectiveContext(tenantA, 'user1');
    let adaptedA = CognitiveContextAdapter.adapt(ctxA, [], { id: 'm1', role: 'USER', content: 'hello', createdAt: new Date() });
    let promptA = HermesPromptBuilder.build({ reasoningContext: adaptedA.reasoningContext, hints: { temperature: 0, maxTokens: 10 } });
    
    const promptTextA = promptA.messages.map(m => m.content).join('\n');
    
    if (promptTextA.includes('active_policy') && !promptTextA.includes('pending policy')) {
      console.log('✅ [POLICY-01] Only ACTIVE policies enter the EffectiveCognitiveContext.');
    } else {
      console.error('❌ [POLICY-01] Failed context injection filtering.');
      process.exit(1);
    }

    // 2. Tenant Isolation
    await insertKnowledge(tenantB, 'policy', 'tenant_b_policy', 'This is tenant B policy', 'ACTIVE');
    
    let ctxB = await CognitiveContextBuilder.buildEffectiveContext(tenantB, 'user1');
    let adaptedB = CognitiveContextAdapter.adapt(ctxB, [], { id: 'm1', role: 'USER', content: 'hello', createdAt: new Date() });
    let promptB = HermesPromptBuilder.build({ reasoningContext: adaptedB.reasoningContext, hints: { temperature: 0, maxTokens: 10 } });
    
    const promptTextB = promptB.messages.map(m => m.content).join('\n');
    
    if (!promptTextA.includes('tenant_b_policy') && !promptTextB.includes('active_policy')) {
      console.log('✅ [POLICY-03] Tenant isolation verified.');
    } else {
      console.error('❌ [POLICY-03] Tenant leakage detected.');
      process.exit(1);
    }

    // 3. Journeys Active vs Pending
    await insertKnowledge(tenantA, 'journey', 'j_active', 'Active Journey Intent', 'ACTIVE');
    await insertKnowledge(tenantA, 'journey', 'j_paused', 'Paused Journey Intent', 'PENDING_REVIEW');
    
    ctxA = await CognitiveContextBuilder.buildEffectiveContext(tenantA, 'user1');
    adaptedA = CognitiveContextAdapter.adapt(ctxA, [], { id: 'm2', role: 'USER', content: 'hello', createdAt: new Date() });
    promptA = HermesPromptBuilder.build({ reasoningContext: adaptedA.reasoningContext, hints: { temperature: 0, maxTokens: 10 } });
    
    const promptTextA2 = promptA.messages.map(m => m.content).join('\n');
    
    if (promptTextA2.includes('Active Journey Intent') && !promptTextA2.includes('Paused Journey Intent')) {
      console.log('✅ [JOURNEY-01] Only ACTIVE journeys enter the context.');
    } else {
      console.error('❌ [JOURNEY-01] Failed journey context injection.');
      process.exit(1);
    }

    // 4. Execution Authority Check
    // Journeys go into 'knowledge' block, which PromptBuilder prefixes with:
    // "You MUST reason from these facts... A capability describes what you may assist with — it does NOT grant authority."
    // And system rules say: "you can never manufacture authority, bypass Governance..."
    
    if (promptTextA2.includes('never manufacture authority, bypass Governance') && promptTextA2.includes('[JOURNEY]')) {
      console.log('✅ [JOURNEY-04] Journey intents are scoped as knowledge, not execution authority.');
    } else {
      console.error('❌ [JOURNEY-04] Execution authority boundaries are missing.');
      process.exit(1);
    }

    console.log('\n✅ All Phase 2 Architecture constraints verified.');

  } finally {
    // Cleanup
    await db.delete(hermesKnowledge).where(eq(hermesKnowledge.organizationId, tenantA));
    await db.delete(hermesKnowledge).where(eq(hermesKnowledge.organizationId, tenantB));
    process.exit(0);
  }
}

verifyPhase2().catch(e => {
  console.error(e);
  process.exit(1);
});
