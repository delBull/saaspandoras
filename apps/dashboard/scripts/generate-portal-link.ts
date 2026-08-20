import { db } from '../src/db';
import { installedProducts, projects } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { generatePortalToken } from '../src/lib/platform/portal-auth';

async function main() {
  const slug = process.argv[2] || 'snarai';
  
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
  if (!project) {
    console.error(`Project ${slug} not found`);
    process.exit(1);
  }

  const [pack] = await db.select().from(installedProducts).where(eq(installedProducts.projectId, project.id));
  if (!pack) {
    console.error(`No installed products for ${slug}`);
    process.exit(1);
  }

  const token = generatePortalToken(pack.id, project.id, pack.product);
  
  console.log(`\nMagic Link for ${project.title} (${slug}):`);
  console.log(`http://localhost:3000/portal/login?token=${token}&return=/onboarding/${slug}\n`);
  process.exit(0);
}

main().catch(console.error);
