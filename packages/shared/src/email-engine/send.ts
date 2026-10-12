import { Resend } from "resend";
import { SendEmailPayload } from "./types";

const apiKey = process.env.RESEND_API_KEY;
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "noreply@pandoras.finance";

let cachedResend: Resend | null = null;

function getResend(): Resend | null {
  if (!cachedResend && apiKey) {
    cachedResend = new Resend(apiKey);
  }
  return cachedResend;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Canonical email dispatch function.
 * Wraps Resend dispatch with strict error handling, fail-closed production semantics,
 * and safe mock fallbacks for local dev without secrets.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const { to, subject, html, text, react, from = DEFAULT_FROM, replyTo, headers, tags, attachments } = payload;
  const client = getResend();

  if (!client) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ [EmailEngine:sendEmail] RESEND_API_KEY missing in production environment");
      return { success: false, error: "NOT_CONFIGURED: RESEND_API_KEY is missing in production" };
    }
    console.warn("⚠️ [EmailEngine:sendEmail] RESEND_API_KEY missing. Mocking dispatch to:", to);
    return { success: true, id: "mock_bafkrei_email_" + Date.now() };
  }

  try {
    const toArray = Array.isArray(to) ? to : [to];
    const emailParams: any = {
      from,
      to: toArray,
      subject,
      reply_to: replyTo,
      headers,
      tags,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
      })),
    };

    if (react) {
      emailParams.react = react;
    } else if (html) {
      emailParams.html = html;
    }

    if (text) {
      emailParams.text = text;
    }

    const { data, error } = await client.emails.send(emailParams);

    if (error) {
      console.error("❌ [EmailEngine:sendEmail] Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("❌ [EmailEngine:sendEmail] Exception during dispatch:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
