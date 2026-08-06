import { db } from '../src/db';
import { projectBriefings } from '../src/db/schema';
import { snaraiMaterials } from '../src/lib/marketing/snarai-materials';
import { eq, and } from 'drizzle-orm';

async function updateDB() {
  const projectId = 2; // S'Narai

  console.log('Updating S\'Narai project briefings in DB...');

  for (const mat of snaraiMaterials) {
    if (['legal-structure', 'investment-deck', 'executive-investment-brief', 'smart-contract-audit'].includes(mat.id)) {
      await db.update(projectBriefings)
        .set({
          title: mat.title,
        })
        .where(
          and(
            eq(projectBriefings.projectId, projectId),
            eq(projectBriefings.slug, mat.id)
          )
        );
      console.log(`Updated ${mat.id} in DB (only title — objective/description/contentPreview have no column on project_briefings)`);
    }
  }
  
  console.log('All done!');
  process.exit(0);
}

updateDB().catch(console.error);
