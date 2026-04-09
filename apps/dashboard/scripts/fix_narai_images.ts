import { db } from "../src/db";
import { projects } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function fixNaraiImages() {
  try {
    console.log("Fixing Narai image URLs to prevent ERR_NAME_NOT_RESOLVED...");
    
    // Setting to explicit absolute or valid internal paths. Or simply null to trigger safe fallbacks.
    const result = await db.update(projects)
      .set({ 
        logoUrl: '/images/default-logo.jpg',
        coverPhotoUrl: '/images/default-project.jpg',
      })
      .where(eq(projects.slug, 'narai'))
      .returning();

    console.log("Updated project successfully:", result.length > 0 ? result[0].slug : "Not found");
  } catch (error) {
    console.error("Error updating DB:", error);
  } finally {
    process.exit(0);
  }
}

fixNaraiImages();
