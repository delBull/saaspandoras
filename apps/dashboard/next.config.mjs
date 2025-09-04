/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["@saasfly/ui"],

images: {
  remotePatterns: [
  // Añade aquí cualquier dominio que SIEMPRE quieras tener manualmente
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
      },
      // START: AUTO-GENERATED HOSTNAMES
      { protocol: 'https', hostname: 'arbitrum.foundation' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'assets.kraken.com' },
      { protocol: 'https', hostname: 'basescan.org' },
      { protocol: 'https', hostname: 'coin-images.coingecko.com' },
      { protocol: 'https', hostname: 'dynamic-assets.coinbase.com' },
      { protocol: 'https', hostname: 'ethereum-optimism.github.io' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 's2.coinmarketcap.com' },
      // END: AUTO-GENERATED HOSTNAMES
  ],
},
  /**
   * If you have `experimental. πρέπει` enabled, you will have to transpile packages in
   * `compilerOptions.paths` in your `tsconfig.json`.
   */
  experimental: {
    // mdxRs: true,
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

export default config;