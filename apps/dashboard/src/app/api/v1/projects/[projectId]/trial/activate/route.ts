import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects, installedProducts } from '@saasfly/db/schema';
import { eq, or } from '@saasfly/db-core';
import { getAuth, isAdmin } from '@saasfly/auth-sdk';
import { validatePortalSession, OrganizationSDK, setupProgressService } from '@saasfly/shared';
import type { ProductKey } from '@saasfly/shared';
import { HermesTrialTimelineService } from '@saasfly/hermes-core';

export const dynamic = 'force-dynamic';

/**
 * ⚡ POST /api/v1/projects/[slug]/trial/activate
 *
 * Manual Trial Activation Endpoint.
 * - Starts the 72h (3-day) countdown ONLY when explicitly invoked by an authorized tenant actor.
 * - Enforces that readiness requirements are met (information injected without financial cost).
 * - Transitions trialStatus from 'PENDING_ACTIVATION' | 'READY_TO_ACTIVATE' -> 'ACTIVE'.
 * - Sets trialStartedAt = now, trialEndsAt = now + 72 hours.
 * - Sets installed_products to 'active'.
 * - Records an immutable trial activation event in the Sovereign Trial Timeline.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ ok: false, errorCode: 'PROJECT_ID_REQUIRED', message: 'Identificador de proyecto o slug requerido.' }, { status: 400 });
    }

    const cleanSlug = projectId.toLowerCase().trim();

    // 1. Authorize Caller: Portal Session OR Web Wallet / Admin
    let isAuthorized = false;
    let actorIdentity = 'unknown';

    // A. Check Portal Session
    const portalCookie = req.cookies.get('pandoras_portal_session')?.value;
    const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    const portalToken = portalCookie ?? authHeader;

    if (portalToken) {
      try {
        const session = await validatePortalSession(portalToken);
        if (session) {
          const org = await OrganizationSDK.resolve(session.projectId, session.product as ProductKey);
          if (org && (org.slug === cleanSlug || org.organizationId === cleanSlug)) {
            isAuthorized = true;
            actorIdentity = `portal_session:${session.installedProductId}`;
          }
        }
      } catch {
        // Fallback to wallet auth
      }
    }

    // B. Check Web Wallet / Superadmin
    if (!isAuthorized) {
      const auth = await getAuth(req.headers);
      const sessionWallet = typeof auth.session?.address === 'string' ? auth.session.address.toLowerCase() : null;
      const headerWalletRaw = req.headers.get('x-wallet-address') ?? req.headers.get('x-thirdweb-address');
      const headerWallet = typeof headerWalletRaw === 'string' ? headerWalletRaw.toLowerCase() : null;

      const callerWallet = sessionWallet ?? (auth.isVerified ? headerWallet : null);

      if (callerWallet) {
        const userIsAdmin = await isAdmin(callerWallet);
        if (userIsAdmin) {
          isAuthorized = true;
          actorIdentity = `admin:${callerWallet}`;
        } else {
          const [projectRow] = await db
            .select({ applicantWalletAddress: projects.applicantWalletAddress })
            .from(projects)
            .where(eq(projects.slug, cleanSlug))
            .limit(1);

          const projectWallet = typeof projectRow?.applicantWalletAddress === 'string' ? projectRow.applicantWalletAddress.toLowerCase() : null;
          if (projectWallet && projectWallet === callerWallet) {
            isAuthorized = true;
            actorIdentity = `wallet:${callerWallet}`;
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { ok: false, errorCode: 'UNAUTHORIZED', message: 'No tienes autorización para activar la prueba de esta organización.' },
        { status: 403 }
      );
    }

    // 2. Fetch Project Record
    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, cleanSlug.toUpperCase())))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { ok: false, errorCode: 'PROJECT_NOT_FOUND', message: `Proyecto '${cleanSlug}' no encontrado.` },
        { status: 404 }
      );
    }

    // 3. Verify Trial State
    const currentStatus = project.trialStatus ?? (project.tenantType === 'TRIAL' ? 'PENDING_ACTIVATION' : 'ACTIVE');

    if (project.tenantType !== 'TRIAL') {
      return NextResponse.json({
        ok: true,
        message: 'Esta organización opera bajo licencia de Producción institucional.',
        trialStatus: 'PRODUCTION',
        isTrial: false,
      });
    }

    if (currentStatus === 'ACTIVE' && project.trialStartedAt && project.trialEndsAt) {
      const nowMs = Date.now();
      const endsMs = new Date(project.trialEndsAt).getTime();
      if (endsMs > nowMs) {
        return NextResponse.json({
          ok: true,
          message: 'La prueba gratuita de 3 días ya se encuentra activa y en curso.',
          trialStatus: 'ACTIVE',
          trialStartedAt: project.trialStartedAt,
          trialEndsAt: project.trialEndsAt,
          remainingMs: endsMs - nowMs,
        });
      }
    }

    // 4. Verify Readiness Gate (Knowledge & Config Progress)
    const setupState = await setupProgressService.getEcosystemSetupState(cleanSlug);
    if (!setupState.isReadyToActivate && setupState.overallPercentage < 25) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: 'READINESS_INSUFFICIENT',
          message: 'Para activar tu prueba gratuita de 3 días necesitas cargar al menos un documento institucional en Hermes, registrar prospectos en Growth OS o configurar tus datos iniciales sin costo.',
          overallPercentage: setupState.overallPercentage,
          modules: setupState.modules.map(m => ({
            productKey: m.productKey,
            isReady: m.isReadyToActivate,
            progress: m.progressPercentage,
          })),
        },
        { status: 400 }
      );
    }

    // 5. Activate Trial: Start the 72-Hour Clock
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + 72 * 60 * 60 * 1000); // Exactly 72 hours (3 days)

    await db
      .update(projects)
      .set({
        trialStatus: 'ACTIVE',
        trialStartedAt,
        trialEndsAt,
        updatedAt: trialStartedAt,
      })
      .where(eq(projects.id, project.id));

    // Update installed products to active
    await db
      .update(installedProducts)
      .set({
        status: 'active',
        updatedAt: trialStartedAt,
      })
      .where(eq(installedProducts.projectId, project.id));

    // 6. Record Immutable Trial Timeline Event
    try {
      await HermesTrialTimelineService.recordEvent(
        cleanSlug,
        'TRIAL_STARTED',
        {
          actorId: actorIdentity,
          metadata: {
            activatedAt: trialStartedAt.toISOString(),
            endsAt: trialEndsAt.toISOString(),
            durationHours: 72,
            readinessPercentage: setupState.overallPercentage,
          },
        }
      );
    } catch (timelineErr) {
      console.warn('[TrialActivation] Timeline recording notice:', timelineErr);
    }

    return NextResponse.json({
      ok: true,
      message: '¡Prueba gratuita de 3 días activada exitosamente! Tu periodo de 72 horas ha comenzado.',
      trialStatus: 'ACTIVE',
      trialStartedAt,
      trialEndsAt,
      durationHours: 72,
      remainingMs: 72 * 60 * 60 * 1000,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API Trial Activation] Error:', err);
    return NextResponse.json(
      { ok: false, errorCode: 'INTERNAL_ERROR', message: errorMsg },
      { status: 500 }
    );
  }
}
