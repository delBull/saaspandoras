import { notFound } from "next/navigation";
import { db } from "@saasfly/db-core";
import { projects as projectsSchema } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { getNexusAuthContext } from "@saasfly/shared";
import { AdminAccessGate } from "../../../AdminAccessGate";
import { ProvisioningConsoleClient } from "./ProvisioningConsoleClient";

export const dynamic = 'force-dynamic';

export default async function ProvisioningPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const reqHeaders = await import("next/headers").then(m => m.headers());
  const auth = await getNexusAuthContext(reqHeaders);

  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
    return <AdminAccessGate reason="Se requiere rol de administrador para aprovisionar tenants en la red Hermes." />;
  }

  const result = await db
    .select()
    .from(projectsSchema)
    .where(eq(projectsSchema.slug, slug))
    .limit(1);

  const project = result[0];
  if (!project) {
    notFound();
  }

  return <ProvisioningConsoleClient project={project} />;
}
