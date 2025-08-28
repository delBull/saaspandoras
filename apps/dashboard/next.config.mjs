/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["@saasfly/ui"],

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
