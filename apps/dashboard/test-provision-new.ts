import { provisionFullAccess } from '@/lib/admin/full-access-provision.service';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";

async function run() {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.slug, 'saaspandoras')).limit(1);
    if (!project) throw new Error("Project saaspandoras not found");
    const res = await provisionFullAccess('saaspandoras', 'marco@pandoras.finance');
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
