import { ScopeValidator, KnowledgeDocument } from '../knowledge/exclusion-register';
import * as assert from 'assert';

function testCognitiveBoundaries() {
  const targetTenant = 'snarai';

  console.log("Starting Adversarial Cognitive Boundary Tests...\n");

  // TEST 1: Tenant boundary violation
  const docOtherTenant: KnowledgeDocument = {
    id: '1',
    organizationId: 'other-corp',
    status: 'CANONICAL',
    visibility: 'PUBLIC',
    authority: 'CANONICAL',
    content: 'Secret pricing for other corp'
  };
  let result = ScopeValidator.isAllowedInContext(docOtherTenant, targetTenant, true);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'TENANT_BOUNDARY_VIOLATION');
  console.log("✅ PASS: Prevent knowledge retrieval from another tenant.");

  // TEST 2: SUPERSEDED knowledge injection
  const docSuperseded: KnowledgeDocument = {
    id: '2',
    organizationId: targetTenant,
    status: 'SUPERSEDED',
    visibility: 'PUBLIC',
    authority: 'CANONICAL',
    content: 'Old pricing model'
  };
  result = ScopeValidator.isAllowedInContext(docSuperseded, targetTenant, true);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'BLOCKED_STATUS_SUPERSEDED');
  console.log("✅ PASS: Prevent injection of SUPERSEDED knowledge.");

  // TEST 3: INTERNAL knowledge in PUBLIC channel
  const docInternal: KnowledgeDocument = {
    id: '3',
    organizationId: targetTenant,
    status: 'VERIFIED',
    visibility: 'INTERNAL',
    authority: 'INTERNAL',
    content: 'Internal ops manual'
  };
  result = ScopeValidator.isAllowedInContext(docInternal, targetTenant, true);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'RESTRICTED_VISIBILITY_ON_PUBLIC_CHANNEL');
  console.log("✅ PASS: Prevent INTERNAL knowledge on PUBLIC channel.");

  // TEST 4: Contact Memory as Knowledge
  const docMemory: KnowledgeDocument = {
    id: '4',
    organizationId: targetTenant,
    status: 'VERIFIED',
    visibility: 'RESTRICTED',
    authority: 'VERIFIED',
    content: 'User Marco bought 5 tokens',
    metadata: { dataType: 'CONTACT_MEMORY' }
  };
  result = ScopeValidator.isAllowedInContext(docMemory, targetTenant, false); // Internal channel
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'BLOCKED_DATA_TYPE_CONTACT_MEMORY');
  console.log("✅ PASS: Prevent Contact Memory injection as Global Knowledge.");

  // TEST 5: Governance Executable Rule
  const docGovernance: KnowledgeDocument = {
    id: '5',
    organizationId: targetTenant,
    status: 'CANONICAL',
    visibility: 'INTERNAL',
    authority: 'CANONICAL',
    content: 'if (amount > X) { requireApproval() }',
    metadata: { dataType: 'GOVERNANCE_EXECUTABLE_RULES' }
  };
  result = ScopeValidator.isAllowedInContext(docGovernance, targetTenant, false);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'GOVERNANCE_EXECUTABLE_RULE_IN_KNOWLEDGE');
  console.log("✅ PASS: Prevent Executable Governance logic in Cognitive RAG.");

  // TEST 6: MISSING document invention
  const docMissing: KnowledgeDocument = {
    id: '6',
    organizationId: targetTenant,
    status: 'MISSING',
    visibility: 'PUBLIC',
    authority: 'UNKNOWN',
    content: ''
  };
  result = ScopeValidator.isAllowedInContext(docMissing, targetTenant, true);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'BLOCKED_STATUS_MISSING');
  console.log("✅ PASS: Prevent MISSING documents from generating hallucinated contexts.");

  // TEST 7: Valid document
  const docValid: KnowledgeDocument = {
    id: '7',
    organizationId: targetTenant,
    status: 'CANONICAL',
    visibility: 'PUBLIC',
    authority: 'CANONICAL',
    content: 'Snarai is a great place to invest.'
  };
  result = ScopeValidator.isAllowedInContext(docValid, targetTenant, true);
  assert.strictEqual(result.allowed, true);
  console.log("✅ PASS: Allow valid CANONICAL knowledge on PUBLIC channel.");

  console.log("\n🚀 All Cognitive Boundary Tests Passed!");
}

testCognitiveBoundaries();
