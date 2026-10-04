/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@saasfly/api",
    "@saasfly/db",
    "@saasfly/ui",
    "@pandoras/display-engine",
    "@pandoras/identity-sdk"
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
