import { ConversationContext, KnowledgeScope } from './conversation-context';

export class CognitiveScopeViolation extends Error {
  constructor(message: string) {
    super(`[COGNITIVE_SCOPE_VIOLATION] ${message}`);
    this.name = 'CognitiveScopeViolation';
  }
}

export interface KnowledgeExclusionTrace {
  knowledgeId: string;
  organizationId: string;
  status: string;
  action: 'EXCLUDED';
  reason: string;
}

/**
 * Determines if a given knowledge chunk is accessible in the current context.
 */
function canAccessKnowledge(
  actorId: string,
  organizationId: string,
  scope: KnowledgeScope,
  channelType: string,
  policy: any
): boolean {
  if (scope.visibility === 'PUBLIC') return true;
  
  if (scope.visibility === 'INTERNAL') {
    // Basic heuristic: external channels (whatsapp, telegram) cannot access INTERNAL knowledge
    if (channelType === 'whatsapp' || channelType === 'telegram') return false;
    // Portal might have access, but we'll need role checking in the future.
    return true; 
  }

  if (scope.visibility === 'RESTRICTED') {
    // Requires explicit capability, deny by default
    return false;
  }

  return false;
}

/**
 * Ensures strict C5.25 isolation and purges invalid knowledge.
 * Fails closed on tenant leaks.
 * Registers exclusions for SUPERSEDED or RESTRICTED chunks.
 */
export function assertContextScope(context: ConversationContext): { exclusions: KnowledgeExclusionTrace[] } {
  const currentOrgId = context.organization.organizationId;
  const currentProjectId = context.organization.projectId;
  const exclusions: KnowledgeExclusionTrace[] = [];
  const validSnippets = [];

  for (const snippet of context.knowledge.retrievedSnippets) {
    const scope = snippet.scope;
    
    // 1. Tenant Mismatch -> FAIL CLOSED immediately
    if (scope.organizationId && scope.organizationId !== currentOrgId && scope.organizationId !== 'hermes_global') {
      throw new CognitiveScopeViolation(
        `Knowledge leak detected! Snippet belongs to Org ${scope.organizationId}, but context is for Org ${currentOrgId}.`
      );
    }

    if (scope.projectId && currentProjectId && scope.projectId !== currentProjectId) {
      throw new CognitiveScopeViolation(
        `Knowledge leak detected! Snippet belongs to Project ${scope.projectId}, but context is for Project ${currentProjectId}.`
      );
    }

    // 2. Status check (Exclude SUPERSEDED / ARCHIVED)
    if (scope.status !== 'ACTIVE') {
      exclusions.push({
        knowledgeId: scope.sourceId,
        organizationId: scope.organizationId,
        status: scope.status,
        action: 'EXCLUDED',
        reason: `knowledge_status_${scope.status.toLowerCase()}`
      });
      continue;
    }

    // 3. Visibility check
    const hasAccess = canAccessKnowledge(
      context.actor.externalId,
      currentOrgId,
      scope,
      context.channel.type,
      context.policy
    );

    if (!hasAccess) {
      exclusions.push({
        knowledgeId: scope.sourceId,
        organizationId: scope.organizationId,
        status: scope.status,
        action: 'EXCLUDED',
        reason: `visibility_restriction_${scope.visibility.toLowerCase()}`
      });
      continue;
    }

    validSnippets.push(snippet);
  }

  // Mutate the context to remove excluded snippets before they reach PromptCompiler
  context.knowledge.retrievedSnippets = validSnippets;

  if (exclusions.length > 0) {
    console.log(`[ScopeValidator] Excluded ${exclusions.length} snippets:`, JSON.stringify(exclusions));
  }

  return { exclusions };
}
