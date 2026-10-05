import { Resend } from "resend";

import { env } from "./env.mjs";

let cachedClient: Resend | undefined;

function getResendClient(): Resend {
  if (!cachedClient) {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      // Fail-closed at USE time (never at import time, so Next.js static
      // analysis / test collection of unrelated modules does not crash).
      throw new Error("NOT_CONFIGURED: RESEND_API_KEY is not set");
    }
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

/**
 * Lazily-initialised Resend client. Same public API as before
 * (`resend.emails.send(...)`), but constructed on first use.
 */
export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return Reflect.get(getResendClient() as object, prop);
  },
});
