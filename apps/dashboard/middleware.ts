// Next.js Middleware for Dashboard Security and Rate Limiting
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (production should use Redis)
// TODO: Replace with proper Redis-based rate limiting for production
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';
  const now = Date.now();

  // Rate limiting configuration per endpoint
  const rateLimits = {
    // WhatsApp Multi-Flow endpoints
    '/api/admin/whatsapp/multi-flow': {
      requests: 30,
      windowMs: 5 * 60 * 1000, // 30 requests per 5 minutes for dashboard
    },
    '/api/admin/whatsapp-preapply': {
      requests: 100,
      windowMs: 15 * 60 * 1000, // 100 requests per 15 minutes
    },

    // WhatsApp Webhooks (higher limits for production traffic)
    '/api/whatsapp/webhook': {
      requests: 5000,
      windowMs: 60 * 60 * 1000, // 5000 messages per hour
    },
    '/api/whatsapp/preapply': {
      requests: 5000,
      windowMs: 60 * 60 * 1000,
    },

    // General API limits
    default: {
      requests: 100,
      windowMs: 15 * 60 * 1000, // 100 requests per 15 minutes
    },
  };

  // Get limits for this endpoint
  const limit = rateLimits[pathname as keyof typeof rateLimits] || rateLimits.default;
  const key = `${ip}:${pathname}`;

  // Check current rate limit state
  const current = rateLimitMap.get(key);

  if (current) {
    // Reset counter if time window expired
    if (now > current.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + limit.windowMs });
    } else if (current.count >= limit.requests) {
      // Rate limit exceeded
      console.warn(`🔥 [RATE_LIMIT] IP ${ip} exceeded limit on ${pathname}`);

      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before retrying.',
          rateLimitExceeded: true,
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': limit.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(current.resetTime / 1000).toString(),
          },
        }
      );
    } else {
      // Increment counter for valid request
      current.count++;
      rateLimitMap.set(key, current);
    }
  } else {
    // First request from this IP/endpoint
    rateLimitMap.set(key, { count: 1, resetTime: now + limit.windowMs });
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Security headers for all API responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // WhatsApp-specific headers
  if (pathname.startsWith('/api/whatsapp/')) {
    // Prevent caching for webhook responses
    response.headers.set('Cache-Control', 'private, max-age=0, no-cache, no-store');

    // Add CORS for WhatsApp Business API callbacks
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Rate limit headers for API responses
  const remainingRequests = current ? Math.max(0, limit.requests - current.count) : limit.requests - 1;
  response.headers.set('X-RateLimit-Limit', limit.requests.toString());
  response.headers.set('X-RateLimit-Remaining', remainingRequests.toString());
  if (current) {
    response.headers.set('X-RateLimit-Reset', Math.floor(current.resetTime / 1000).toString());
  }

  // Periodic cleanup (simple garbage collection)
  // In production, use Redis with TTL instead
  if (rateLimitMap.size > 10000) {
    console.log('🧹 Cleaning up rate limit memory...');
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) {
        rateLimitMap.delete(k);
      }
    }
  }

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: [
    // API routes
    '/api/:path*',

    // Admin dashboard routes (for session validation if needed)
    '/admin/:path*',

    // Exclude health checks from rate limiting
    '!/api/health',
    '!/favicon.ico',
  ],
};
