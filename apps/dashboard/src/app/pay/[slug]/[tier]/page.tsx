import { notFound } from 'next/navigation';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import CheckoutClient from './CheckoutClient';

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
    // This prevents falling back to random active phases when a specific tier is targeted.
    const w2eConfig = project.w2eConfig as any;
    const phases = w2eConfig?.phases || [];
    
    // Find the requested phase by name (case-insensitive)
    const activePhase = phases.find((p: any) => p.name.toLowerCase() === tier.toLowerCase());

    // If the specific phase requested doesn't exist, we don't fall back, we 404
    if (!activePhase) return notFound();

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
