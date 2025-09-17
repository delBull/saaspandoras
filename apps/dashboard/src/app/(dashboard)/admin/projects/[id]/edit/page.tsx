import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, getAuth } from "@/lib/auth";
import { MultiStepForm } from "./multi-step-form";

// NO tipamos los props; Next los infiere automáticamente
export default async function ProjectPage({ params }: any) {
  const { id } = params; // Next infiere correctamente string

  const headersList = await headers();
  const { session } = await getAuth(headersList);

  if (!isAdmin(session?.userId)) notFound();

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