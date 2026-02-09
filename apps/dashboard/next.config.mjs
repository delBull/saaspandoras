// next.config.js

const nextConfig = {
  // 🔧 Evita fallos de tracing en Vercel (muy importante para segmentos como (dashboard))
  experimental: {
    // Note: serverComponentsExternalPackages has been moved to serverExternalPackages
  },
  serverExternalPackages: ["drizzle-orm", "postgres", "@thirdweb-dev/sdk", "ethers"],

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "example.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "api.qrserver.com" },

      // Vercel Blob Storage
      { protocol: "https", hostname: "*.vercel-storage.com" },
      { protocol: "https", hostname: "*.vercel.app" },
      { protocol: "https", hostname: "vercel-storage.com" },
      { protocol: "https", hostname: "vercel.app" },
    ],
  },

  transpilePackages: ["@pandoras/gamification", "@pandoras/protocol-deployer", "ox", "@pandoras/core-webhooks"],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        tls: "tls",
        fs: "fs",
        perf_hooks: "perf_hooks",
        postgres: "postgres",
        "drizzle-orm": "drizzle-orm",
      });
    }

    return config;
  },
};

export default nextConfig;
