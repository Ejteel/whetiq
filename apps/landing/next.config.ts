import { resolve } from "node:path";
import type { NextConfig } from "next";

type WebpackAliasMap = Record<string, string | false>;

type ResolvedWebpackConfig = {
  resolve?: {
    alias?: WebpackAliasMap;
  };
};

const workspaceAliases = {
  "@mvp/core": resolve(__dirname, "../../packages/core/dist/index.js"),
  "@whetiq/auth": resolve(__dirname, "../../packages/auth/src/index.ts"),
};

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@mvp/core", "@whetiq/auth"],
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
  async rewrites() {
    const narrativeUrl = process.env.NARRATIVE_URL;
    const workspaceUrl = process.env.WORKSPACE_URL;
    const rewrites = [];

    if (narrativeUrl) {
      rewrites.push({
        source: "/narrative/:path*",
        destination: `${narrativeUrl.replace(/\/$/, "")}/narrative/:path*`,
      });
    }

    if (workspaceUrl) {
      rewrites.push({
        source: "/workspace/:path*",
        destination: `${workspaceUrl.replace(/\/$/, "")}/workspace/:path*`,
      });
    }

    return rewrites;
  },
};

export default nextConfig;
