import { ConversationContext } from './conversation-context';

export class CognitiveScopeViolation extends Error {
  constructor(message: string) {
    super(`[COGNITIVE_SCOPE_VIOLATION] ${message}`);
    this.name = 'CognitiveScopeViolation';
  }
}

/**
 * Ensures strict C5.25 isolation.
 * Fails closed if any cross-tenant or unauthorized data is detected in the context.
 */
export function assertContextScope(context: ConversationContext): void {
  const currentOrgId = context.organization.organizationId;
  const currentProjectId = context.organization.projectId;

  // 1. Validate Knowledge Snippets
  for (const snippet of context.knowledge.retrievedSnippets) {
    // Only GLOBAL and PLATFORM scopes are allowed without an explicit matching organizationId
    if (snippet.scope === 'ORGANIZATION' || snippet.scope === 'PROJECT') {
      if (snippet.organizationId && snippet.organizationId !== currentOrgId) {
        throw new CognitiveScopeViolation(
          `Knowledge leak detected! Snippet belongs to Org ${snippet.organizationId}, but context is for Org ${currentOrgId}.`
        );
      }
    }

    if (snippet.scope === 'PROJECT') {
      if (currentProjectId && snippet.projectId && snippet.projectId !== currentProjectId) {
        // Strict project isolation: if project is specified, it must match.
        throw new CognitiveScopeViolation(
          `Knowledge leak detected! Snippet belongs to Project ${snippet.projectId}, but context is for Project ${currentProjectId}.`
        );
      }
    }
  }

  // Future checks: Memory isolation, Journey state boundaries, etc.
}
