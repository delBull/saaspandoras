import { NextResponse } from "next/server";
import { ProjectDomainService } from "@/lib/domain/project-domain-service";

/**
 * GET /api/v1/projects/[projectId]/resources
 * Public/Internal endpoint to fetch project resources (like Events, Podcasts, Decks).
 * S'Narai Portal uses this to populate its calendar and library.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const visibility = searchParams.get('visibility');
        
        const domainAggregate = await ProjectDomainService.buildProjectDomain(projectId);
        
        let resources = domainAggregate.resources;
        
        // At this stage, platform_assets might not be fully migrated for events,
        // but resources API currently fetches platformAssets.
        // We filter the aggregate resources.
        
        if (type) resources = resources.filter(r => r.type === type);
        if (visibility) resources = resources.filter(r => r.visibility === visibility);
        // We only show active resources
        resources = resources.filter(r => (r as any).status === 'active' || r.visibility === 'public'); // Default status check

        // Sort desc by createdAt
        resources = resources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const formattedResources = resources.map(res => ({
            id: res.id,
            type: res.type,
            title: res.title,
            description: res.description,
            tags: res.tags,
            url: (res as any).url,
            thumbnailUrl: (res as any).thumbnailUrl,
            version: (res as any).version,
            visibility: res.visibility,
            eventConfig: (res.metadata?.event) || (res as any).eventConfig || null,
            metrics: {
                views: (res as any).views || 0,
                clicks: (res as any).clicks || 0,
                conversions: (res as any).conversions || 0
            },
            createdAt: res.createdAt
        }));

        const lifecycle = searchParams.get('lifecycle');
        let finalResults = formattedResources;
        
        if (lifecycle && type === 'project_event') {
            finalResults = finalResults.filter(r => 
                r.eventConfig && (r.eventConfig as any).lifecycle === lifecycle
            );
        }

        return NextResponse.json({
            success: true,
            project: { id: domainAggregate.project.id, slug: domainAggregate.project.slug },
            resources: finalResults
        });

    } catch (error: any) {
        console.error("GET Project Resources Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
