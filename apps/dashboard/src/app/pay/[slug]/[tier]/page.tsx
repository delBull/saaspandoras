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
      with: {
        utilityContract: true
      }
    });

    if (!project) return notFound();

    // Map tier name to a specific phase, or get the active phase
    const w2eConfig = project.w2eConfig as any;
    const phases = w2eConfig?.phases || [];
    let activePhase = phases.find((p: any) => p.name.toLowerCase() === tier.toLowerCase());
    
    if (!activePhase) {
        activePhase = phases.find((p: any) => p.isActive);
    }
    
    if (!activePhase) {
        // Fallback mock phase if none is found to allow compilation/development
        activePhase = {
            id: 'default',
            name: tier,
            isActive: true,
            tokenPrice: 50,
            stats: { remainingTokens: 1000, velocity: '+5' }
        };
    }

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
