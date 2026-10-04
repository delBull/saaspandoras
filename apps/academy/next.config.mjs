import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = (p) => path.resolve(here, "../../packages", p);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@saasfly/api",
    "@saasfly/db",
    "@saasfly/ui",
    "@saasfly/shared",
    "@saasfly/hermes-core",
    "@saasfly/auth-sdk",
    "@saasfly/db-core",
    "@saasfly/nexus-deals-sdk",
    "@saasfly/academy-sdk",
    "@pandoras/display-engine",
    "@pandoras/identity-sdk"
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@saasfly/shared$": pkg("shared/src/index.ts"),
      "@saasfly/hermes-core$": pkg("hermes-core/src/index.ts"),
      "@saasfly/auth-sdk$": pkg("auth-sdk/src/index.ts"),
      "@saasfly/db$": pkg("db/index.ts"),
      "@saasfly/api$": pkg("api/src/index.ts"),
      "@saasfly/db-core$": pkg("db-core/src/index.ts"),
      "@saasfly/db-core/schema$": pkg("db-core/src/schema.ts"),
      "@saasfly/nexus-deals-sdk$": pkg("nexus-deals-sdk/src/index.ts"),
      "@saasfly/academy-sdk/client$": pkg("academy-sdk/src/client.ts"),
      "@saasfly/academy-sdk$": pkg("academy-sdk/src/index.ts"),
    };
    return config;
  },
};

export default nextConfig;
