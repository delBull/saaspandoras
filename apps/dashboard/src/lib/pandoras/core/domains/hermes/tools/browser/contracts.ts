/**
 * 🌐 Hermes OS — Browser Intelligence Contracts (F3)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/browser/contracts.ts
 */

export type BrowserActionType = 
  | 'NAVIGATE'
  | 'CLICK'
  | 'FILL'
  | 'WAIT_FOR_SELECTOR'
  | 'SCREENSHOT'
  | 'EXTRACT_TEXT';

export interface BrowserInteractionAction {
  type: BrowserActionType;
  selector?: string;
  value?: string;
  timeoutMs?: number;
}

export interface BrowserSessionOptions {
  targetUrl: string;
  actions?: BrowserInteractionAction[];
  waitForSelector?: string;
  viewport?: { width: number; height: number };
  timeoutMs?: number;
  tenantId?: string;
}

export interface BrowserPageSnapshot {
  targetUrl: string;
  finalUrl: string;
  title: string;
  content: string;
  screenshotBase64?: string;
  executionLogs: string[];
  durationMs: number;
}
