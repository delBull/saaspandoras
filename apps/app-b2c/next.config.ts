import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required to bypass thirdweb / coinbase cdp-sdk missing @x402 optional peer dependencies
  serverExternalPackages: ['@x402/core', '@x402/evm', '@x402/svm', 'bufferutil', 'utf-8-validate'],
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
    return config;
  },
  experimental: {
    // @ts-expect-error - Required by Railway's Next16 Turbopack build to silence webpack config collision
    turbopack: {}
  }
};

export default nextConfig;
