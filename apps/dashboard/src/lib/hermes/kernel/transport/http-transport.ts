import { ExecutionRequest, ExecutionResult, ServiceProvider } from '../../contracts/universal';
import { TransportLayer } from './transport-layer';
import { Scheduler } from '../scheduler/scheduler';
import crypto from 'crypto';

export class HttpTransport implements TransportLayer {
  
  public async execute(provider: ServiceProvider, request: ExecutionRequest): Promise<ExecutionResult> {
    if (!provider.endpoint) {
      throw new Error(`[HttpTransport] Provider ${provider.id} has no endpoint configured.`);
    }

    console.log(`[HttpTransport] Sending POST to ${provider.endpoint}/execute`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), request.timeoutMs || 30000);

      // Inject robust callback parameters for async capabilities (e.g. Media Co)
      const callbackSecret = crypto.randomBytes(16).toString('hex');
      const signature = crypto.createHmac('sha256', callbackSecret).update(request.executionId).digest('hex');

      // Persist HMAC secret to allow verification when the callback arrives
      await Scheduler.setCallbackData(request.executionId, provider.id, callbackSecret);
      
      const payload: ExecutionRequest = {
        ...request,
        callback: {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://staging.dash.pandoras.finance'}/api/v1/hermes/webhook/${provider.id}/callback`,
          secret: callbackSecret,
          signature: signature,
          retryPolicy: 'exponential',
          expiresAt: new Date(Date.now() + 3600000) // 1 hour
        }
      };

      const response = await fetch(`${provider.endpoint}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': provider.authentication?.type === 'bearer' 
              ? `Bearer ${provider.authentication.token}` 
              : `ApiKey ${provider.authentication?.token || ''}`,
          'X-Hermes-Request-Id': request.requestId,
          'X-Hermes-Tenant-Id': request.tenantId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        status: result.status || 'completed',
        artifacts: result.artifacts || [],
        telemetry: { ...result.telemetry, httpStatus: response.status }
      };

    } catch (error: any) {
      console.error(`[HttpTransport] Failed for ${provider.id}:`, error);
      return {
        status: 'failed',
        telemetry: { error: error.message }
      };
    }
  }
}
