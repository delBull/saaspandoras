import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { getRedis } from '../lib/redis.js';

// Middleware for general API rate limiting
export const apiLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 100, // 100 requests per minute
    keyGenerator: (req) => {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        return ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    skip: (req) => {
        return req.path === '/health' || req.path === '/';
    }
});

// Stricter limiter for authentication endpoints (login)
export const authLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // 5 attempts per window
    keyGenerator: (req) => {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const address = req.body?.address || 'unknown';
        return `auth:${ip}:${address}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again in 15 minutes.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});

// Very strict limiter for nonce generation (prevent spam)
export const nonceLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 3, // Only 3 nonces per 15 minutes
    keyGenerator: (req) => {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const address = req.query?.address || 'unknown';
        return `nonce:${ip}:${address}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many nonce requests, please wait before requesting a new one.',
        code: 'NONCE_RATE_LIMIT_EXCEEDED'
    }
});

// Middleware for refresh token endpoint
export const refreshLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // 20 refreshes per 15 minutes
    keyGenerator: (req) => {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        return `refresh:${ip}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many refresh requests.',
        code: 'REFRESH_RATE_LIMIT_EXCEEDED'
    }
});
