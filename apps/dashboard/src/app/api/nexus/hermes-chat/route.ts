/**
 * 🏛️ POST /api/nexus/hermes-chat
 * Operations Hub & Nexus Command Center — Sovereign Hermes Terminal Chat API
 *
 * Connected directly to Pandora's Sovereign HermesRuntime (fail-closed, zero hallucination).
 * Uses canonical tenant 'pandoras' and governs access via Disclosure Clearance Lattice.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';
import { getDefaultRuntime, isHermesEnabled } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import type { ControlPlaneContext } from '@/lib/pandoras/core/domains/hermes/knowledge/types';
import type { RuntimeMessage } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hermesGreeting(role: string, context?: any): string {
  const roleLabel =
    role === 'SUPER_ADMIN' ? 'Super Administrador (SUPER_ADMIN)' :
    role === 'ADMIN' ? 'Administrador (ADMIN)' :
    `Operador (${role})`;
  
  if (context && context.name) {
    return `Hermes OS Kernel · AI Operations Assistant\nUsuario verificado: ${context.name} (${roleLabel})\nEmail: ${context.email}\n— Hermes está en línea y sincronizado con el Sovereign Knowledge Vault. ¿En qué te puedo ayudar, ${context.name.split(' ')[0]}?`;
  }

  return `Hermes OS Kernel · AI Operations Assistant\nUsuario verificado: ${roleLabel}\n— Hermes está en línea y sincronizado con el Sovereign Knowledge Vault. ¿En qué te puedo ayudar?`;
}

export async function POST(req: NextRequest) {
  try {
    if (!isHermesEnabled()) {
      return NextResponse.json(
        { error: 'Hermes OS está temporalmente deshabilitado por Kill Switch.' },
        { status: 503 }
      );
    }

    const { getNexusAuthContext } = await import('@/lib/nexus/nexus-rbac');
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 403 });
    }

    const body = await req.json();
    const rawMessage: string = (body.message ?? '').trim();
    const isBootSequence: boolean = body.isBootSequence === true;
    // Hardened: Auth context is the primary authority. Client body CANNOT override role or identity.
    const authenticatedRole = (auth.role || 'VIEWER').toUpperCase().trim();
    const validatedRole = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_OPERATIONS', 'ADMIN_MARKETING', 'OPERATOR', 'MARKETING', 'VIEWER'].includes(authenticatedRole)
      ? authenticatedRole
      : 'VIEWER';

    const operatorContext = {
      id: auth.email || (auth.wallet ? `wallet_${auth.wallet.toLowerCase()}` : undefined),
      name: auth.name || body.operatorContext?.name || 'Operador Nexus',
      email: auth.email || undefined,
      role: validatedRole,
      whatsappPhone: auth.whatsappPhone || undefined,
      wallet: auth.wallet?.toLowerCase() || undefined,
      address: auth.wallet?.toLowerCase() || undefined,
    };

    if (isBootSequence) {
      return NextResponse.json({ reply: hermesGreeting(validatedRole, operatorContext) });
    }

    if (!rawMessage) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    if (rawMessage.toLowerCase() === 'sudo wakeup hermes') {
      const firstName = operatorContext?.name ? operatorContext.name.split(' ')[0] : 'Operador';
      return NextResponse.json({
        reply: `Hola ${firstName}. He iniciado la secuencia de despertar operativo. Sistemas en línea, protocolos de gobernanza listos y conexiones de infraestructura estables. ¿En qué cuadrante estratégico nos enfocamos hoy?`,
        source: 'SYSTEM'
      });
    }

    // Build Sovereign ControlPlaneContext with Universal Interlocutor Recognition
    const { InterlocutorResolver } = await import('@/lib/hermes/identity/interlocutor-resolver');
    const interlocutor = await InterlocutorResolver.resolve({
      channel: 'nexus',
      externalUserId: operatorContext?.id || operatorContext?.email,
      email: operatorContext?.email,
      nameHint: operatorContext?.name,
      walletAddress: operatorContext?.wallet || operatorContext?.address,
    });

    const isBoss = interlocutor.isBoss || validatedRole === 'SUPER_ADMIN';
    const effectiveName = interlocutor.name || operatorContext?.name || (isBoss ? 'Marco' : 'Operador');
    const actorId = interlocutor.actorId || operatorContext?.email || operatorContext?.id || `nexus_${validatedRole.toLowerCase()}`;

    const controlPlaneContext: ControlPlaneContext = {
      actorId,
      organizationId: 'pandoras',
      role: isBoss ? 'OWNER' : (validatedRole as any),
      permissions: [
        'knowledge.read',
        'runtime.respond',
        ...(isBoss || validatedRole === 'ADMIN' ? ['governance.admin', 'claims.verify', 'platform.decrees'] : []),
      ],
      identity: {
        userId: operatorContext?.id,
        identityId: actorId,
        name: effectiveName,
        isBoss,
        title: isBoss ? "Jefe / Fundador de Pandora's Growth OS" : `Operador Nexus (${validatedRole})`,
        executivePrivilege: isBoss,
      },
      interlocutor: {
        name: effectiveName,
        role: isBoss ? 'FOUNDER_BOSS' : validatedRole,
        actorId,
        isBoss,
        title: isBoss ? "Jefe / Fundador de Pandora's Growth OS" : `Operador Nexus (${validatedRole})`,
        executivePrivilege: isBoss,
      },
    };

    const runtimeMessage: RuntimeMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: 'USER',
      content: rawMessage,
      createdAt: new Date(),
    };

    const runtime = getDefaultRuntime();
    const conversationId = body.conversationId || `nexus_terminal_${actorId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const runtimeResponse = await runtime.respond({
      organizationId: 'pandoras',
      conversationId,
      message: runtimeMessage,
      controlPlaneContext,
    });

    return NextResponse.json({
      reply: runtimeResponse.content,
      source: 'SOVEREIGN_RUNTIME',
      traceId: runtimeResponse.trace?.runtimeId,
      suggestedActions: runtimeResponse.suggestedActions,
      provenanceReceipt: (runtimeResponse as any).provenanceReceipt,
    });
  } catch (error: any) {
    console.error('[Hermes Chat] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
