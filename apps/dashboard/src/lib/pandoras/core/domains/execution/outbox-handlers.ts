import { OutboxEvent } from '~/lib/outbox/repository';
import { DispatchRequest } from './contracts/execution-contracts';
import { ExecutionOS } from './execution-os';
import { db } from '~/db';

export class ExecutionBridgeHandlers {
  constructor(private executionOS: ExecutionOS) {}

  /**
   * Maneja el evento de intención aprobada.
   * Transforma el evento Outbox en un DispatchRequest.
   */
  async handleOperationalIntentApproved(event: OutboxEvent): Promise<void> {
    // 1. Validate payload
    const payload = event.payload as any;
    const governanceEvent = payload.event;
    
    if (!governanceEvent || !governanceEvent.intentId || !governanceEvent.organizationId) {
      throw new Error(`[ExecutionBridge] Invalid payload for OPERATIONAL_INTENT_APPROVED: missing required fields. Event ID: ${event.id}`);
    }

    const { intentId, organizationId } = governanceEvent;
    let { missionId } = governanceEvent;

    let intentType = 'UNKNOWN_CAPABILITY';

    let intentConstraints: any[] = [];

    if (!missionId || missionId === 'unknown_mission_id_for_now') {
      const intentRecord = await db.query.operationalIntents.findFirst({
        where: (intents, { eq }) => eq(intents.id, intentId),
        columns: { missionId: true, intentType: true, constraints: true }
      });
      missionId = intentRecord?.missionId || 'unknown_mission';
      intentType = intentRecord?.intentType || 'UNKNOWN_CAPABILITY';
      intentConstraints = (intentRecord?.constraints as any[]) || [];
    } else {
      const intentRecord = await db.query.operationalIntents.findFirst({
        where: (intents, { eq }) => eq(intents.id, intentId),
        columns: { intentType: true, constraints: true }
      });
      intentType = intentRecord?.intentType || 'UNKNOWN_CAPABILITY';
      intentConstraints = (intentRecord?.constraints as any[]) || [];
    }
    
    // Map capability ID and version
    let capabilityId = intentType;
    let version = 'v1';
    
    if (intentType === 'SEND_TELEGRAM_MESSAGE') {
      capabilityId = 'SEND_TELEGRAM_NOTIFICATION';
      version = '1.0.0';
    }

    // Build input from governance payload + intent constraints
    const inputPayload = { ...(governanceEvent.payload || {}) };
    for (const constraint of intentConstraints) {
      if (constraint.type === 'chatId' || constraint.type === 'message') {
        inputPayload[constraint.type] = constraint.value;
      }
    }
    
    const request: DispatchRequest = {
      capabilityId,
      version,
      input: inputPayload,
      context: {
        organizationId,
        actorId: governanceEvent.actorId || 'system',
        missionId,
        intentId,
        correlationId: governanceEvent.correlationId || event.id,
        idempotencyKey: event.id // Usamos el ID del evento de outbox como clave de idempotencia
      }
    };

    // 2. Delegate to Execution OS
    const result = await this.executionOS.execute(request);

    // 3. Si falla y es reintentable o desconocido, lanzar error para que el outbox retry haga su trabajo
    if (result.status === 'failed') {
      throw new Error(`[ExecutionBridge] Capability execution failed: ${result.error.category} - ${result.error.message}`);
    }
  }
}
