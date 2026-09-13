/**
 * 🛠️ Hermes OS — Governed Tool Gateway Execution Endpoint
 * apps/dashboard/src/app/api/hermes/tools/execute/route.ts
 *
 * Exposes the production HTTP gateway for executing governed tools
 * (Web Intelligence, SEO, GEO, MCP, Autonomous Research)
 * through HermesRuntime and ToolAuthorizationGate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { CognitiveContextBuilder } from '@/lib/pandoras/core/domains/hermes/addons/context-merger';
import { ToolAuthorizationRequest } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { organizationId, actorId, capabilityId, toolName, parameters, clearanceLevel } = body;

    if (!organizationId || !actorId || !capabilityId || !toolName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: organizationId, actorId, capabilityId, toolName',
        },
        { status: 400 }
      );
    }

    // 1. Resolve Canonical Tenant Authority (F6 Boundary)
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(organizationId);
    const canonicalTenantId = canonical?.canonicalOrgId || organizationId;

    // 2. Fetch Active Capabilities for this tenant/actor
    let activeCapabilities: any[] = [];
    try {
      const effectiveContext = await CognitiveContextBuilder.buildEffectiveContext(
        canonicalTenantId,
        actorId
      );
      activeCapabilities = effectiveContext.activeCapabilities || [];
    } catch (ctxErr) {
      console.warn('[ToolGateway API] Warning resolving effective capabilities:', ctxErr);
    }

    // 3. Dispatch through HermesRuntime Tool Gateway
    const runtime = getDefaultRuntime();
    const toolRequest: ToolAuthorizationRequest = {
      organizationId: canonicalTenantId,
      actorId,
      capabilityId,
      toolName,
      parameters,
      clearanceLevel,
    };

    const executionResult = await runtime.executeTool!(toolRequest, activeCapabilities);

    if (executionResult.unauthorized) {
      return NextResponse.json(
        {
          success: false,
          unauthorized: true,
          violationCode: executionResult.violationCode,
          reason: executionResult.reason,
        },
        { status: 403 }
      );
    }

    if (!executionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: executionResult.reason || 'Tool execution failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: executionResult.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown tool gateway error';
    console.error('[ToolGateway API] Execution error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
