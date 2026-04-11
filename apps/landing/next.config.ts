import type { NextConfig } from "next";

type WorkspaceWebpackConfig = {
  resolve?: {
    extensionAlias?: Record<string, string[]>;
  };
};

function withWorkspaceExtensionAliases(nextConfig: NextConfig): NextConfig {
  return {
    ...nextConfig,
    webpack(config: WorkspaceWebpackConfig): WorkspaceWebpackConfig {
      const resolve = config.resolve ?? {};
      resolve.extensionAlias = {
        ...(resolve.extensionAlias ?? {}),
        ".js": [".ts", ".tsx", ".js"],
        ".mjs": [".mts", ".mjs"],
        ".cjs": [".cts", ".cjs"],
      };
      config.resolve = resolve;

      return config;
    },
  };
}

const nextConfig = withWorkspaceExtensionAliases({
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
});

export default nextConfig;
