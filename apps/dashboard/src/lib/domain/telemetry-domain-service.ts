import { db } from '@/db';
import { marketingLeadEvents, marketingLeads, marketingIdentities, projects } from '@/db/schema';
import { eq, and, gt, sql, or, ilike } from 'drizzle-orm';
import { createHash } from 'crypto';
import { IdentityService } from '@/lib/marketing/identity-service';
import { resolveProjectSlug } from '@/lib/project-utils';

export class TelemetryDomainService {
    /**
     * Procesa un evento de telemetría proveniente del widget u otros orígenes.
     * Resuelve identidades, unifica perfiles, y despacha el motor de growth si es necesario.
     */
    static async processEvent(body: any, origin: string | null, userAgent: string | null, referer: string | null) {
        const { event, projectId, projectSlug, fingerprint, metadata } = body;
        const requestedProjectIdentifier = projectSlug || projectId;
        const eventType = event.toUpperCase();
        
        // 1. Project Resolution
        let project: any = null;
        let resolutionMethod = 'unknown';
        let autoDiscoveredProjectId: number | null = null;
        
        if (origin) {
            try {
                const url = new URL(origin);
                const host = url.hostname.replace('www.', '');
                const projectMatch = await db.query.projects.findFirst({
                    where: (projects, { sql }) => sql`${projects.allowedDomains}::jsonb ?? ${host}`,
                    columns: { id: true }
                });
                if (projectMatch) {
                    autoDiscoveredProjectId = projectMatch.id;
                    console.info(`[Growth Engine] 🎯 Project Auto-Discovered: ID=${autoDiscoveredProjectId}, Host=${host}`);
                }
            } catch (e) { /* Ignore parse errors */ }
        }

        if (autoDiscoveredProjectId) {
            project = await db.query.projects.findFirst({
                where: (projects, { eq }) => eq(projects.id, autoDiscoveredProjectId as number)
            });
            resolutionMethod = 'origin_autodiscovery';
        } else if (isNaN(Number(requestedProjectIdentifier))) {
            const canonicalSlug = resolveProjectSlug(requestedProjectIdentifier);
            project = await db.query.projects.findFirst({
                where: (projects, { ilike }) => ilike(projects.slug, canonicalSlug)
            });
            resolutionMethod = 'slug_match';
        } else {
            project = await db.query.projects.findFirst({
                where: (projects, { eq }) => eq(projects.id, Number(requestedProjectIdentifier))
            });
            resolutionMethod = 'id_match';
        }

        if (!project) {
            console.error(`[Growth Engine] ❌ Project not found: ${requestedProjectIdentifier}. Resolution: ${resolutionMethod}`);
            return { success: false, error: 'Project not found', status: 404 };
        }

        const parsedProjectId = project.id;

        // 2. Resolve Identity Context
        const walletAddress = body.walletAddress || metadata?.walletAddress || metadata?.wallet || body.wallet;
        const leadEmail = (body.email || metadata?.email || body.userEmail)?.toLowerCase?.() || null;
        const phoneNumber = body.phoneNumber || body.phone || body.whatsapp || metadata?.phoneNumber || metadata?.phone || metadata?.whatsapp || null;
        const effectiveFingerprint = fingerprint || `anon_${createHash('md5').update(userAgent || 'unknown').digest('hex')}`;
        const identityHash = IdentityService.getIdentityHash(leadEmail, walletAddress, effectiveFingerprint);

        if (!identityHash) throw new Error("Failed to generate identity hash");

        // 2.1 Resolve existing Lead record
        const orConditions = [];
        if (leadEmail) orConditions.push(eq(marketingLeads.email, leadEmail));
        if (walletAddress) orConditions.push(eq(marketingLeads.walletAddress, walletAddress));
        if (fingerprint) orConditions.push(eq(marketingLeads.fingerprint, fingerprint));
        orConditions.push(eq(marketingLeads.identityHash, identityHash));

        const leadRecordArray = await db.select().from(marketingLeads).where(
            and(
                eq(marketingLeads.projectId, parsedProjectId),
                or(...orConditions)
            )
        ).limit(1);

        let leadRecord: any = leadRecordArray.length > 0 ? { ...leadRecordArray[0], project } : null;

        // 2.2 Auto-Capture/Update or Create
        if (leadRecord) {
            const updates: any = {};
            if (!leadRecord.email && leadEmail) updates.email = leadEmail;
            if (!leadRecord.walletAddress && walletAddress) updates.walletAddress = walletAddress;
            if (!leadRecord.phoneNumber && phoneNumber) updates.phoneNumber = phoneNumber;
            if (leadRecord.identityHash !== identityHash) updates.identityHash = identityHash;
            
            if (Object.keys(updates).length > 0) {
                await db.update(marketingLeads).set({ ...updates, updatedAt: new Date() }).where(eq(marketingLeads.id, leadRecord.id));
                Object.assign(leadRecord, updates);
            }
        } else {
            console.log(`[Growth OS] 👻 Creating anonymous lead for Project ${parsedProjectId} (Event: ${eventType})`);
            
            const idQueryCondition = [];
            if (leadEmail) idQueryCondition.push(eq(marketingIdentities.email, leadEmail));
            if (walletAddress) idQueryCondition.push(eq(marketingIdentities.walletAddress, walletAddress));
            if (effectiveFingerprint) idQueryCondition.push(eq(marketingIdentities.fingerprint, effectiveFingerprint));
            
            let resolvedIdentityId = null;
            if (idQueryCondition.length > 0) {
                const existingIdentities = await db.select().from(marketingIdentities).where(or(...idQueryCondition)).limit(1);
                if (existingIdentities.length > 0) {
                    resolvedIdentityId = existingIdentities[0]?.id;
                } else {
                    const [newId] = await db.insert(marketingIdentities).values({
                        fingerprint: effectiveFingerprint,
                        email: leadEmail,
                        walletAddress: walletAddress,
                        metadata: { source: "events_api_anonymous" }
                    }).returning({ id: marketingIdentities.id });
                    resolvedIdentityId = newId?.id || null;
                }
            }

            const [newLead] = await db.insert(marketingLeads).values({
                projectId: parsedProjectId,
                identityId: resolvedIdentityId,
                email: leadEmail,
                phoneNumber: phoneNumber,
                walletAddress: walletAddress,
                fingerprint: effectiveFingerprint,
                identityHash: identityHash,
                origin: origin || referer,
                scope: "b2c",
                intent: "explore",
                status: "active",
                metadata: { source: "events_api_anonymous" }
            }).returning();
            
            leadRecord = { ...newLead, project };
        }

        const lead = leadRecord;

        // 3. Semantic Deduplication
        const sortedMetadata = metadata ? Object.keys(metadata).sort().reduce((acc, key) => {
            acc[key] = metadata[key as keyof typeof metadata];
            return acc;
        }, {} as any) : {};

        const payloadString = JSON.stringify(sortedMetadata);
        const semanticHash = createHash('sha256')
            .update(`${lead?.id || effectiveFingerprint}-${eventType}-${payloadString}`)
            .digest('hex');

        const existingSemantic = await db.query.marketingLeadEvents.findFirst({
            where: eq(marketingLeadEvents.semanticHash, semanticHash)
        });

        if (existingSemantic) {
            return { success: true, throttled: true, semantic: true, status: 200 };
        }

        // 4. Log Event
        const [eventRecord] = await db.insert(marketingLeadEvents).values({
            leadId: lead?.id || null as any,
            type: eventType,
            semanticHash,
            payload: {
                fingerprint: effectiveFingerprint,
                origin: origin || referer,
                userAgent: userAgent,
                ...metadata
            }
        }).returning();

        if (!eventRecord) throw new Error("Failed to log marketing event");

        // 5. Growth Engine Connectivity
        const effectiveLeadEmail = lead?.email || leadEmail;
        const HIGH_PRIORITY_EVENTS = ['IDENTIFY', 'FORM_SUBMIT', 'LEAD_SUBMIT', 'USER_IDENTIFIED', 'PURCHASE', 'CONVERSION', 'TIER_VIEWED'];
        const isHighPriority = HIGH_PRIORITY_EVENTS.includes(eventType);

        if (effectiveLeadEmail && lead && eventRecord && isHighPriority) {
            try {
                console.log(`[Growth OS] 🧠 Triggering Engine for HIGH_PRIORITY event: ${eventType} (${effectiveLeadEmail})`);
                
                const { computeBehavioralMetrics, resolveGrowthAction } = await import("@/lib/marketing/growth-engine/engine");
                const { executeGrowthActions } = await import("@/lib/marketing/growth-engine/actions");

                const recentEvents = await db.select()
                    .from(marketingLeadEvents)
                    .where(eq(marketingLeadEvents.leadId, lead.id))
                    .orderBy(sql`created_at DESC`)
                    .limit(20);

                const { intentScore, priorityScore, engagementLevel, profile } = computeBehavioralMetrics(lead as any, recentEvents || []);

                const engineEventType = eventType === 'IDENTIFY' ? 'LEAD_CAPTURED' : eventType;
                
                const existingGrowthMeta = (lead.metadata as any)?.growth;
                const isNewLead = !existingGrowthMeta?.executedActions || Object.keys(existingGrowthMeta.executedActions).length === 0;

                const engineResult = resolveGrowthAction(engineEventType as any, {
                    ...lead as any,
                    email: effectiveLeadEmail, 
                    intentScore,
                    priorityScore,
                    engagementLevel,
                    profile,
                    metadata: lead.metadata as any
                }, project);

                if (engineResult && engineResult.actions.length > 0) {
                    await executeGrowthActions(
                        engineResult.actions, 
                        { 
                            lead: { ...lead as any, email: effectiveLeadEmail, intentScore, priorityScore, engagementLevel, profile }, 
                            project: {
                                ...project as any,
                                name: (project as any).title || 'Protocolo Ecosystem',
                                businessCategory: (project as any).businessCategory || (project as any).business_category || 'other'
                            }
                        },
                        { 
                            ruleId: engineResult.ruleId || `EVENT_${eventType}`,
                            bypassCooldown: isNewLead
                        },
                        engineResult.scoreChange,
                        engineResult
                    );
                }
            } catch (engineErr) {
                console.error('❌ Growth Engine Execution Error:', engineErr);
            }
        }

        console.log(`📊 [Growth OS] Event tracked: ${eventType} for Project ${parsedProjectId}`);
        return { success: true, eventId: eventRecord.id, status: 200 };
    }
}
