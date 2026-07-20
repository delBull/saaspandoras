import { db } from '@/db';
import { projects, platformAssets, campaigns } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { resolveProjectSlug } from '@/lib/project-utils';
import { ProjectDomainAggregate } from './dto';

export class ProjectDomainService {
  /**
   * Constructs the full aggregate domain for a given project.
   * This is the ONLY entry point for retrieving project state.
   */
  static async buildProjectDomain(projectIdOrSlug: number | string): Promise<ProjectDomainAggregate> {
    let projectId: number;
    let projectTitle = '';
    let projectSlug = '';
    let projectConfig: any = null;
    let allowedDomains: any = null;
    let fullProject: any = null;

    if (typeof projectIdOrSlug === 'number' || !isNaN(Number(projectIdOrSlug))) {
      projectId = Number(projectIdOrSlug);
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });
      if (!project) throw new Error(`Project ${projectId} not found`);
      fullProject = project;
      projectTitle = project.title;
      projectSlug = project.slug;
      projectConfig = project.extraConfig;
      allowedDomains = project.allowedDomains;
    } else {
      const canonicalSlug = resolveProjectSlug(projectIdOrSlug);
      const project = await db.query.projects.findFirst({
        where: ilike(projects.slug, canonicalSlug)
      });
      if (!project) throw new Error(`Project slug ${canonicalSlug} not found`);
      
      fullProject = project;
      projectId = project.id;
      projectTitle = project.title;
      projectSlug = project.slug;
      projectConfig = project.extraConfig;
      allowedDomains = project.allowedDomains;
    }

    // Parallel fetch of all domain components
    // Sprint C: projectEvents migrated to platformAssets(type=event).
    const [allAssets, campaignsList] = await Promise.all([
      db.query.platformAssets.findMany({ 
        where: eq(platformAssets.projectId, projectId) 
      }),
      db.query.campaigns.findMany({ 
        where: eq(campaigns.projectId, projectId) 
      })
    ]);

    const resources = allAssets.filter(a => a.type !== 'project_event');
    const events = allAssets.filter(a => a.type === 'project_event');

    return {
      project: {
        ...fullProject, // Extends with all DB fields for backwards compatibility with legacy harmonizers
        id: projectId,
        title: projectTitle,
        slug: projectSlug,
        config: projectConfig,
        allowedDomains: allowedDomains
      },
      resources: resources as any[],
      events: events as any[],
      campaigns: campaignsList as any[]
    };
  }
}
