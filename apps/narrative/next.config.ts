import { resolve } from "node:path";
import type { NextConfig } from "next";

type WebpackAliasMap = Record<string, string | false>;

type ResolvedWebpackConfig = {
  resolve?: {
    alias?: WebpackAliasMap;
  };
};

const workspaceAliases = {
  "@mvp/adapters": resolve(__dirname, "../../packages/adapters/dist/index.js"),
  "@mvp/api": resolve(__dirname, "../../packages/api/dist/index.js"),
  "@mvp/api/services/narrative-parser": resolve(
    __dirname,
    "../../packages/api/dist/services/narrative-parser.js",
  ),
  "@mvp/api/services/narrative-tailoring": resolve(
    __dirname,
    "../../packages/api/dist/services/narrative-tailoring.js",
  ),
  "@mvp/core": resolve(__dirname, "../../packages/core/dist/index.js"),
  "@mvp/storage": resolve(__dirname, "../../packages/storage/dist/index.js"),
  "@whetiq/auth": resolve(__dirname, "../../packages/auth/src/index.ts"),
};

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
  webpack(config) {
    const resolvedConfig = config as ResolvedWebpackConfig;
    const existingAliases = resolvedConfig.resolve?.alias ?? {};

    resolvedConfig.resolve = {
      ...(resolvedConfig.resolve ?? {}),
      alias: {
        ...existingAliases,
        ...workspaceAliases,
      },
    };

    return resolvedConfig;
  },
};

export default nextConfig;
