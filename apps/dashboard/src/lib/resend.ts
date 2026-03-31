import { Resend } from 'resend';

// Get API key from environment
const apiKey = process.env.RESEND_API_KEY;

/**
 * Build-safe Resend client.
 * Using a placeholder during build-time prevents the 'Missing API key' error
 * that occurs when Next.js statically analyzes API routes.
 */
export const resend = new Resend(apiKey || 're_123456789');

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@pandoras.finance';
