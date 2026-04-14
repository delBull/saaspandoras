import postgres from 'postgres';
import { createHash } from 'crypto';

const DATABASE_URL_STAGING = "postgresql://neondb_owner:npg_9lRfvsopJ2UM@ep-cool-feather-ambh76vv-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

function getIdentityHash(email: string | null, walletAddress: string | null, fingerprint: string | null): string | null {
    if (!email && !walletAddress && !fingerprint) return null;
    
    const components = [
      email?.toLowerCase().trim() || '',
      walletAddress?.toLowerCase().trim() || '',
      fingerprint?.trim() || ''
    ].filter(Boolean);

    if (components.length === 0) return null;

    return createHash('sha256')
      .update(components.sort().join('|'))
      .digest('hex');
}

async function migrate() {
    console.log("🚀 Starting Identity Hash Normalization on STAGING...");
    const sql = postgres(DATABASE_URL_STAGING);

    // 1. Fetch all leads
    const leads = await sql`
        SELECT id, project_id, email, wallet_address, fingerprint, identity_hash, metadata, status, score
        FROM marketing_leads
    `;

    console.log(`📊 Found ${leads.length} leads to process.`);

    let normalizedCount = 0;
    let mergedCount = 0;

    for (const lead of leads) {
        const newHash = getIdentityHash(lead.email, lead.wallet_address, lead.fingerprint);
        
        if (!newHash) continue;

        if (lead.identity_hash === newHash) {
            // Already correct
            continue;
        }

        try {
            // Try to update
            await sql`
                UPDATE marketing_leads
                SET identity_hash = ${newHash}, updated_at = NOW()
                WHERE id = ${lead.id}
            `;
            normalizedCount++;
        } catch (err: any) {
            // Check for unique constraint violation (idempotency conflict)
            if (err.code === '23505') { 
                console.log(`🔗 Conflict detected for Lead ${lead.id} (New Hash: ${newHash.substring(0,8)}...). Merging...`);
                
                // Fetch the conflicting record
                const [conflictingLead] = await sql`
                    SELECT id, metadata, status, score FROM marketing_leads 
                    WHERE project_id = ${lead.project_id} AND identity_hash = ${newHash}
                `;

                if (conflictingLead) {
                    // Merge Metadata
                    const mergedMetadata = {
                        ...(lead.metadata || {}),
                        ...(conflictingLead.metadata || {}),
                        merged_from: lead.id,
                        merged_at: new Date().toISOString()
                    };

                    // Pick best status (identified > active > anonymous)
                    const statusOrder = ['scheduled', 'converted', 'active', 'anonymous'];
                    const bestStatus = statusOrder.find(s => s === conflictingLead.status || s === lead.status) || conflictingLead.status;

                    // Update conflicting lead
                    await sql`
                        UPDATE marketing_leads
                        SET 
                            metadata = ${sql.json(mergedMetadata)},
                            status = ${bestStatus},
                            score = GREATEST(score, ${lead.score || 0}),
                            updated_at = NOW()
                        WHERE id = ${conflictingLead.id}
                    `;

                    // Delete the old (duplicate) lead
                    await sql`DELETE FROM marketing_leads WHERE id = ${lead.id}`;
                    mergedCount++;
                }
            } else {
                console.error(`❌ Unexpected error updating Lead ${lead.id}:`, err);
            }
        }
    }

    console.log(`\n✅ Migration Complete!`);
    console.log(`✨ Normalized: ${normalizedCount}`);
    console.log(`🤝 Merged: ${mergedCount}`);
    
    await sql.end();
}

migrate().catch(console.error);
