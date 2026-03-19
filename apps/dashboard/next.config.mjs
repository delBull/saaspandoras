// next.config.js

const nextConfig = {
  // 🔧 Evita fallos de tracing en Vercel (muy importante para segmentos como (dashboard))
  experimental: {
    // Note: serverComponentsExternalPackages has been moved to serverExternalPackages
    optimizePackageImports: ["ethers", "viem", "thirdweb", "lucide-react", "@tabler/icons-react", "@heroicons/react"]
  },
  serverExternalPackages: ["drizzle-orm", "postgres"],

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  typescript: {
    // !! ADVERTENCIA !!
    // Se desactiva el chequeo de tipos durante el build para evitar el error SIGABRT (Memoria Insuficiente)
    // causado por esquemas de Zod muy complejos. El chequeo debe hacerse localmente o en un paso previo.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Desactivado durante build para acelerar el proceso y evitar crashes de memoria.
    ignoreDuringBuilds: true,
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

  transpilePackages: [
    "@pandoras/core-webhooks",
    "@saasfly/ui",
    "react-markdown",
    "remark-gfm",
    "rehype-highlight",
    "jose",
    "viem",
    "thirdweb"
  ],

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

      // 🛡️ SES / Lockdown Nuke
      // Prevent these packages from being bundled in the client
      config.resolve.alias = {
        ...config.resolve.alias,
        'ses': false,
        'lockdown': false,
        '@endo/env-options': false,
      };
    }

    return config;
  },

  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://api.pandoras.finance"}/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups", // 🔧 Fixed: Allows social login popups
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
