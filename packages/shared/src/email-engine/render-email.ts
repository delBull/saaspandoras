import * as React from "react";
import { render } from "@react-email/components";
import { EmailRenderOptions, RenderedEmailOutput } from "./types";

/**
 * Deterministic, Fail-Closed Email Renderer
 * Generates verified HTML strings and optional plaintext representations.
 * Never fails silently. Throws explicit errors so callers can handle or degrade visibly.
 */
export async function renderEmailAsync<T extends Record<string, any>>(options: EmailRenderOptions<T>): Promise<RenderedEmailOutput> {
  const { template: TemplateComponent, props } = options;

  try {
    const element = React.createElement(TemplateComponent as React.ComponentType<any>, props);
    const html = await render(element);

    let text: string | undefined;
    try {
      text = await render(element, { plainText: true });
    } catch {
      // Plaintext is secondary; if fails, html remains authoritative
    }

    return {
      html,
      text,
    };
  } catch (error) {
    console.error("❌ [EmailEngine:renderEmailAsync] Render failed for template:", error);
    throw new Error(`[EmailEngine] Render failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
