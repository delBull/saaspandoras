import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, getAuth } from "@/lib/auth";
import { MultiStepForm } from "./multi-step-form";

// Properly type the async params for Next.js 15
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const headersList = await headers();
  const { session } = getAuth(headersList);

  if (!await isAdmin(session?.userId)) notFound();

  let project = null;
  if (id !== "new") {
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) notFound();

    [project] = await db
      .select()
      .from(projectsSchema)
      .where(eq(projectsSchema.id, projectId))
      .limit(1);

    if (!project) notFound();
  }

  return (
    <MultiStepForm
      project={project}
      isEdit={!!project}
      apiEndpoint={project ? `/api/admin/projects/${project.id}` : "/api/admin/projects"}
      isPublic={false}
    />
  );
}