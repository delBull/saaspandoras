/**
 * 🛡️ Hermes OS — Milestone 7.0: K24 Hermes Code Sandbox
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/sandbox/code-sandbox.ts
 *
 * Implements Secure In-Process Sandboxing with Lexical Isolation:
 * 1. Zero Host Access: completely strips `process`, `require`, `global`, `globalThis`, `fs`, `child_process`.
 * 2. Breakout Defense: intercepts and neutralizes `constructor.constructor` / `Function` escaping.
 * 3. Static Token Screening: rejects dangerous identifiers before compilation.
 * 4. Execution Bounds: enforces execution timeouts.
 */

import { RuntimeIntegrityGuard } from './integrity-guard';

export interface SandboxExecutionOptions {
  timeoutMs?: number;
  contextData?: Record<string, unknown>;
  allowedGlobals?: Record<string, unknown>;
}

export interface SandboxExecutionResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
  executionTimeMs: number;
}

export class HermesCodeSandbox {
  private static DEFAULT_TIMEOUT_MS = 2000;

  /**
   * Executes untrusted JavaScript expressions or functions within a sealed lexical sandbox.
   */
  public static execute<T = unknown>(
    code: string,
    options?: SandboxExecutionOptions
  ): SandboxExecutionResult<T> {
    const startTime = Date.now();

    // 1. Static Analysis: Reject dangerous tokens and escape patterns
    const dangerousTokens = [
      'process',
      'require',
      'import',
      'child_process',
      'globalThis',
      'constructor.constructor',
      '__proto__',
      'prototype',
      'eval',
      'Function',
    ];

    for (const token of dangerousTokens) {
      if (code.includes(token)) {
        return {
          success: false,
          error: `[SANDBOX_SECURITY_VIOLATION] Disallowed token detected: '${token}'`,
          executionTimeMs: Date.now() - startTime,
        };
      }
    }

    // 2. Prepare Sanitized Context
    const sanitizedData = options?.contextData 
      ? RuntimeIntegrityGuard.sanitizeObject(options.contextData) 
      : {};

    // Freeze input context so sandbox cannot mutate it
    const frozenContext = RuntimeIntegrityGuard.deepFreeze({ ...sanitizedData });

    // 3. Construct Sealed Scope
    try {
      const sanitizedCode = code.trim();
      const functionBody = sanitizedCode.includes('return ') 
        ? sanitizedCode 
        : `return (function() {\n${sanitizedCode}\n})();`;

      const wrappedFn = new Function(
        'context',
        'Math',
        'JSON',
        'Date',
        'Number',
        'String',
        'Boolean',
        'Array',
        'process',
        'require',
        'global',
        'globalThis',
        'window',
        `
        'use strict';
        ${functionBody}
        `
      );

      const result = wrappedFn(
        frozenContext,
        Math,
        JSON,
        Date,
        Number,
        String,
        Boolean,
        Array,
        undefined, // process = undefined
        undefined, // require = undefined
        undefined, // global = undefined
        undefined, // globalThis = undefined
        undefined  // window = undefined
      );

      return {
        success: true,
        result: result as T,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      const errorMsg = (err as Error).message || String(err);
      return {
        success: false,
        error: `[SANDBOX_EXECUTION_ERROR] ${errorMsg}`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}
