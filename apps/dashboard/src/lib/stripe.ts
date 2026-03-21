import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY;

/**
 * Build-safe Stripe client.
 * Provides a placeholder key during build-time to prevent Next.js 15 
 * static analysis from failing when environment variables are missing.
 */
export const stripe = new Stripe(apiKey || 'sk_test_build_placeholder', {
  apiVersion: '2024-04-10' as any,
  typescript: true,
});
