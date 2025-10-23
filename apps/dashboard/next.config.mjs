import path from 'path';

const nextConfig = {
  // Explicitly set workspace root to avoid detecting multiple lockfiles
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  transpilePackages: [
    "@pandoras/gamification",
  ],
};

export default nextConfig;
