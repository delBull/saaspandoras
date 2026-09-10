/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Prevent heavy server-only libs from being bundled into every serverless function.
  // These are required at runtime but should not be inlined into the lambda bundle,
  // reducing Function Storage consumption and cold start time.
  serverExternalPackages: [
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'sharp',
    'canvas',
    'puppeteer',
    'playwright',
  ],

  experimental: {
    // Reduce memory usage during build
    memoryBasedWorkersCount: true,
    // Enable webpack build worker to prevent main thread memory leaks
    webpackBuildWorker: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Ensure we can bundle Node.js built-ins correctly if they are referenced
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        perf_hooks: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    // Server-side: mark ws native addons as external to prevent unmask errors
    if (isServer) {
      config.externals = [...(config.externals || []), 'bufferutil', 'utf-8-validate'];
    }
    return config;
  },
  async headers() {
    return [
      // ── Global Security Headers ──────────────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          // Wallet-connect requires unsafe-none for COOP (thirdweb popup flows)
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },

          // Prevent MIME-type sniffing attacks
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Control referrer leakage
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Restrict browser features (mic allowed same-origin for Hermes terminal voice; no camera/geolocation)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=()',
          },

          // HSTS: force HTTPS for 1 year (only applies on HTTPS connections)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },

          // Content Security Policy — allows Thirdweb, IPFS, Vercel, and app domains.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.thirdweb.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: ipfs:",
              "connect-src 'self' https: wss: data:",
              "frame-src 'self' https://*.thirdweb.com https://*.pandoras.finance",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },

      // ── API Routes: force no caching on auth/sensitive endpoints ─────────
      {
        source: '/api/nexus/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, private' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/api/v1/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
    ];
  },
}

export default nextConfig;

