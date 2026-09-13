/**
 * 📦 Hermes OS — Browser Intelligence Public API (F3)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/browser/index.ts
 */

import { HermesToolExecutor } from '../../runtime/tool-executor';
import { WebBrowserTool } from './browser-provider';

export * from './contracts';
export * from './browser-provider';

/**
 * Registers browser execution tools into HermesToolExecutor.
 */
export function registerBrowserTools(executor: HermesToolExecutor): void {
  executor.registerHandler('web.browser', async (params, context) => {
    const targetUrl = (params as any)?.targetUrl || (params as any)?.url;
    const actions = (params as any)?.actions;
    const waitForSelector = (params as any)?.waitForSelector;
    const tenantId = (params as any)?.tenantId || (context as any)?.organizationId;

    return WebBrowserTool.execute({
      targetUrl,
      actions,
      waitForSelector,
      tenantId,
    });
  });
}
