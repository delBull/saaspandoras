import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { MultiStepForm } from "./multi-step-form";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, getAuth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  // ✅ En Next 15 params es una Promise
  const { id } = await params;

  const headersList = await headers();
  const { session } = await getAuth(headersList);

  if (!isAdmin(session?.userId)) {
    notFound();
  }

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
