/**
 * ⚡ RUNPOD SERVERLESS EXECUTION SERVICE
 * apps/dashboard/src/lib/hermes/compute/runpod-serverless.service.ts
 *
 * Exclusively invokes RunPod Serverless Endpoints (/v2/{endpoint_id}/runsync).
 *
 * 🛡️ SCALE-TO-ZERO GUARANTEE:
 * Unlike dedicated always-on pods (which bill continuously 24/7), RunPod Serverless
 * containers only spin up during active execution and scale strictly to 0 when idle.
 * This guarantees zero standby cost and protects tenant balances from unexpected drain.
 */

export interface RunPodJobRequest {
  endpointId: string;
  input: Record<string, any>;
  perSecondCostUsd?: number;
  timeoutMs?: number;
}

export interface RunPodJobResult {
  success: boolean;
  jobId: string;
  executionTimeMs: number;
  rawCostUsd: number;
  output?: any;
  error?: string;
  isMock?: boolean;
}

export class RunPodServerlessService {
  private static readonly RUNPOD_BASE_URL = 'https://api.runpod.ai/v2';
  private static readonly DEFAULT_PER_SECOND_COST = 0.000350; // ~$0.021/min on RTX A4000 Serverless

  /**
   * Dispatches a synchronous job to a RunPod Serverless endpoint.
   * If RUNPOD_API_KEY is not configured or in sandbox simulation, runs with mock telemetry.
   */
  public static async executeSync(req: RunPodJobRequest): Promise<RunPodJobResult> {
    const apiKey = process.env.RUNPOD_API_KEY;
    const perSecondCost = req.perSecondCostUsd ?? this.DEFAULT_PER_SECOND_COST;

    if (!apiKey) {
      // 🧪 Dev / Sandbox simulated serverless execution
      const simStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate cold-start / GPU inference
      const executionTimeMs = Date.now() - simStart;
      const executionSeconds = executionTimeMs / 1000;
      const rawCostUsd = Number((executionSeconds * perSecondCost).toFixed(5));

      return {
        success: true,
        jobId: `mock_job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        executionTimeMs,
        rawCostUsd,
        output: {
          status: 'COMPLETED',
          images: ['mock_bafkrei_simulated_render_runpod'],
          message: 'Simulated RunPod Serverless Execution (Scale-to-zero active)',
        },
        isMock: true,
      };
    }

    const url = `${this.RUNPOD_BASE_URL}/${req.endpointId}/runsync`;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), req.timeoutMs || 45000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: req.input }),
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      const data = await response.json();
      const executionTimeMs = data.executionTimeMs || (Date.now() - startTime);
      const executionSeconds = executionTimeMs / 1000;
      const rawCostUsd = Number((executionSeconds * perSecondCost).toFixed(5));

      if (!response.ok || data.status === 'FAILED') {
        return {
          success: false,
          jobId: data.id || `failed_${Date.now()}`,
          executionTimeMs,
          rawCostUsd,
          error: data.error || `RunPod API responded with status ${response.status}`,
        };
      }

      return {
        success: true,
        jobId: data.id,
        executionTimeMs,
        rawCostUsd,
        output: data.output,
      };
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      const executionSeconds = executionTimeMs / 1000;
      return {
        success: false,
        jobId: `err_${Date.now()}`,
        executionTimeMs,
        rawCostUsd: Number((executionSeconds * perSecondCost).toFixed(5)),
        error: err.name === 'AbortError' ? 'RunPod execution timed out' : (err.message || 'RunPod connection failed'),
      };
    }
  }
}
