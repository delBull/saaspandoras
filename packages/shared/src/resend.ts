/**
 * ⚠️ DEPRECATED CLIENT — use `sendEmail` from '@saasfly/shared' (email-engine/send.ts) for all sends.
 * Kept only to export FROM_EMAIL for legacy callers (note: legacy fallback 'hello@' differs
 * from engine default 'noreply@' — RESEND_FROM_EMAIL env wins in both). Do not add new imports of `resend` here.
 */
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@pandoras.finance';