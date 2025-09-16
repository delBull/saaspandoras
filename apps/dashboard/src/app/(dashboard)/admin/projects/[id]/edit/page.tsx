import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { MultiStepForm } from "./multi-step-form"; // CAMBIO: Importamos el componente correcto
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { getAuth } from "@/lib/auth";

interface EditProjectPageProps {
  params: { id: string };
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const resolvedParams = await params;
  const headersList = await headers();
  const { session } = await getAuth(headersList);
  const userIsAdmin = isAdmin(session?.userId);

  if (!userIsAdmin) {
    notFound();
  }

  let project = null;

  // Si no es "new", buscar el proyecto existente
  if (resolvedParams.id !== "new") {
    try {
      const projectId = parseInt(resolvedParams.id, 10);
      if (isNaN(projectId)) {
        notFound();
      }

      [project] = await db
        .select()
        .from(projectsSchema)
        .where(eq(projectsSchema.id, projectId))
        .limit(1);

      if (!project) {
        notFound();
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      notFound();
    }
  }

  return (
    // El layout ya está definido en MultiStepForm, así que no necesitamos wrappers adicionales.
    // Simplemente renderizamos el componente con las props correctas.
    <MultiStepForm
      project={project}
      isEdit={project !== null}
      // El endpoint para editar incluye el ID del proyecto
      apiEndpoint={
        project
          ? `/api/admin/projects/${project.id}`
          : "/api/admin/projects"
      }
      isPublic={false} // Indicamos que esta es la versión de admin
    />
  );
}