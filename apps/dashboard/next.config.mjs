import path from "path";

// next.config.js
// 🚀 Force rebuild for turborepo v2 testing

const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  // 🔧 Evita fallos de tracing en Vercel (muy importante para segmentos como (dashboard))
  experimental: {
    // Note: serverComponentsExternalPackages has been moved to serverExternalPackages
    optimizePackageImports: ["ethers", "viem", "thirdweb", "lucide-react", "@tabler/icons-react", "@heroicons/react"],
    // 🔧 Fix "Request body too large" for API routes with rich text content
    serverActions: {
      bodySizeLimit: '10mb',
    },
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
    minimumCacheTTL: 3600, // 🕒 1 Hour cache for optimized images (Saves CPU/Optimization Costs)
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

      // Pandoras Domains
      { protocol: "https", hostname: "*.pandoras.finance" },
      { protocol: "https", hostname: "pandoras.finance" },
      { protocol: "https", hostname: "dash.pandoras.finance" },
      { protocol: "https", hostname: "staging.dash.pandoras.finance" },
    ],
  },

  transpilePackages: [
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
        source: "/api/v1/widget/v1.js",
        destination: "/scripts/growth-widget.v1.js",
      },
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
            value: "unsafe-none", // 🔧 Fixed: Allows external widgets to retain window.opener
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
