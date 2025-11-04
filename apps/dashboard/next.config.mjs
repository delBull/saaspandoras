import path from 'path';

const nextConfig = {
  // Explicitly set workspace root to avoid detecting multiple lockfiles
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
  transpilePackages: [
    "@pandoras/gamification",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client-side bundle
      config.externals = config.externals || [];
      config.externals.push({
        'tls': 'tls',
        'fs': 'fs',
        'perf_hooks': 'perf_hooks',
        'postgres': 'postgres',
        'drizzle-orm': 'drizzle-orm'
      });
    }

    return config;
  },
};

export default nextConfig;
