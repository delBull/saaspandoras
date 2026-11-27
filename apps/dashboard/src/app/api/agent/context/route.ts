import { NextResponse } from 'next/server';
import { resolveAgentContext } from '@/lib/nexus/agent-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * `GET /api/agent/context`
 *
 * Primera pieza de la superficie operativa del agente (ADR-021 fase 3). Con su
 * clave, la IA de un colaborador pregunta quién es, qué puede hacer y sobre qué
 * recursos — sin adivinar y sin recibir nada que no le corresponda.
 *
 * La autenticación es por clave de agente (`Authorization: Bearer nxk_...`); si
 * la clave está vencida, revocada o su delegación no está activa, responde 401.
 */
export async function GET(req: Request) {
  const context = await resolveAgentContext(req.headers);
  if (!context) {
    return NextResponse.json(
      { ok: false, error: 'AGENT_UNAUTHORIZED', hint: 'Clave inválida, vencida o sin delegación activa.' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    agent: {
      keyId: context.agentKeyId,
      label: context.label,
      delegationId: context.delegationId,
    },
    identity: {
      collaboratorId: context.collaboratorId,
      canonicalOrgId: context.canonicalOrgId,
    },
    capabilities: context.capabilities,
    scope: context.scope,
    limits: context.limits,
    rules: [
      'Actúas en nombre del colaborador: no tienes más permisos que él.',
      'Sólo puedes operar los recursos listados en scope.',
      'Las acciones sensibles requieren confirmación humana.',
      'Toda acción queda auditada con tu keyId.',
    ],
  });
}
