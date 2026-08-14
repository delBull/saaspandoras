import { NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';
import { getDefaultRuntime, isHermesEnabled } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { RuntimeMessage, RuntimeStreamEvent } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';
import { DefaultOmnichannelGateway } from '@/lib/pandoras/core/domains/channels/omnichannel-gateway';

const omnichannelGateway = new DefaultOmnichannelGateway();

export async function POST(request: Request) {
  // G1 Kill Switch: HERMES_ENABLED=false disables all cognitive responses
  if (!isHermesEnabled()) {
    return NextResponse.json(
      { error: 'Hermes is currently unavailable.', code: 'HERMES_DISABLED' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { organizationSlug, content, clientMessageId } = body;

    if (!organizationSlug || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // K12-A57: resolvePortalContext is the single source of truth for identity
    const context = await resolvePortalContext(organizationSlug);
    const tenantId = context.organization.slug;

    // K12-A58: Only server can construct the ControlPlaneContext
    const cpCtx = new ControlPlaneContext(
      context.tenant.sessionId,
      context.tenant.actorId,
      context.tenant.role as any,
      context.tenant.permissions as any,
      [{ organizationId: context.tenant.organizationId, role: context.tenant.role as any }]
    );

    // K12-A60: Delegate Inbound transport through OmnichannelGateway
    const normalizedInbound = await omnichannelGateway.receive({
      channelType: 'portal',
      externalId: clientMessageId || `msg_${Date.now()}`,
      rawPayload: {
        content,
        clientMessageId
      }
    }, cpCtx);

    const runtime = getDefaultRuntime();

    const currentMsg: RuntimeMessage = {
      id: normalizedInbound.message.externalMessageId,
      role: 'USER',
      content: normalizedInbound.message.content,
      createdAt: normalizedInbound.receivedAt,
    };

    const abortController = new AbortController();
    const signal = request.signal; // Connect to the incoming request abort signal
    
    // K12-A66: Wire up abort signal
    signal.addEventListener('abort', () => {
      abortController.abort();
    });

    // Start the runtime stream
    const runtimeStream = await runtime.stream({
      organizationId: context.tenant.organizationId,
      conversationId: `portal_${context.tenant.organizationId}`,
      message: currentMsg,
      controlPlaneContext: {
        actorId: context.tenant.actorId,
        organizationId: context.tenant.organizationId,
        role: context.tenant.role as any,
        permissions: context.tenant.permissions as any,
        sessionId: context.tenant.sessionId,
      }
    }, { signal: abortController.signal });

    // SSE Stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        function emitEvent(event: string, data: any) {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }

        try {
          for await (const event of runtimeStream) {
            // K12-A62, K12-A63, K12-A64, K12-A65: Only governed events are forwarded.
            switch (event.type) {
              case 'START':
                emitEvent('stream.started', { streamId: event.responseId });
                break;
              case 'DELTA':
                emitEvent('response.delta', { streamId: 'stream', delta: event.content });
                break;
              case 'COMPLETE':
                emitEvent('response.completed', { streamId: event.responseId, responseId: event.responseId, traceId: event.trace?.id ?? 'trace_missing' });
                break;
              case 'BLOCKED':
                emitEvent('response.blocked', { streamId: 'stream', code: event.policyViolations?.[0]?.code ?? 'BLOCKED' });
                break;
              case 'ERROR':
                emitEvent('stream.error', { streamId: 'stream', code: event.error?.code ?? 'INTERNAL_ERROR' });
                break;
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            emitEvent('stream.cancelled', { streamId: 'stream' });
          } else {
            console.error('[Portal Streaming POST] Stream Error:', error);
            emitEvent('stream.error', { streamId: 'stream', code: 'INTERNAL_ERROR' });
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

  } catch (error: any) {
    console.error('[Portal Streaming POST] Initialization Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
