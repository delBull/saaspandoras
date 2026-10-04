/**
 * email.ts — Academy Email Client
 *
 * Thin wrapper around @saasfly/shared resend client.
 * Server-only — never import from client components.
 */

import { resend } from '@saasfly/shared';

interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const result = await resend.emails.send({
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if ('error' in result && result.error) {
    throw new Error(`[Academy Email] Resend error: ${JSON.stringify(result.error)}`);
  }
}
