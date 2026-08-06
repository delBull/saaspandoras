import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CompiledRuntimeManifest } from './pack-types';
import { ContentNode, CompiledContentManifest } from './content-types';

/**
 * Hermes OS — Content Compiler
 * 
 * Compiles raw source files (Markdown, JSON, etc.) into the Universal AST (ContentNode).
 */
export class ContentCompiler {
  private baseDir = path.join(process.cwd(), 'src/lib/hermes/packs');

  async compile(
    tenantId: number,
    runtimeManifest: CompiledRuntimeManifest & { resolvedOverrides: Record<string, any> }
  ): Promise<CompiledContentManifest> {
    const overrides = runtimeManifest.resolvedOverrides;
    const packs = overrides?.packs || {};

    const nodes: ContentNode[] = [];
    let nodeIdCounter = 0;

    for (const packId of Object.keys(packs)) {
      const packConfig = packs[packId];
      // Note: we assume the pack name matches its folder, e.g., 'referral_trust_concierge' -> 'referral-trust'
      // This is a naive mapping. In a real system, packId mapping would be explicit.
      const packFolder = packId.includes('referral_trust') ? 'referral-trust' : packId;

      for (const [slotKey, relativePath] of Object.entries(packConfig as Record<string, string>)) {
        if (typeof relativePath !== 'string') continue;
        
        // We only process Markdown files in this mock implementation
        if (relativePath.endsWith('.md')) {
          const filePath = path.join(this.baseDir, packFolder, relativePath);
          if (fs.existsSync(filePath)) {
            const rawText = fs.readFileSync(filePath, 'utf-8');
            
            // Naive tokenizer: split by double newline
            const blocks = rawText.split('\n\n').map(b => b.trim()).filter(Boolean);
            
            for (const block of blocks) {
              if (block.startsWith('#')) {
                nodes.push({
                  id: `node_${tenantId}_${nodeIdCounter++}`,
                  type: 'heading',
                  content: block.replace(/^#+\s/, ''),
                  entities: [],
                  topics: [], // We'll rely on Discovery to enrich these later
                });
              } else {
                nodes.push({
                  id: `node_${tenantId}_${nodeIdCounter++}`,
                  type: 'paragraph',
                  content: block,
                  entities: [],
                  topics: [],
                });
              }
            }
          }
        }
      }
    }

    const manifestInput = JSON.stringify(nodes);
    const checksum = crypto.createHash('sha256').update(manifestInput).digest('hex');

    console.log(`[ContentCompiler] Compiled ${nodes.length} nodes for tenant ${tenantId}. Checksum: ${checksum.substring(0, 8)}`);

    return {
      tenantId,
      nodes,
      checksum,
      compiledAt: new Date(),
    };
  }
}
