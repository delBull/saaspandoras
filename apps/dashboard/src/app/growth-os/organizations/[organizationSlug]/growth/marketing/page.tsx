import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export const dynamic = 'force-dynamic';

/**
 * Growth · Campañas (vista del tenant).
 *
 * Antes montaba `MarketingDashboard`, que es el panel del **operador de
 * plataforma**: su server action exige wallet admin (`isAdmin(session.address)`),
 * y además `marketing_campaigns` no está separado por organización. En el portal
 * de un tenant eso no puede funcionar —de hecho lanzaba una excepción de servidor—
 * y, si se autorizara, mostraría datos de la plataforma.
 *
 * Así que aquí se ofrece lo que sí es del tenant: su email marketing y su
 * pipeline. La vista de campañas globales sigue viviendo en /admin/marketing.
 */
export default async function TenantMarketingPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;

  try {
    await resolvePortalContext(organizationSlug);
  } catch (err: any) {
    const code = err?.code;
    if (code === 'NO_SESSION' || code === 'INVALID_SESSION') {
      redirect(`/portal/login?return=/growth-os/organizations/${organizationSlug}/growth/marketing`);
    }
    redirect(`/portal/unauthorized?reason=${encodeURIComponent(code ?? 'UNKNOWN')}`);
  }

  const sections = [
    {
      href: `/growth-os/organizations/${organizationSlug}/email`,
      title: 'Email Marketing',
      description: 'Campañas de email del tenant: crear, revisar y programar (requiere aprobación).',
    },
    {
      href: `/growth-os/organizations/${organizationSlug}/pipeline`,
      title: 'Pipeline & CRM',
      description: 'Prospectos, etapa y valor estimado. Ahí se registra un lead manual.',
    },
    {
      href: `/growth-os/organizations/${organizationSlug}/approvals`,
      title: 'Aprobaciones',
      description: 'Lo que el equipo propone y espera tu autorización para publicarse.',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Growth · Campañas</h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Tu espacio de crecimiento: campañas de email, prospectos y lo que espera aprobación.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            <p className="text-sm font-semibold text-white">{section.title}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">{section.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Nota operativa</p>
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-zinc-400">
          El panel de campañas globales (ejecuciones, disparadores y métricas de plataforma) es del
          operador y vive en el área de administración. En tu espacio no se muestra: sus datos no
          están separados por organización y verlos aquí mezclaría información de otros tenants.
        </p>
      </div>
    </div>
  );
}
