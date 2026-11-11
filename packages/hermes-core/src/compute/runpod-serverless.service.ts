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
  errorCode?: string;
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
      if (process.env.NODE_ENV === 'production' && !process.env.RUNPOD_ALLOW_MOCK_IN_PRODUCTION) {
        throw new Error('[RunPodServerless] RUNPOD_API_KEY is missing in production. Refusing simulated mock GPU execution.');
      }
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

    // ── Encolar + sondear ────────────────────────────────────────────────────
    // Antes: `/runsync` con 35 s. Con modelos de imagen (~20 s) y cold start de
    // varios minutos, eso abortaba y se perdía el id del job. Ahora se encola
    // (`/run`), se conserva el id y se sondea hasta agotar el presupuesto.
    const base = `${this.RUNPOD_BASE_URL}/${req.endpointId}`;
    const budgetMs = Number(req.timeoutMs || process.env.RUNPOD_JOB_BUDGET_MS || 120000);
    const startTime = Date.now();
    const elapsed = () => Date.now() - startTime;
    const cost = (ms: number) => Number(((ms / 1000) * perSecondCost).toFixed(5));

    let runpodJobId: string | undefined;

    try {
      const enqueueController = new AbortController();
      const enqueueTimer = setTimeout(() => enqueueController.abort(), 20000);

      const response = await fetch(`${base}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: req.input }),
        signal: enqueueController.signal,
      });

      clearTimeout(enqueueTimer);

      if (!response.ok) {
        return {
          success: false,
          jobId: `failed_${Date.now()}`,
          executionTimeMs: elapsed(),
          rawCostUsd: cost(elapsed()),
          error: `RunPod enqueue failed with status ${response.status}`,
          errorCode: 'RUNPOD_ENQUEUE_FAILED',
        };
      }

      const enqueued = (await response.json()) as { id?: string };
      runpodJobId = enqueued.id;
      if (!runpodJobId) {
        return {
          success: false,
          jobId: `failed_${Date.now()}`,
          executionTimeMs: elapsed(),
          rawCostUsd: cost(elapsed()),
          error: 'RunPod did not return a job id',
          errorCode: 'RUNPOD_ENQUEUE_FAILED',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        jobId: `err_${Date.now()}`,
        executionTimeMs: elapsed(),
        rawCostUsd: cost(elapsed()),
        error: err?.name === 'AbortError' ? 'RunPod enqueue timed out' : (err?.message || 'RunPod connection failed'),
        errorCode: 'RUNPOD_CONNECTION_FAILED',
      };
    }

    let delayMs = 1500;
    while (elapsed() < budgetMs) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(Math.round(delayMs * 1.4), 5000);

      const status = await this.checkJobStatus(req.endpointId, runpodJobId);

      if (status.status === 'COMPLETED') {
        return {
          success: true,
          jobId: runpodJobId,
          executionTimeMs: status.executionTimeMs ?? elapsed(),
          rawCostUsd: status.rawCostUsd ?? cost(elapsed()),
          output: status.output,
        };
      }

      if (status.status === 'FAILED' || status.status === 'NOT_FOUND') {
        return {
          success: false,
          jobId: runpodJobId,
          executionTimeMs: elapsed(),
          rawCostUsd: cost(elapsed()),
          error: status.error || `RunPod job ${status.status.toLowerCase()}`,
          errorCode: 'RUNPOD_JOB_FAILED',
        };
      }
    }

    // Presupuesto agotado: el job puede seguir corriendo en RunPod (se cobra).
    // Se devuelve el id para poder consultarlo, sin fingir éxito.
    return {
      success: false,
      jobId: runpodJobId,
      executionTimeMs: elapsed(),
      rawCostUsd: cost(elapsed()),
      error: `RunPod job ${runpodJobId} did not finish within ${budgetMs}ms (cold start or slow model). Check /status/${runpodJobId}.`,
      errorCode: 'RUNPOD_JOB_BUDGET_EXCEEDED',
    };
  }

  /**
   * F6-3: Queries the status of a previous RunPod serverless execution for forensic reconciliation.
   */
  public static async checkJobStatus(endpointId: string, jobId: string): Promise<{
    status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'NOT_FOUND' | 'UNKNOWN';
    output?: any;
    error?: string;
    executionTimeMs?: number;
    rawCostUsd?: number;
  }> {
    const apiKey = process.env.RUNPOD_API_KEY;

    if (!apiKey) {
      if (jobId.startsWith('mock_job_')) {
        return {
          status: 'COMPLETED',
          output: {
            images: ['mock_bafkrei_simulated_render_runpod'],
            message: 'Simulated RunPod execution completed',
          },
          executionTimeMs: 1200,
          rawCostUsd: 0.02,
        };
      }
      return { status: 'NOT_FOUND' };
    }

    const url = `${this.RUNPOD_BASE_URL}/${endpointId}/status/${jobId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.status === 404) {
        return { status: 'NOT_FOUND' };
      }

      if (!response.ok) {
        return { status: 'UNKNOWN', error: `RunPod status HTTP ${response.status}` };
      }

      const data = await response.json();
      if (data.status === 'COMPLETED') {
        const executionTimeMs = data.executionTimeMs || 1000;
        const rawCostUsd = Number(((executionTimeMs / 1000) * this.DEFAULT_PER_SECOND_COST).toFixed(5));
        return {
          status: 'COMPLETED',
          output: data.output,
          executionTimeMs,
          rawCostUsd,
        };
      }

      if (data.status === 'FAILED' || data.status === 'CANCELLED') {
        return { status: 'FAILED', error: data.error || 'RunPod job marked failed' };
      }

      if (data.status === 'IN_QUEUE' || data.status === 'IN_PROGRESS') {
        return { status: 'IN_PROGRESS' };
      }

      return { status: 'UNKNOWN' };
    } catch (err: any) {
      return { status: 'UNKNOWN', error: err.message || 'Network error querying RunPod status' };
    }
  }
}

