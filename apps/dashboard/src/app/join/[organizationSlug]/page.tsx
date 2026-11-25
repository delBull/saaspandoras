import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ATTRIBUTION_COOKIE, isValidAttributionCode, resolveAttributionSource } from '@/lib/growth/attribution';
import { JoinForm } from './JoinForm';

export const dynamic = 'force-dynamic';

/**
 * Captura pública por tenant (`/join/<organizationSlug>`).
 *
 * Es el punto medible de la estrategia: el visitante llega desde una publicación
 * (`/l/<code>` → cookie `nx_src`) y aquí deja sus datos **con consentimiento**.
 * El lead se crea por el endpoint canónico de Growth OS, así que queda en el
 * pipeline y en los reportes del portal, sin un almacén paralelo.
 *
 * Multi-tenant: el tenant se resuelve por slug en el servidor; nunca se confía en
 * un `tenantId` del cliente.
 */
export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<{ src?: string; email?: string }>;
}) {
  const { organizationSlug } = await params;
  const query = await searchParams;

  const [project] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      status: projects.status,
    })
    .from(projects)
    .where(eq(projects.slug, organizationSlug))
    .limit(1);

  if (!project || project.status === 'rejected') {
    notFound();
  }

  const cookieStore = await cookies();
  const attribution = resolveAttributionSource(
    query.src,
    cookieStore.get(ATTRIBUTION_COOKIE)?.value,
  );

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
          {project.title}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          Déjanos tus datos y te contactamos
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
          Un miembro del equipo te escribe para explicarte el modelo y resolver tus dudas.
          Sin compromiso y sin compartir tus datos con terceros.
        </p>

        <JoinForm
          organizationSlug={project.slug}
          attributionCode={attribution && isValidAttributionCode(attribution) ? attribution : null}
          initialEmail={typeof query.email === 'string' ? query.email.slice(0, 200) : ''}
        />

        <p className="mt-6 text-[10px] leading-relaxed text-zinc-600">
          Al enviar aceptas que el equipo de {project.title} te contacte por WhatsApp o email.
          Puedes pedir que eliminemos tus datos en cualquier momento escribiendo al equipo.
        </p>
      </div>
    </div>
  );
}
