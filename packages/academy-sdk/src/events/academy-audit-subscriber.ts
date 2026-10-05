import { EventSpine, SecurityAuditLogger, TenantIpfsVaultService, HermesIdentitySigner } from "@saasfly/hermes-core";
import { db, hermesSecurityEvents } from "@saasfly/db-core";
import { eq, desc } from "@saasfly/db-core";

export class AcademyAuditSubscriber {
  public static initialize() {
    EventSpine.getInstance().subscribe<{
      certificationId: string;
      candidateId: string;
      programId?: string;
      ipfsCid: string;
      tenantId?: string;
    }>('ACADEMY_CERTIFICATION_ISSUED', async (event) => {
      console.log(`[AcademyAuditSubscriber] Processing certification event: ${event.id}`);
      
      const payload = event.payload;
      const tenantId = payload.tenantId || 'pandoras_academy'; // Use payload tenant or default

      try {
        // 1. Log to Security Audit Logger
        await SecurityAuditLogger.logEvent({
          organizationId: tenantId,
          actorId: payload.candidateId,
          eventType: 'CREDENTIAL_ISSUED', // Using existing security event type
          severity: 'INFO',
          policyDecision: 'ALLOW',
          correlationId: payload.certificationId,
          artifactId: payload.ipfsCid,
          classification: 'PUBLIC',
          metadata: {
            programId: payload.programId,
            eventId: event.id,
            timestamp: event.timestamp
          }
        });

        // 2. Fetch the 10 most recent events for this tenant to build the Merkle batch
        const recentEvents = await db
          .select()
          .from(hermesSecurityEvents)
          .where(eq(hermesSecurityEvents.organizationId, tenantId))
          .orderBy(desc(hermesSecurityEvents.sequenceNumber))
          .limit(10);

        if (recentEvents.length > 0) {
          // Sort ascending for the snapshot (oldest to newest in the batch)
          const batchToExport = recentEvents.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
          
          const signer = new HermesIdentitySigner();
          const vault = new TenantIpfsVaultService();
          
          const snapshot = await vault.exportAuditSnapshotToIpfs(
            tenantId,
            batchToExport.map(e => ({
              sequenceNumber: e.sequenceNumber,
              eventHash: e.eventHash,
              id: e.id,
              previousEventHash: e.previousEventHash,
              contentHash: e.contentHash,
              eventType: e.eventType,
              severity: e.severity,
              createdAt: e.createdAt
            })),
            signer
          );

          console.log(`✅ [AcademyAuditSubscriber] Successfully anchored audit batch to IPFS: ${snapshot.ipfsCid}`);
        }
      } catch (e) {
        console.error('❌ [AcademyAuditSubscriber] Failed to process audit snapshot:', e);
      }
    });
    
    console.log('[AcademyAuditSubscriber] 🎧 Subscribed to ACADEMY_CERTIFICATION_ISSUED');
  }
}
