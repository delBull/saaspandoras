// ──────────────────────────────────────────────────────────────────────────────
// G1 + G2: Production Health Check Endpoint
//
// GET /api/health/hermes
//
// Returns the operational status of every Hermes subsystem.
// Used for:
//   - T-24h infrastructure verification
//   - T-0 readiness gate
//   - Monitoring / alerting
//   - Kill switch status
//
// Security: Never exposes credentials, system prompts, tenant data, or traces.
// ──────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface SubsystemStatus {
  status: 'online' | 'offline' | 'degraded' | 'disabled';
  latencyMs?: number;
  detail?: string;
}

interface HermesHealthReport {
  timestamp: string;
  env: string;
  hermesEnabled: boolean;
  overall: 'healthy' | 'degraded' | 'unavailable';
  subsystems: {
    runtime: SubsystemStatus;
    provider: SubsystemStatus;
    database: SubsystemStatus;
    memory: SubsystemStatus;
    policy: SubsystemStatus;
    trace: SubsystemStatus;
    streaming: SubsystemStatus;
  };
}

async function checkDatabase(): Promise<SubsystemStatus> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'online', latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: 'offline', detail: err.message };
  }
}

async function checkOllama(): Promise<SubsystemStatus> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';
  const start = Date.now();

  const providerType = process.env.HERMES_REASONING_PROVIDER;

  // Mock provider: always online
  if (!providerType || providerType === 'mock') {
    return { status: 'online', detail: 'mock', latencyMs: 0 };
  }

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return { status: 'offline', detail: `HTTP ${response.status}`, latencyMs: Date.now() - start };
    }

    const data = await response.json();
    const models: string[] = (data.models ?? []).map((m: any) => m.name as string);
    const modelLoaded = models.some((m) => m.startsWith(model.split(':')[0] || ''));

    return {
      status: modelLoaded ? 'online' : 'degraded',
      latencyMs: Date.now() - start,
      detail: modelLoaded ? model : `Model '${model}' not found. Available: ${models.slice(0, 3).join(', ')}`,
    };
  } catch (err: any) {
    return { status: 'offline', detail: err.message, latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const hermesEnabled = process.env.HERMES_ENABLED !== 'false';

  if (!hermesEnabled) {
    const report: HermesHealthReport = {
      timestamp: new Date().toISOString(),
      env: process.env.HERMES_ENV || 'development',
      hermesEnabled: false,
      overall: 'unavailable',
      subsystems: {
        runtime:   { status: 'disabled' },
        provider:  { status: 'disabled' },
        database:  { status: 'disabled' },
        memory:    { status: 'disabled' },
        policy:    { status: 'disabled' },
        trace:     { status: 'disabled' },
        streaming: { status: 'disabled' },
      },
    };
    return NextResponse.json(report, { status: 503 });
  }

  // Run subsystem checks in parallel
  const [database, provider] = await Promise.all([
    checkDatabase(),
    checkOllama(),
  ]);

  // Runtime is online if DB is accessible (memory/trace both need DB)
  const runtimeStatus: SubsystemStatus = database.status === 'online'
    ? { status: 'online' }
    : { status: 'degraded', detail: 'Database unavailable' };

  const memoryStatus: SubsystemStatus = database.status === 'online'
    ? { status: 'online' }
    : { status: 'offline', detail: 'Requires database' };

  const traceStatus: SubsystemStatus = database.status === 'online'
    ? { status: 'online' }
    : { status: 'degraded', detail: 'Trace storage unavailable — cognitive responses continue (K12-A45)' };

  // Policy and streaming are pure in-process — always online if runtime is
  const policyStatus: SubsystemStatus = { status: 'online' };
  const streamingStatus: SubsystemStatus = { status: 'online' };

  const criticalSystems = [database, provider, runtimeStatus, memoryStatus];
  const anyCriticalDown = criticalSystems.some(s => s.status === 'offline');
  const anyDegraded = criticalSystems.some(s => s.status === 'degraded');

  const overall: HermesHealthReport['overall'] = anyCriticalDown
    ? 'unavailable'
    : anyDegraded
      ? 'degraded'
      : 'healthy';

  const report: HermesHealthReport = {
    timestamp: new Date().toISOString(),
    env: process.env.HERMES_ENV || 'development',
    hermesEnabled: true,
    overall,
    subsystems: {
      runtime:   runtimeStatus,
      provider,
      database,
      memory:    memoryStatus,
      policy:    policyStatus,
      trace:     traceStatus,
      streaming: streamingStatus,
    },
  };

  const httpStatus = overall === 'healthy' ? 200 : overall === 'degraded' ? 200 : 503;
  return NextResponse.json(report, { status: httpStatus });
}
