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

  // Turbopack ignores the webpack `resolve.fallback` below; stub Node builtins for the browser only.
  turbopack: {
    resolveAlias: {
      dns: { browser: './src/lib/empty-module.js' },
      'node:dns': { browser: './src/lib/empty-module.js' },
      net: { browser: './src/lib/empty-module.js' },
      'node:net': { browser: './src/lib/empty-module.js' },
      tls: { browser: './src/lib/empty-module.js' },
      fs: { browser: './src/lib/empty-module.js' },
      'util/types': { browser: './src/lib/empty-module.js' },
      perf_hooks: { browser: './src/lib/empty-module.js' },
      'node:diagnostics_channel': { browser: './src/lib/empty-module.js' },
    },
  },

  experimental: {
    // Reduce memory usage during build
    memoryBasedWorkersCount: true,
    // Enable webpack build worker to prevent main thread memory leaks
    webpackBuildWorker: true,
    // Fix Next.js 14+ barrel file imports for client components
    optimizePackageImports: [
      '@saasfly/shared',
      '@saasfly/db-core',
      '@saasfly/hermes-core',
      '@saasfly/auth-sdk',
      '@saasfly/nexus-deals-sdk'
    ],
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
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core': false,
      '@x402/core/client': false,
      '@x402/evm': false,
      '@x402/evm/exact/client': false,
      '@x402/evm/upto/client': false,
      '@x402/svm': false,
      '@x402/svm/exact/client': false,
      '@x402/extensions': false,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        'node:net': false,
        tls: false,
        crypto: false,
        perf_hooks: false,
        bufferutil: false,
        dns: false,
        'node:dns': false,
        'node:diagnostics_channel': false,
        'util/types': false,
        'utf-8-validate': false,
        '@x402/core': false,
        '@x402/core/client': false,
        '@x402/evm': false,
        '@x402/evm/exact/client': false,
        '@x402/evm/upto/client': false,
        '@x402/svm': false,
        '@x402/svm/exact/client': false,
        '@x402/extensions': false,
      };
    }
    // Server-side: mark ws native addons as external to prevent unmask errors
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'bufferutil',
        'utf-8-validate',
        '@x402/core',
        '@x402/core/client',
        '@x402/evm',
        '@x402/evm/exact/client',
        '@x402/evm/upto/client',
        '@x402/svm',
        '@x402/svm/exact/client',
        '@x402/extensions',
      ];
    }
    return config;
  },
  async redirects() {
    return [
      // ── Historically promoted sovereign booking link → canonical /schedule route ──
      {
        source: '/p/scheduling/:slug',
        destination: '/schedule/:slug',
        permanent: false,
      },
      {
        source: '/p/scheduling/:slug/:path*',
        destination: '/schedule/:slug/:path*',
        permanent: false,
      },
    ];
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
              "frame-src 'self' https://*.thirdweb.com https://*.pandoras.finance https://verify.walletconnect.org https://*.walletconnect.org https://8x8.vc https://*.8x8.vc https://meet.jit.si",
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

