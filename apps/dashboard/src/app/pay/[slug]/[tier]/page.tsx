import { notFound } from 'next/navigation';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import CheckoutClient from './CheckoutClient';
import { matchPhase, getRawPhases, type Phase } from '@/lib/phase-utils';

export default async function CheckoutHubPage({
    params
}: {
    params: { slug: string, tier: string }
}) {
    const { slug, tier } = params;

    // Fetch the project and its configurations
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
    });

    if (!project) return notFound();

    // 🧭 Strict Tier Resolution: Only honor the EXACT tier requested by the user
    // Using centralized getRawPhases to support both V1 and V2 (artifact-based) projects.
    const phases = getRawPhases(project);

    // Find the requested phase using the resilient matchPhase helper
    let activePhase = matchPhase(phases, tier);
    
    if (!activePhase) {
        console.log(`[CheckoutHub] No exact match for tier: "${tier}" in project: ${slug}. Available phases: ${phases.map((p: any) => p.name).join(', ')}`);
    }

    // 🛡️ Resilient Fallback: If 'standard' or 'default' requested but not found, 
    // we try to resolve to the FIRST active phase available in the project.
    // This handles cases where external projects haven't renamed their buttons.
    if (!activePhase && (tier === 'standard' || tier === 'default')) {
        console.log(`🧭 [CheckoutHub] Resilient fallback for "${tier}". Finding first active phase...`);
        activePhase = phases.find((p: Phase) => p.isActive !== false);
    }

    // NOTE: If the specific phase requested doesn't exist, we STILL proceed to the client.
    // This allows the CheckoutClient to show a branded 'Fase No Disponible' screen
    // rather than a generic 404, keeping the user in the funnel for the Fast Lane.

    // Pass data to the deep-styled client component
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            <CheckoutClient
                project={project}
                rawPhase={activePhase}
                tierName={tier}
            />
        </div>
    );
}
