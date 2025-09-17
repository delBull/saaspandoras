import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, getAuth } from "@/lib/auth";
import { MultiStepForm } from "./multi-step-form";

// Definimos la interface de params inline
interface ProjectPageProps {
  params: { slug: string }; // o id si tu ruta usa [id]
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = params;

  const headersList = await headers();
  const { session } = await getAuth(headersList);

  if (!isAdmin(session?.userId)) notFound();

  let project = null;
  if (slug !== "new") {
    const [row] = await db
      .select()
      .from(projectsSchema)
      .where(eq(projectsSchema.slug, slug))
      .limit(1);
    project = row;
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