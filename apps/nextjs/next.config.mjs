/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Ensure we can bundle Node.js built-ins and ignore optional peer deps
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
        tls: false,
        crypto: false,
        perf_hooks: false,
        bufferutil: false,
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
}

export default nextConfig;
