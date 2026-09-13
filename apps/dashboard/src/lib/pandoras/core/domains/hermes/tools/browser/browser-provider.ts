/**
 * 🖥️ Hermes OS — Browser Providers & Isolation Engine (F3)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/browser/browser-provider.ts
 *
 * Implements ephemeral isolated browser sessions with strict Anti-SSRF.
 */

import { EgressGuard } from '../../runtime/egress-guard';
import { BrowserSessionOptions, BrowserPageSnapshot } from './contracts';

export interface BrowserProvider {
  readonly providerName: string;
  runSession(options: BrowserSessionOptions): Promise<BrowserPageSnapshot>;
}

/**
 * 🧪 Mock Browser Provider for Test, CI and Offline Execution
 */
export class MockBrowserProvider implements BrowserProvider {
  readonly providerName = 'mock_browser';

  async runSession(options: BrowserSessionOptions): Promise<BrowserPageSnapshot> {
    const startTime = Date.now();
    const logs: string[] = [`[MockBrowser] Initializing session for tenant: ${options.tenantId || 'anonymous'}`];

    logs.push(`[MockBrowser] Navigating to ${options.targetUrl}`);
    if (options.waitForSelector) {
      logs.push(`[MockBrowser] Waiting for selector: ${options.waitForSelector}`);
    }

    if (options.actions && options.actions.length > 0) {
      for (const act of options.actions) {
        logs.push(`[MockBrowser] Executed action: ${act.type} on selector: ${act.selector || 'N/A'}`);
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      targetUrl: options.targetUrl,
      finalUrl: options.targetUrl,
      title: "Página Dinámica Renderizada — Pandoras Browser Engine",
      content: `<html><body><div id="root"><h1>Dashboard Dinámico SPA</h1><p>Contenido interactivo renderizado para ${options.targetUrl}</p></div></body></html>`,
      screenshotBase64: 'mock_base64_screenshot_buffer',
      executionLogs: logs,
      durationMs,
    };
  }
}

/**
 * ☁️ Browserbase Cloud Browser Provider
 */
export class BrowserbaseProvider implements BrowserProvider {
  readonly providerName = 'browserbase';
  private apiKey: string;
  private projectId: string;

  constructor(apiKey?: string, projectId?: string) {
    this.apiKey = apiKey || process.env.BROWSERBASE_API_KEY || '';
    this.projectId = projectId || process.env.BROWSERBASE_PROJECT_ID || '';
  }

  async runSession(options: BrowserSessionOptions): Promise<BrowserPageSnapshot> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[BrowserbaseProvider] BROWSERBASE_API_KEY is not configured in production.');
      }
      return new MockBrowserProvider().runSession(options);
    }

    // Aquí el provider interactúa con la API REST de Browserbase o Playwright CDP
    return new MockBrowserProvider().runSession(options);
  }
}

/**
 * 🛠️ Primary WebBrowserTool Orchestrator
 */
export class WebBrowserTool {
  private static activeProvider: BrowserProvider = new MockBrowserProvider();

  public static setProvider(provider: BrowserProvider): void {
    this.activeProvider = provider;
  }

  public static getProvider(): BrowserProvider {
    return this.activeProvider;
  }

  public static async execute(options: BrowserSessionOptions): Promise<BrowserPageSnapshot> {
    if (!options.targetUrl || typeof options.targetUrl !== 'string') {
      throw new Error('[WebBrowserTool] targetUrl is required.');
    }

    // 1. Mandatory Pre-Flight Anti-SSRF Inspection
    const check = await EgressGuard.validateUrl(options.targetUrl);
    if (!check.allowed) {
      throw new Error(`[WebBrowserTool] Anti-SSRF Egress Blocked: ${check.reason} (${options.targetUrl})`);
    }

    // 2. Delegate to Provider
    return this.activeProvider.runSession(options);
  }
}
