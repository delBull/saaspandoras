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
      };
    }
    return config;
  },
}

export default nextConfig;
