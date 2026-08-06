import { db } from '@/db';
import { compiledArtifacts } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Artifact Store
 *
 * The institutional storage layer of Hermes OS.
 * Stores compiled manifests (Runtime, Content, Discovery) as immutable versioned artifacts.
 * Metadata lives in PostgreSQL, the actual AST/Blobs live in Storage (local FS for now, S3 later).
 */
export class ArtifactStore {
  private baseDir = path.join(process.cwd(), '.artifacts');

  constructor() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Saves a new compiled artifact.
   */
  async saveArtifact(
    tenantId: number,
    type: 'runtime' | 'content' | 'discovery' | 'media' | 'reasoning' | 'config' | 'mesh',
    version: string,
    checksum: string,
    data: any
  ): Promise<string> {
    const tenantDir = path.join(this.baseDir, `tenant_${tenantId}`);
    if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });
    
    const typeDir = path.join(tenantDir, type);
    if (!fs.existsSync(typeDir)) fs.mkdirSync(typeDir, { recursive: true });

    const filename = `${type}_v${version}_${checksum.substring(0, 8)}.json`;
    const filePath = path.join(typeDir, filename);
    const content = JSON.stringify(data, null, 2);
    
    // In a real S3 implementation, we would upload the buffer to a bucket here
    fs.writeFileSync(filePath, content, 'utf-8');
    const sizeBytes = Buffer.byteLength(content, 'utf-8');

    // Save metadata in DB
    const uri = `local://${filePath}`;
    await db.insert(compiledArtifacts).values({
      tenantId,
      type,
      checksum,
      version,
      uri,
      sizeBytes,
    });

    console.log(`[ArtifactStore] Saved ${type} artifact for tenant ${tenantId} at ${uri}`);
    return uri;
  }

  /**
   * Loads the latest artifact of a given type.
   */
  async loadLatestArtifact(tenantId: number, type: 'runtime' | 'content' | 'discovery' | 'media' | 'reasoning' | 'config' | 'mesh'): Promise<any | null> {
    const [latest] = await db.select()
      .from(compiledArtifacts)
      .where(
        and(
          eq(compiledArtifacts.tenantId, tenantId),
          eq(compiledArtifacts.type, type)
        )
      )
      .orderBy(desc(compiledArtifacts.createdAt))
      .limit(1);

    if (!latest) return null;

    if (latest.uri.startsWith('local://')) {
      const filePath = latest.uri.replace('local://', '');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    }

    throw new Error(`[ArtifactStore] Artifact ${latest.uri} not found in storage.`);
  }
}

export const artifactStore = new ArtifactStore();
