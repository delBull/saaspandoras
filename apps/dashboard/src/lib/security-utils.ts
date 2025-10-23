/**
 * Utilidades de seguridad básicas para protección inmediata
 * Implementación simple y efectiva sin romper funcionalidad existente
 */

/**
 * Campos sensibles que deben ser ocultados en logs
 */
const SENSITIVE_FIELDS = [
  'applicantEmail',
  'applicantPhone',
  'kycData',
  'password',
  'token',
  'secret',
  'privateKey',
  'walletPrivateKey',
  'ssn',
  'socialSecurityNumber',
  'taxId',
  'bankAccount',
  'creditCard'
];

/**
 * Sanitiza datos sensibles en objetos para logging seguro
 */
export function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Para strings largos, solo mostrar preview
    if (data.length > 100) {
      return `${data.substring(0, 50)}...[TRUNCATED]`;
    }
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeLogData(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.some(field =>
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Rate limiting simple por IP/request identifier
 */
class SimpleRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute default
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) ?? [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Instancias globales de rate limiters
export const apiRateLimiter = new SimpleRateLimiter(1000, 60000); // 1000 requests per minute for APIs
export const authRateLimiter = new SimpleRateLimiter(5, 60000); // 5 auth attempts per minute

/**
 * Valida estructura básica de request body
 */
export function validateRequestBody(body: unknown): { isValid: boolean; error?: string } {
  if (body === null || body === undefined) {
    return { isValid: false, error: 'Request body is required' };
  }

  if (typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be an object' };
  }

  // Check for potentially malicious content
  const bodyString = JSON.stringify(body);
  if (bodyString.length > 1024 * 1024) { // 1MB limit
    return { isValid: false, error: 'Request body too large' };
  }

  return { isValid: true };
}

/**
 * Sanitiza strings para prevenir XSS básico
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Valida formato de email básico
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida dirección de wallet Ethereum
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Middleware de seguridad básico para API routes
 */
export function withSecurity<T extends unknown[]>(
  handler: (request: Request, ...args: T) => Promise<Response>,
  options: {
    rateLimit?: SimpleRateLimiter;
    requireAuth?: boolean;
    maxBodySize?: number;
  } = {}
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      // 1. Rate limiting
      if (options.rateLimit) {
        const identifier = request.headers.get('x-forwarded-for') ??
                          request.headers.get('x-real-ip') ??
                          'unknown';

        if (!options.rateLimit.isAllowed(identifier)) {
          return new Response(
            JSON.stringify({ message: 'Rate limit exceeded' }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // 2. Body validation for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json() as unknown;
          const validation = validateRequestBody(body);

          if (!validation.isValid) {
            return new Response(
              JSON.stringify({ message: validation.error }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        } catch (error) {
          return new Response(
            JSON.stringify({ message: 'Invalid JSON body' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // 3. Execute original handler
      return await handler(request, ...args);

    } catch (error) {
      console.error('Security middleware error:', sanitizeLogData({
        error: error instanceof Error ? error.message : 'Unknown error',
        method: request.method,
        url: request.url
      }));

      return new Response(
        JSON.stringify({ message: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}