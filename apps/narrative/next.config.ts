import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/narrative",
  experimental: {
    externalDir: true,
  },
  transpilePackages: [
    "@mvp/adapters",
    "@mvp/api",
    "@mvp/core",
    "@mvp/storage",
    "@whetiq/auth",
  ],
  typedRoutes: true,
};

export default nextConfig;
