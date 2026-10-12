/**
 * email.ts — Academy Email Client
 *
 * Thin wrapper around @saasfly/shared resend client.
 * Server-only — never import from client components.
 */

import { sendEmail as sharedSendEmail } from '@saasfly/shared';

interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const result = await sharedSendEmail({
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (!result.success) {
    throw new Error(`[Academy Email] Send error: ${result.error}`);
  }
}
